import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  DASHBOARD_ANALYTICS_RANGES,
  DASHBOARD_OPS_CACHE,
} from '../common/constants';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';

export interface DashboardAnalyticsTotals {
  newCustomers: number;
  walletCredits: { count: number; total: number };
  walletDebits: { count: number; total: number };
  rewardRedemptions: number;
  voucherRedemptions: number;
  gamePlays: number;
  notifications: number;
}

export interface DashboardAnalyticsOverview extends DashboardAnalyticsTotals {
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
}

export interface DashboardAnalyticsBucket extends DashboardAnalyticsTotals {
  bucketStart: string;
}

export interface DashboardAnalyticsSeries {
  granularity: 'day' | 'week' | 'month';
  rangeStart: string;
  rangeEnd: string;
  totals: DashboardAnalyticsTotals;
  series: DashboardAnalyticsBucket[];
  generatedAt: string;
}

type Granularity = 'day' | 'week' | 'month';

/**
 * Operational analytics for one store — live counters, not the BI system.
 *
 * All seven metrics for a range are seven indexed reads issued in parallel;
 * series endpoints fetch only timestamps (and amounts for wallet movements)
 * and bucket them in memory, so a month of store activity costs the same
 * seven queries as a single overview. Results are cached per store and range
 * and dropped by the cache listener whenever a movement touches the store.
 */
