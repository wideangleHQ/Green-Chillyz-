import { Injectable } from '@nestjs/common';
import {
  JourneyAction,
  JourneyActionExecutionStatus,
  JourneyActionType,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  TransactionSource,
  VoucherStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { CoinEconomyService } from '../../coin-economy/services';
import { NotificationDispatcherService } from '../../notification/services';
import { RewardRedemptionService, VoucherService } from '../../rewards/services';
import { ChallengeProgressService } from '../../challenges/services';
import { CampaignService } from '../../reward/services';
import { CUSTOMER_JOURNEY_ERRORS } from '../constants';
import { JourneyActionResult, JourneyEventContext } from '../interfaces';

@Injectable()
export class JourneyActionExecutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly coinEconomy: CoinEconomyService,
    private readonly notifications: NotificationDispatcherService,
    private readonly redemptions: RewardRedemptionService,
    private readonly vouchers: VoucherService,
    private readonly challenges: ChallengeProgressService,
    private readonly campaigns: CampaignService,
  ) {}

  async execute(
    action: JourneyAction,
    context: JourneyEventContext,
    executionId: string | null,
    simulate: boolean,
  ): Promise<JourneyActionResult> {
    if (simulate) {
      return this.result(action, JourneyActionExecutionStatus.SIMULATED, 'Action simulated');
    }

    switch (action.actionType) {
      case JourneyActionType.CREDIT_COINS:
        return this.creditCoins(action, context, executionId);
      case JourneyActionType.DEBIT_COINS:
        return this.debitCoins(action, context, executionId);
      case JourneyActionType.UNLOCK_REWARD:
      case JourneyActionType.UNLOCK_VOUCHER:
      case JourneyActionType.GENERATE_VOUCHER:
        return this.unlockReward(action, context, executionId);
      case JourneyActionType.EXPIRE_VOUCHER:
        return this.expireVoucher(action);
      case JourneyActionType.ASSIGN_CHALLENGE:
        return this.assignChallenge(action, context);
      case JourneyActionType.ASSIGN_CAMPAIGN:
        return this.assignCampaign(action);
      case JourneyActionType.SEND_NOTIFICATION:
      case JourneyActionType.SEND_IN_APP_MESSAGE:
        return this.sendNotification(action, context, executionId);
      case JourneyActionType.SEND_EMAIL:
      case JourneyActionType.SEND_WHATSAPP:
        return this.result(action, JourneyActionExecutionStatus.SKIPPED, CUSTOMER_JOURNEY_ERRORS.FUTURE_CHANNEL);
      case JourneyActionType.TAG_CUSTOMER:
      case JourneyActionType.CUSTOM_ACTION:
        return this.writeCustomerMetadata(action, context);
      default:
        return this.result(action, JourneyActionExecutionStatus.SKIPPED, 'Unsupported action');
    }
  }

  private async creditCoins(
    action: JourneyAction,
    context: JourneyEventContext,
    executionId: string | null,
  ): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const decision = await this.coinEconomy.earn({
      userId: context.userId,
      ruleType: config.ruleType,
      ruleId: config.ruleId,
      storeId: context.storeId,
      referenceId: context.referenceId ?? executionId,
      referenceType: context.referenceType ?? 'CUSTOMER_JOURNEY',
      requestedCoins: config.amount,
      metadata: { ...(context.metadata ?? {}), journeyActionId: action.id },
      ip: context.ip,
      device: context.device,
      now: context.now,
    });

    return this.result(
      action,
      decision.granted
        ? JourneyActionExecutionStatus.COMPLETED
        : JourneyActionExecutionStatus.SKIPPED,
      decision.reason,
      { coins: decision.coins, transactionId: decision.transactionId },
    );
  }

  private async debitCoins(
    action: JourneyAction,
    context: JourneyEventContext,
    executionId: string | null,
  ): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const debit = await this.wallet.debit({
      userId: context.userId,
      amount: Number(config.amount),
      source: config.source ?? TransactionSource.ADMIN_ADJUSTMENT,
      description: config.description ?? 'Customer journey debit',
      idempotencyKey: `journey:${executionId}:${action.id}`,
      referenceId: executionId ?? action.id,
      referenceType: 'CUSTOMER_JOURNEY',
      metadata: { ...(context.metadata ?? {}), journeyActionId: action.id },
    });

    return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Coins debited', {
      transactionId: debit.transaction.id,
      newBalance: debit.newBalance,
    });
  }

  private async unlockReward(
    action: JourneyAction,
    context: JourneyEventContext,
    executionId: string | null,
  ): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const redemption = await this.redemptions.redeem(
      context.userId,
      String(config.rewardId),
      {
        storeId: context.storeId ?? config.storeId,
        idempotencyKey: `journey-reward:${executionId}:${action.id}`,
      },
      { ip: context.ip ?? undefined, device: context.device ?? undefined },
    );

    return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Reward unlocked', {
      redemptionId: redemption.id,
      voucherId: redemption.voucher?.id,
    });
  }

  private async expireVoucher(action: JourneyAction): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    if (config.voucherId) {
      await this.vouchers.cancelVoucher(String(config.voucherId));
      return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Voucher expired');
    }

    const count = await this.prisma.rewardVoucher.updateMany({
      where: {
        userId: config.userId,
        status: VoucherStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
      data: { status: VoucherStatus.EXPIRED },
    });
    return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Voucher expiry processed', {
      count: count.count,
    });
  }

  private async assignChallenge(
    action: JourneyAction,
    context: JourneyEventContext,
  ): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const progress = await this.challenges.recordProgress(context.userId, {
      challengeId: String(config.challengeId),
      incrementBy: Number(config.incrementBy ?? 1),
      amount: config.amount,
    });

    return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Challenge assigned', {
      challengeId: progress.challengeId,
      status: progress.status,
    });
  }

  private async assignCampaign(action: JourneyAction): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const campaign = await this.campaigns.findById(String(config.campaignId));
    return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Campaign assignment recorded', {
      campaignId: campaign.id,
      status: campaign.status,
    });
  }

  private async sendNotification(
    action: JourneyAction,
    context: JourneyEventContext,
    executionId: string | null,
  ): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const dispatch = await this.notifications.dispatch({
      userId: context.userId,
      channels: [NotificationChannel.IN_APP],
      dedupeKey: `journey-notification:${executionId}:${action.id}`,
      referenceId: executionId ?? action.id,
      override: {
        title: String(config.title),
        message: String(config.message),
        type: config.type ?? NotificationType.MARKETING,
        priority: config.priority ?? NotificationPriority.NORMAL,
        actionLabel: config.actionLabel,
        actionUrl: config.actionUrl,
        deepLink: config.deepLink,
        metadata: { ...(context.metadata ?? {}), journeyActionId: action.id },
      },
    });

    return this.result(
      action,
      dispatch.delivered
        ? JourneyActionExecutionStatus.COMPLETED
        : JourneyActionExecutionStatus.SKIPPED,
      dispatch.delivered ? 'Notification sent' : dispatch.skippedReason ?? 'Notification skipped',
      { results: dispatch.results },
    );
  }

  private async writeCustomerMetadata(
    action: JourneyAction,
    context: JourneyEventContext,
  ): Promise<JourneyActionResult> {
    const config = action.config as Record<string, any>;
    const key = action.actionType === JourneyActionType.TAG_CUSTOMER
      ? `journey_tag:${config.tag}`
      : `journey_custom:${action.id}`;
    await this.prisma.customerProfile.updateMany({
      where: { userId: context.userId },
      data: { updatedAt: new Date() },
    });
    return this.result(action, JourneyActionExecutionStatus.COMPLETED, 'Customer metadata marker recorded', {
      key,
      value: config.value ?? true,
    });
  }

  private result(
    action: JourneyAction,
    status: JourneyActionExecutionStatus,
    message: string,
    output: Record<string, unknown> | null = null,
  ): JourneyActionResult {
    return {
      actionId: action.id,
      actionType: action.actionType,
      status,
      message,
      output,
    };
  }
}
