import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'crypto';
import {
  Prisma,
  RedemptionStatus,
  RewardStatus,
  TransactionSource,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { paginate } from '../../../common/pagination/paginator';
import { PaginatedResponse } from '../../../common/interfaces';
import { RewardCatalogService } from './reward-catalog.service';
import { RewardEligibilityService } from './reward-eligibility.service';
import { VoucherService } from './voucher.service';
import { RewardsCacheService } from './rewards-cache.service';
import { RewardAnalyticsService } from './reward-analytics.service';
import { RedeemRewardDto, VoucherQueryDto } from '../dto';
import { RedemptionResponse, EligibilityResult } from '../interfaces';
import { REWARDS_ERRORS, REWARD_ANALYTICS_EVENTS } from '../constants';
import { NOTIFICATION_EVENTS } from '../../notification/constants';
import {
  RewardRedeemedEvent,
  VoucherGeneratedEvent,
} from '../../notification/events';

/**
 * Orchestrates spending coins on a reward.
 *
 * Ordering is deliberate: stock is claimed atomically first, then the wallet
 * is debited through WalletService (the only component allowed to move
 * balances), then the voucher is minted. If the debit fails the stock claim is
 * released, so a failed payment never consumes inventory.
 */
@Injectable()
export class RewardRedemptionService {
  private readonly logger = new Logger(RewardRedemptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly catalogService: RewardCatalogService,
    private readonly eligibilityService: RewardEligibilityService,
    private readonly voucherService: VoucherService,
    private readonly cache: RewardsCacheService,
    private readonly analytics: RewardAnalyticsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkEligibility(userId: string, idOrSlug: string): Promise<EligibilityResult> {
    const reward = await this.catalogService.findRewardForRedemption(idOrSlug);
    return this.eligibilityService.check(userId, reward);
  }

  async redeem(
    userId: string,
    idOrSlug: string,
    dto: RedeemRewardDto,
    context: { ip?: string; device?: string },
  ): Promise<RedemptionResponse> {
    const reward = await this.catalogService.findRewardForRedemption(idOrSlug);

    await this.analytics.track(REWARD_ANALYTICS_EVENTS.REDEEM_ATTEMPT, {
      rewardId: reward.id,
      userId,
    });

    // Idempotency key makes client retries safe. Without one we derive a
    // per-user, per-reward, per-minute key so a double-click cannot double-spend.
    const idempotencyKey =
      dto.idempotencyKey ?? this.deriveIdempotencyKey(userId, reward.id);

    const existing = await this.prisma.rewardRedemption.findUnique({
      where: { idempotencyKey },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new ConflictException(REWARDS_ERRORS.DUPLICATE_REDEMPTION);
    }

    const eligibility = await this.eligibilityService.check(userId, reward);
    if (!eligibility.eligible) {
      await this.analytics.track(REWARD_ANALYTICS_EVENTS.REDEEM_FAILED, {
        rewardId: reward.id,
        userId,
        metadata: { reason: eligibility.reason },
      });
      throw new BadRequestException(eligibility.reason ?? REWARDS_ERRORS.REWARD_NOT_AVAILABLE);
    }

    const storeId = await this.eligibilityService.resolveStoreId(userId, dto.storeId);

    // ── 1. Claim stock atomically ───────────────────────
    const stockClaimed = await this.claimStock(reward.id);
    if (!stockClaimed) {
      await this.analytics.track(REWARD_ANALYTICS_EVENTS.REDEEM_FAILED, {
        rewardId: reward.id,
        userId,
        metadata: { reason: REWARDS_ERRORS.OUT_OF_STOCK },
      });
      throw new BadRequestException(REWARDS_ERRORS.OUT_OF_STOCK);
    }

    // ── 2. Create the pending redemption ────────────────
    let redemptionId: string;
    try {
      const redemption = await this.prisma.rewardRedemption.create({
        data: {
          rewardId: reward.id,
          userId,
          storeId,
          status: RedemptionStatus.PENDING,
          coinsSpent: reward.coinCost,
          idempotencyKey,
          ipAddress: context.ip,
          deviceInfo: context.device,
        },
        select: { id: true },
      });
      redemptionId = redemption.id;
    } catch (error) {
      await this.releaseStock(reward.id);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Concurrent request with the same key beat us here.
        throw new ConflictException(REWARDS_ERRORS.DUPLICATE_REDEMPTION);
      }
      throw error;
    }

    // ── 3. Debit through WalletService (single balance owner) ──
    let newBalance: number;
    let walletTxnId: string | null = null;
    try {
      const debitResult = await this.walletService.debit(
        {
          userId,
          amount: reward.coinCost,
          source: TransactionSource.REWARD_REDEMPTION,
          description: `Redeemed: ${reward.title}`,
          idempotencyKey: `reward-redemption:${redemptionId}`,
          referenceId: redemptionId,
          referenceType: 'REWARD_REDEMPTION',
          metadata: { rewardId: reward.id, rewardSlug: reward.slug },
        },
        undefined,
        context.ip,
        context.device,
      );
      newBalance = debitResult.newBalance;
      walletTxnId = debitResult.transaction.id;
    } catch (error) {
      // Payment failed — undo the inventory claim and record the failure.
      await this.releaseStock(reward.id);
      await this.prisma.rewardRedemption.update({
        where: { id: redemptionId },
        data: {
          status: RedemptionStatus.FAILED,
          failureReason:
            error instanceof Error ? error.message.slice(0, 500) : 'Wallet debit failed',
        },
      });
      await this.analytics.track(REWARD_ANALYTICS_EVENTS.REDEEM_FAILED, {
        rewardId: reward.id,
        userId,
        metadata: { reason: 'WALLET_DEBIT_FAILED' },
      });
      throw error;
    }

    // ── 4. Mint the voucher and complete ────────────────
    const voucherRow = await this.prisma.$transaction(async (tx) => {
      const created = await this.voucherService.createVoucher(tx, {
        redemptionId,
        rewardId: reward.id,
        userId,
        storeId,
        validDays: reward.voucherValidDays,
      });

      await tx.rewardRedemption.update({
        where: { id: redemptionId },
        data: { status: RedemptionStatus.COMPLETED, walletTxnId },
      });

      await tx.reward.update({
        where: { id: reward.id },
        data: { totalRedemptions: { increment: 1 } },
      });

      return created;
    });

    await this.cache.incrementDailyRedemptionCount(reward.id);
    await this.cache.invalidateReward(reward.id, reward.slug);
    await this.markSoldOutIfNeeded(reward.id);

    await this.analytics.track(REWARD_ANALYTICS_EVENTS.REDEEM_SUCCESS, {
      rewardId: reward.id,
      userId,
      metadata: { coinsSpent: reward.coinCost, redemptionId },
    });

    this.logger.log(
      `Reward redeemed: ${reward.slug} by user ${userId} | ${reward.coinCost} coins | redemption=${redemptionId}`,
    );

    const voucher = await this.voucherService.getUserVoucher(userId, voucherRow.id);

    // Domain events — the rewards module never writes notification rows.
    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.REWARD_REDEEMED,
      new RewardRedeemedEvent(
        userId,
        reward.id,
        reward.title,
        reward.coinCost,
        redemptionId,
      ),
    );
    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.VOUCHER_GENERATED,
      new VoucherGeneratedEvent(
        userId,
        voucherRow.id,
        voucherRow.code,
        reward.title,
        voucherRow.expiresAt,
      ),
    );

    return {
      id: redemptionId,
      status: RedemptionStatus.COMPLETED,
      coinsSpent: reward.coinCost,
      newBalance,
      createdAt: new Date(),
      reward: {
        id: reward.id,
        title: reward.title,
        slug: reward.slug,
        image: reward.image,
      },
      voucher,
    };
  }

  async listUserRedemptions(
    userId: string,
    query: VoucherQueryDto,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const where: Prisma.RewardRedemptionWhereInput = { userId };

    const [rows, total] = await Promise.all([
      this.prisma.rewardRedemption.findMany({
        where,
        include: {
          reward: { select: { id: true, title: true, slug: true, image: true } },
          voucher: { select: { id: true, code: true, status: true, expiresAt: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardRedemption.count({ where }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      status: r.status,
      coinsSpent: r.coinsSpent,
      createdAt: r.createdAt,
      reward: r.reward,
      voucher: r.voucher,
      store: r.store,
    }));

    return paginate(items, total, query.page, query.pageSize);
  }

  /**
   * Decrement stock only when a unit is actually available.
   * The conditional updateMany is the concurrency guard — two simultaneous
   * redemptions of the last unit cannot both succeed.
   */
  private async claimStock(rewardId: string): Promise<boolean> {
    const result = await this.prisma.reward.updateMany({
      where: { id: rewardId, stock: { gt: 0 } },
      data: { stock: { decrement: 1 } },
    });

    if (result.count > 0) return true;

    // No row matched: either unlimited stock (null) or genuinely sold out.
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      select: { stock: true },
    });
    return reward?.stock === null;
  }

  private async releaseStock(rewardId: string): Promise<void> {
    await this.prisma.reward.updateMany({
      where: { id: rewardId, stock: { not: null } },
      data: { stock: { increment: 1 } },
    });
  }

  private async markSoldOutIfNeeded(rewardId: string): Promise<void> {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      select: { stock: true, status: true, slug: true },
    });

    if (reward?.stock === 0 && reward.status === RewardStatus.PUBLISHED) {
      await this.prisma.reward.update({
        where: { id: rewardId },
        data: { status: RewardStatus.SOLD_OUT },
      });
      await this.cache.invalidateReward(rewardId, reward.slug);
    }
  }

  /**
   * Collapses rapid repeat submissions into one logical redemption without
   * blocking a legitimate second redemption later.
   */
  private deriveIdempotencyKey(userId: string, rewardId: string): string {
    const minuteBucket = Math.floor(Date.now() / 60_000);
    return createHash('sha256')
      .update(`${userId}:${rewardId}:${minuteBucket}`)
      .digest('hex')
      .slice(0, 48);
  }
}
