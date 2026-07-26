import { Injectable } from '@nestjs/common';
import { Reward, RewardStatus, RewardAvailability } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { RewardsCacheService } from './rewards-cache.service';
import { EligibilityCheck, EligibilityResult } from '../interfaces';
import { REWARDS_ERRORS } from '../constants';

/**
 * Single place that decides whether a user may redeem a reward.
 *
 * Every check is evaluated server-side; the frontend result is advisory only
 * and is re-run inside the redemption transaction before any coins move.
 */
@Injectable()
export class RewardEligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly cache: RewardsCacheService,
  ) {}

  async check(userId: string, reward: Reward): Promise<EligibilityResult> {
    const checks: EligibilityCheck[] = [];
    const now = new Date();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
        wallet: { select: { balance: true, isActive: true } },
        customerProfile: {
          select: { assignedStoreId: true, assignedStore: { select: { brandId: true } } },
        },
      },
    });

    const balance = user?.wallet ? Number(user.wallet.balance) : 0;
    const shortBy = Math.max(0, reward.coinCost - balance);

    const fail = (name: string, reason: string): EligibilityResult => {
      checks.push({ name, passed: false, reason });
      return { eligible: false, reason, checks, balance, coinCost: reward.coinCost, shortBy };
    };
    const pass = (name: string): void => {
      checks.push({ name, passed: true });
    };

    // ── User & wallet ───────────────────────────────────
    if (!user || !user.isActive || user.deletedAt) {
      return fail('userActive', REWARDS_ERRORS.USER_INACTIVE);
    }
    pass('userActive');

    if (!user.wallet || !user.wallet.isActive) {
      return fail('walletActive', REWARDS_ERRORS.WALLET_INACTIVE);
    }
    pass('walletActive');

    // ── Reward state ────────────────────────────────────
    if (reward.status !== RewardStatus.PUBLISHED) {
      return fail('rewardPublished', REWARDS_ERRORS.REWARD_NOT_AVAILABLE);
    }
    pass('rewardPublished');

    if (reward.validFrom && now < reward.validFrom) {
      return fail('rewardWindow', REWARDS_ERRORS.REWARD_NOT_STARTED);
    }
    if (reward.validUntil && now > reward.validUntil) {
      return fail('rewardWindow', REWARDS_ERRORS.REWARD_EXPIRED);
    }
    pass('rewardWindow');

    // ── Stock ───────────────────────────────────────────
    if (reward.stock !== null && reward.stock <= 0) {
      return fail('stock', REWARDS_ERRORS.OUT_OF_STOCK);
    }
    pass('stock');

    // ── Store / brand availability ──────────────────────
    const userStoreId = user.customerProfile?.assignedStoreId ?? null;
    const userBrandId = user.customerProfile?.assignedStore?.brandId ?? null;

    if (reward.availability === RewardAvailability.STORE_SPECIFIC) {
      const links = await this.prisma.rewardStoreAvailability.findMany({
        where: { rewardId: reward.id, isActive: true },
        select: { storeId: true },
      });
      const allowed = links.map((l) => l.storeId);
      if (allowed.length > 0 && (!userStoreId || !allowed.includes(userStoreId))) {
        return fail('storeEligible', REWARDS_ERRORS.STORE_INELIGIBLE);
      }
    }
    pass('storeEligible');

    if (
      reward.availability === RewardAvailability.BRAND_SPECIFIC &&
      reward.brandId &&
      reward.brandId !== userBrandId
    ) {
      return fail('brandEligible', REWARDS_ERRORS.BRAND_INELIGIBLE);
    }
    pass('brandEligible');

    // ── Limits ──────────────────────────────────────────
    if (reward.dailyLimit !== null) {
      const todayCount = await this.cache.getDailyRedemptionCount(reward.id);
      if (todayCount >= reward.dailyLimit) {
        return fail('dailyLimit', REWARDS_ERRORS.DAILY_LIMIT_REACHED);
      }
    }
    pass('dailyLimit');

    if (reward.userLimit !== null) {
      const userCount = await this.countUserRedemptions(userId, reward.id);
      if (userCount >= reward.userLimit) {
        return fail('userLimit', REWARDS_ERRORS.USER_LIMIT_REACHED);
      }
    }
    pass('userLimit');

    // ── Loyalty tier (extension point: tier source is pluggable) ──
    if (reward.minimumLoyaltyTier) {
      const tierOk = await this.meetsLoyaltyTier(userId, reward.minimumLoyaltyTier);
      if (!tierOk) {
        return fail('loyaltyTier', REWARDS_ERRORS.LOYALTY_TIER_TOO_LOW);
      }
    }
    pass('loyaltyTier');

    // ── Balance (checked last so shortBy is always meaningful) ──
    if (balance < reward.coinCost) {
      return fail('balance', REWARDS_ERRORS.INSUFFICIENT_COINS);
    }
    pass('balance');

    return {
      eligible: true,
      checks,
      balance,
      coinCost: reward.coinCost,
      shortBy: 0,
    };
  }

  async countUserRedemptions(userId: string, rewardId: string): Promise<number> {
    return this.prisma.rewardRedemption.count({
      where: { userId, rewardId, status: { in: ['PENDING', 'COMPLETED'] } },
    });
  }

  /** Resolve the store a voucher should be bound to. */
  async resolveStoreId(userId: string, requestedStoreId?: string): Promise<string | null> {
    if (requestedStoreId) return requestedStoreId;

    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      select: { assignedStoreId: true },
    });
    return profile?.assignedStoreId ?? null;
  }

  /**
   * Loyalty tiers are not modelled yet. Returning true keeps the check inert
   * until a tier provider exists, without leaving the field unenforced in the
   * pipeline — swap this body when the loyalty module lands.
   */
  private async meetsLoyaltyTier(
    _userId: string,
    _requiredTier: string,
  ): Promise<boolean> {
    return true;
  }
}
