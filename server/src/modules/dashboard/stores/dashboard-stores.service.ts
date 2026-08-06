import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoreService } from '../../store/services/store.service';
import { DASHBOARD_OPS_CACHE } from '../common/constants';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import { DashboardActivityQueryDto } from '../customers/dto/dashboard-customer.dto';

export interface DashboardStoreStats {
  totalCustomers: number;
  newCustomersToday: number;
  activeVouchers: number;
  redemptionsToday: number;
  vouchersRedeemedToday: number;
  walletBalanceTotal: number;
  isOpenNow: boolean;
  generatedAt: string;
}

export interface DashboardStoreActivityItem {
  type: 'REDEMPTION' | 'VOUCHER_REDEEMED' | 'NEW_CUSTOMER';
  occurredAt: Date;
  title: string;
  detail: string | null;
  referenceId: string;
}

/**
 * The authenticated store's own information and operational pulse.
 * Identity comes from `StoreService`; the counters are read-only aggregates
 * over the store's slice of the shared schema, cached briefly in Redis.
 */
@Injectable()
export class DashboardStoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoreService,
    private readonly opsCache: DashboardOpsCacheService,
  ) {}

  async getMe(storeId: string) {
    return this.storeService.findById(storeId);
  }

  async getStats(storeId: string): Promise<DashboardStoreStats> {
    const cached = await this.opsCache.get<DashboardStoreStats>(
      storeId,
      'stats',
    );
    if (cached) {
      return cached;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      newCustomersToday,
      activeVouchers,
      redemptionsToday,
      vouchersRedeemedToday,
      walletAggregate,
      isOpenNow,
    ] = await Promise.all([
      this.prisma.customerProfile.count({
        where: { assignedStoreId: storeId, user: { deletedAt: null } },
      }),
      this.prisma.customerProfile.count({
        where: { assignedStoreId: storeId, createdAt: { gte: startOfDay } },
      }),
      this.prisma.rewardVoucher.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { storeId },
            { user: { customerProfile: { assignedStoreId: storeId } } },
          ],
        },
      }),
      this.prisma.rewardRedemption.count({
        where: { storeId, createdAt: { gte: startOfDay } },
      }),
      this.prisma.rewardVoucher.count({
        where: { storeId, redeemedAt: { gte: startOfDay } },
      }),
      this.prisma.wallet.aggregate({
        where: { user: { customerProfile: { assignedStoreId: storeId } } },
        _sum: { balance: true },
      }),
      this.storeService.isOpenNow(storeId),
    ]);

    const stats: DashboardStoreStats = {
      totalCustomers,
      newCustomersToday,
      activeVouchers,
      redemptionsToday,
      vouchersRedeemedToday,
      walletBalanceTotal: Number(walletAggregate._sum.balance ?? 0),
      isOpenNow,
      generatedAt: new Date().toISOString(),
    };

    await this.opsCache.set(
      storeId,
      'stats',
      stats,
      DASHBOARD_OPS_CACHE.TTL.STORE_STATS_SECONDS,
    );

    return stats;
  }

  /** Latest operational events at this store, merged chronologically. */
  async getActivity(
    storeId: string,
    query: DashboardActivityQueryDto,
  ): Promise<DashboardStoreActivityItem[]> {
    const take = query.limit;

    const [redemptions, redeemedVouchers, newCustomers] = await Promise.all([
      this.prisma.rewardRedemption.findMany({
        where: { storeId },
        select: {
          id: true,
          status: true,
          coinsSpent: true,
          createdAt: true,
          reward: { select: { title: true } },
          user: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.rewardVoucher.findMany({
        where: { storeId, redeemedAt: { not: null } },
        select: {
          id: true,
          code: true,
          redeemedAt: true,
          reward: { select: { title: true } },
          user: { select: { fullName: true } },
        },
        orderBy: { redeemedAt: 'desc' },
        take,
      }),
      this.prisma.customerProfile.findMany({
        where: { assignedStoreId: storeId },
        select: {
          userId: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
    ]);

    const items: DashboardStoreActivityItem[] = [
      ...redemptions.map((r) => ({
        type: 'REDEMPTION' as const,
        occurredAt: r.createdAt,
        title: `${r.user.fullName} redeemed "${r.reward.title}"`,
        detail: `${r.coinsSpent} coins · ${r.status}`,
        referenceId: r.id,
      })),
      ...redeemedVouchers.map((v) => ({
        type: 'VOUCHER_REDEEMED' as const,
        occurredAt: v.redeemedAt as Date,
        title: `Voucher ${v.code} redeemed`,
        detail: `${v.reward.title} · ${v.user.fullName}`,
        referenceId: v.id,
      })),
      ...newCustomers.map((c) => ({
        type: 'NEW_CUSTOMER' as const,
        occurredAt: c.createdAt,
        title: `${c.user.fullName} joined the store`,
        detail: null,
        referenceId: c.userId,
      })),
    ];

    return items
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, take);
  }
}
