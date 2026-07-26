import { Injectable, Logger } from '@nestjs/common';
import { Prisma, VoucherStatus, RedemptionStatus, RewardStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RewardStats, CatalogOverviewStats } from '../interfaces';
import { REWARD_ANALYTICS_EVENTS } from '../constants';

/**
 * Append-only analytics for the rewards funnel.
 * Writes are best-effort: a telemetry failure must never break a redemption.
 */
@Injectable()
export class RewardAnalyticsService {
  private readonly logger = new Logger(RewardAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(
    eventType: string,
    params: {
      rewardId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await this.prisma.rewardAnalyticsEvent.create({
        data: {
          eventType,
          rewardId: params.rewardId,
          userId: params.userId,
          metadata: params.metadata
            ? (params.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Analytics write failed for ${eventType}: ${message}`);
    }
  }

  /** Record a catalog/detail view and keep the denormalised counter warm. */
  async trackView(rewardId: string, userId?: string): Promise<void> {
    await this.track(REWARD_ANALYTICS_EVENTS.VIEW, { rewardId, userId });
    try {
      await this.prisma.reward.update({
        where: { id: rewardId },
        data: { totalViews: { increment: 1 } },
      });
    } catch {
      // Counter drift is acceptable; the event log remains the source of truth.
    }
  }

  async getRewardStats(rewardId: string): Promise<RewardStats> {
    const [reward, eventCounts, redemptionAgg, voucherCounts] = await Promise.all([
      this.prisma.reward.findUnique({
        where: { id: rewardId },
        select: { id: true, title: true, totalViews: true },
      }),
      this.prisma.rewardAnalyticsEvent.groupBy({
        by: ['eventType'],
        where: { rewardId },
        _count: { _all: true },
      }),
      this.prisma.rewardRedemption.aggregate({
        where: { rewardId, status: RedemptionStatus.COMPLETED },
        _count: { _all: true },
        _sum: { coinsSpent: true },
      }),
      this.prisma.rewardVoucher.groupBy({
        by: ['status'],
        where: { rewardId },
        _count: { _all: true },
      }),
    ]);

    const countOf = (type: string): number =>
      eventCounts.find((e) => e.eventType === type)?._count._all ?? 0;
    const voucherOf = (status: VoucherStatus): number =>
      voucherCounts.find((v) => v.status === status)?._count._all ?? 0;

    const views = reward?.totalViews ?? countOf(REWARD_ANALYTICS_EVENTS.VIEW);
    const redemptions = redemptionAgg._count._all;
    const used = voucherOf(VoucherStatus.USED);
    const expired = voucherOf(VoucherStatus.EXPIRED);
    const totalVouchers = used + expired + voucherOf(VoucherStatus.ACTIVE);

    return {
      rewardId,
      title: reward?.title ?? '',
      views,
      clicks: countOf(REWARD_ANALYTICS_EVENTS.CLICK),
      redemptions,
      conversionRate: views > 0 ? Number(((redemptions / views) * 100).toFixed(2)) : 0,
      coinsSpent: redemptionAgg._sum.coinsSpent ?? 0,
      vouchersActive: voucherOf(VoucherStatus.ACTIVE),
      vouchersUsed: used,
      vouchersExpired: expired,
      usageRate: totalVouchers > 0 ? Number(((used / totalVouchers) * 100).toFixed(2)) : 0,
      expiryRate:
        totalVouchers > 0 ? Number(((expired / totalVouchers) * 100).toFixed(2)) : 0,
    };
  }

  async getOverview(): Promise<CatalogOverviewStats> {
    const [
      totalRewards,
      publishedRewards,
      redemptionAgg,
      voucherCounts,
      fraudAttempts,
      topRewards,
      storeGroups,
    ] = await Promise.all([
      this.prisma.reward.count(),
      this.prisma.reward.count({ where: { status: RewardStatus.PUBLISHED } }),
      this.prisma.rewardRedemption.aggregate({
        where: { status: RedemptionStatus.COMPLETED },
        _count: { _all: true },
        _sum: { coinsSpent: true },
      }),
      this.prisma.rewardVoucher.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.rewardAnalyticsEvent.count({
        where: { eventType: REWARD_ANALYTICS_EVENTS.FRAUD_ATTEMPT },
      }),
      this.prisma.reward.findMany({
        where: { totalRedemptions: { gt: 0 } },
        select: { id: true, title: true, totalRedemptions: true },
        orderBy: { totalRedemptions: 'desc' },
        take: 10,
      }),
      this.prisma.rewardRedemption.groupBy({
        by: ['storeId'],
        where: { status: RedemptionStatus.COMPLETED, storeId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { storeId: 'desc' } },
        take: 10,
      }),
    ]);

    const voucherOf = (status: VoucherStatus): number =>
      voucherCounts.find((v) => v.status === status)?._count._all ?? 0;

    // Resolve store names in one query rather than per-group (no N+1).
    const storeIds = storeGroups
      .map((g) => g.storeId)
      .filter((id): id is string => id !== null);
    const stores = storeIds.length
      ? await this.prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true },
        })
      : [];
    const storeNames = new Map(stores.map((s) => [s.id, s.name]));

    return {
      totalRewards,
      publishedRewards,
      totalRedemptions: redemptionAgg._count._all,
      totalCoinsSpent: redemptionAgg._sum.coinsSpent ?? 0,
      activeVouchers: voucherOf(VoucherStatus.ACTIVE),
      usedVouchers: voucherOf(VoucherStatus.USED),
      expiredVouchers: voucherOf(VoucherStatus.EXPIRED),
      fraudAttempts,
      topRewards: topRewards.map((r) => ({
        rewardId: r.id,
        title: r.title,
        redemptions: r.totalRedemptions,
      })),
      storeRedemptions: storeGroups.map((g) => ({
        storeId: g.storeId as string,
        storeName: storeNames.get(g.storeId as string) ?? 'Unknown',
        redemptions: g._count._all,
      })),
    };
  }
}