@Injectable()
export class DashboardAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opsCache: DashboardOpsCacheService,
  ) {}

  async getOverview(storeId: string): Promise<DashboardAnalyticsOverview> {
    const cached = await this.opsCache.get<DashboardAnalyticsOverview>(
      storeId,
      'analytics',
      'overview',
    );
    if (cached) {
      return cached;
    }

    const start = this.startOfDay(new Date());
    const end = new Date();
    const totals = await this.collectTotals(storeId, start, end);

    const overview: DashboardAnalyticsOverview = {
      ...totals,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    await this.opsCache.set(
      storeId,
      'analytics',
      overview,
      DASHBOARD_OPS_CACHE.TTL.OVERVIEW_SECONDS,
      'overview',
    );

    return overview;
  }

  async getDaily(storeId: string): Promise<DashboardAnalyticsSeries> {
    const start = this.startOfDay(new Date());
    start.setDate(start.getDate() - (DASHBOARD_ANALYTICS_RANGES.DAILY_DAYS - 1));
    return this.getSeries(storeId, 'day', start, 'daily');
  }

  async getWeekly(storeId: string): Promise<DashboardAnalyticsSeries> {
    const start = this.startOfWeek(new Date());
    start.setDate(
      start.getDate() - (DASHBOARD_ANALYTICS_RANGES.WEEKLY_WEEKS - 1) * 7,
    );
    return this.getSeries(storeId, 'week', start, 'weekly');
  }

  async getMonthly(storeId: string): Promise<DashboardAnalyticsSeries> {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (DASHBOARD_ANALYTICS_RANGES.MONTHLY_MONTHS - 1),
      1,
    );
    return this.getSeries(storeId, 'month', start, 'monthly');
  }

  private async getSeries(
    storeId: string,
    granularity: Granularity,
    start: Date,
    cacheSuffix: string,
  ): Promise<DashboardAnalyticsSeries> {
    const cached = await this.opsCache.get<DashboardAnalyticsSeries>(
      storeId,
      'analytics',
      cacheSuffix,
    );
    if (cached) {
      return cached;
    }

    const end = new Date();
    const range = { gte: start, lte: end };

    const [
      customers,
      credits,
      debits,
      redemptions,
      voucherRedemptions,
      gamePlays,
      notifications,
    ] = await Promise.all([
      this.prisma.customerProfile.findMany({
        where: { assignedStoreId: storeId, createdAt: range },
        select: { createdAt: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: this.walletMovementWhere(storeId, TransactionType.CREDIT, range),
        select: { createdAt: true, amount: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: this.walletMovementWhere(storeId, TransactionType.DEBIT, range),
        select: { createdAt: true, amount: true },
      }),
      this.prisma.rewardRedemption.findMany({
        where: { storeId, createdAt: range },
        select: { createdAt: true },
      }),
      this.prisma.rewardVoucher.findMany({
        where: { storeId, redeemedAt: range },
        select: { redeemedAt: true },
      }),
      this.prisma.gameSession.findMany({
        where: {
          createdAt: range,
          user: { customerProfile: { assignedStoreId: storeId } },
        },
        select: { createdAt: true },
      }),
      this.prisma.notification.findMany({
        where: {
          createdAt: range,
          user: { customerProfile: { assignedStoreId: storeId } },
        },
        select: { createdAt: true },
      }),
    ]);

    const buckets = new Map<string, DashboardAnalyticsBucket>();
    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor = this.nextBucket(cursor, granularity)
    ) {
      const key = this.bucketKey(cursor, granularity);
      buckets.set(key, { bucketStart: key, ...this.emptyTotals() });
    }

    const bucketOf = (date: Date): DashboardAnalyticsBucket | undefined =>
      buckets.get(this.bucketKey(date, granularity));

    const increment = (
      date: Date | null,
      apply: (bucket: DashboardAnalyticsBucket) => void,
    ) => {
      if (!date) return;
      const bucket = bucketOf(date);
      if (bucket) apply(bucket);
    };

    for (const c of customers)
      increment(c.createdAt, (b) => (b.newCustomers += 1));
    for (const t of credits) {
      const bucket = bucketOf(t.createdAt);
      if (bucket) {
        bucket.walletCredits.count += 1;
        bucket.walletCredits.total += Number(t.amount);
      }
    }
    for (const t of debits) {
      const bucket = bucketOf(t.createdAt);
      if (bucket) {
        bucket.walletDebits.count += 1;
        bucket.walletDebits.total += Number(t.amount);
      }
    }
    for (const r of redemptions)
      increment(r.createdAt, (b) => (b.rewardRedemptions += 1));
    for (const v of voucherRedemptions)
      increment(v.redeemedAt, (b) => (b.voucherRedemptions += 1));
    for (const g of gamePlays)
      increment(g.createdAt, (b) => (b.gamePlays += 1));
    for (const n of notifications)
      increment(n.createdAt, (b) => (b.notifications += 1));

    const series = [...buckets.values()];
    const totals = series.reduce<DashboardAnalyticsTotals>((acc, bucket) => {
      acc.newCustomers += bucket.newCustomers;
      acc.walletCredits.count += bucket.walletCredits.count;
      acc.walletCredits.total += bucket.walletCredits.total;
      acc.walletDebits.count += bucket.walletDebits.count;
      acc.walletDebits.total += bucket.walletDebits.total;
      acc.rewardRedemptions += bucket.rewardRedemptions;
      acc.voucherRedemptions += bucket.voucherRedemptions;
      acc.gamePlays += bucket.gamePlays;
      acc.notifications += bucket.notifications;
      return acc;
    }, this.emptyTotals());

    const result: DashboardAnalyticsSeries = {
      granularity,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      totals,
      series,
      generatedAt: new Date().toISOString(),
    };

    await this.opsCache.set(
      storeId,
      'analytics',
      result,
      DASHBOARD_OPS_CACHE.TTL.SERIES_SECONDS,
      cacheSuffix,
    );

    return result;
  }

  private async collectTotals(
    storeId: string,
    start: Date,
    end: Date,
  ): Promise<DashboardAnalyticsTotals> {
    const range = { gte: start, lte: end };

    const [
      newCustomers,
      credits,
      debits,
      rewardRedemptions,
      voucherRedemptions,
      gamePlays,
      notifications,
    ] = await Promise.all([
      this.prisma.customerProfile.count({
        where: { assignedStoreId: storeId, createdAt: range },
      }),
      this.prisma.walletTransaction.aggregate({
        where: this.walletMovementWhere(storeId, TransactionType.CREDIT, range),
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: this.walletMovementWhere(storeId, TransactionType.DEBIT, range),
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.rewardRedemption.count({
        where: { storeId, createdAt: range },
      }),
      this.prisma.rewardVoucher.count({
        where: { storeId, redeemedAt: range },
      }),
      this.prisma.gameSession.count({
        where: {
          createdAt: range,
          user: { customerProfile: { assignedStoreId: storeId } },
        },
      }),
      this.prisma.notification.count({
        where: {
          createdAt: range,
          user: { customerProfile: { assignedStoreId: storeId } },
        },
      }),
    ]);

    return {
      newCustomers,
      walletCredits: {
        count: credits._count,
        total: Number(credits._sum.amount ?? 0),
      },
      walletDebits: {
        count: debits._count,
        total: Number(debits._sum.amount ?? 0),
      },
      rewardRedemptions,
      voucherRedemptions,
      gamePlays,
      notifications,
    };
  }

  private walletMovementWhere(
    storeId: string,
    type: TransactionType,
    createdAt: { gte: Date; lte: Date },
  ): Prisma.WalletTransactionWhereInput {
    return {
      type,
      status: TransactionStatus.COMPLETED,
      createdAt,
      wallet: { user: { customerProfile: { assignedStoreId: storeId } } },
    };
  }

  private emptyTotals(): DashboardAnalyticsTotals {
    return {
      newCustomers: 0,
      walletCredits: { count: 0, total: 0 },
      walletDebits: { count: 0, total: 0 },
      rewardRedemptions: 0,
      voucherRedemptions: 0,
      gamePlays: 0,
      notifications: 0,
    };
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Monday-based week start. */
  private startOfWeek(date: Date): Date {
    const d = this.startOfDay(date);
    const day = d.getDay();
    d.setDate(d.getDate() - ((day + 6) % 7));
    return d;
  }

  private bucketKey(date: Date, granularity: Granularity): string {
    if (granularity === 'month') {
      return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    }
    if (granularity === 'week') {
      return this.startOfWeek(date).toISOString();
    }
    return this.startOfDay(date).toISOString();
  }

  private nextBucket(date: Date, granularity: Granularity): Date {
    const d = new Date(date);
    if (granularity === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + (granularity === 'week' ? 7 : 1));
    }
    return d;
  }
}
