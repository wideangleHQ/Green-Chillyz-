import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import { DashboardAnalyticsService } from './dashboard-analytics.service';

describe('DashboardAnalyticsService', () => {
  let service: DashboardAnalyticsService;
  let prisma: Record<string, any>;
  let opsCache: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      customerProfile: {
        count: vi.fn().mockResolvedValue(4),
        findMany: vi.fn().mockResolvedValue([]),
      },
      walletTransaction: {
        aggregate: vi
          .fn()
          .mockResolvedValue({ _count: 2, _sum: { amount: '75.50' } }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      rewardRedemption: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn().mockResolvedValue([]),
      },
      rewardVoucher: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([]),
      },
      gameSession: {
        count: vi.fn().mockResolvedValue(6),
        findMany: vi.fn().mockResolvedValue([]),
      },
      notification: {
        count: vi.fn().mockResolvedValue(9),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    opsCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    service = new DashboardAnalyticsService(
      prisma as unknown as PrismaService,
      opsCache as unknown as DashboardOpsCacheService,
    );
  });

  describe('getOverview', () => {
    it('should serve from cache when warm', async () => {
      opsCache.get.mockResolvedValue({ newCustomers: 100 });

      const overview = await service.getOverview('store-1');

      expect(overview.newCustomers).toBe(100);
      expect(prisma.customerProfile.count).not.toHaveBeenCalled();
    });

    it('should collect every counter for today', async () => {
      const overview = await service.getOverview('store-1');

      expect(overview).toMatchObject({
        newCustomers: 4,
        walletCredits: { count: 2, total: 75.5 },
        walletDebits: { count: 2, total: 75.5 },
        rewardRedemptions: 3,
        voucherRedemptions: 1,
        gamePlays: 6,
        notifications: 9,
      });
      expect(new Date(overview.rangeStart).getHours()).toBe(0);
    });

    it('should scope wallet movements to completed transactions of store customers', async () => {
      await service.getOverview('store-1');

      const { where } = prisma.walletTransaction.aggregate.mock.calls[0][0];
      expect(where.status).toBe('COMPLETED');
      expect(where.wallet).toEqual({
        user: { customerProfile: { assignedStoreId: 'store-1' } },
      });
    });

    it('should scope voucher redemptions by redemption time, not creation', async () => {
      await service.getOverview('store-1');

      const { where } = prisma.rewardVoucher.count.mock.calls[0][0];
      expect(where.storeId).toBe('store-1');
      expect(where.redeemedAt).toBeDefined();
    });

    it('should cache the computed overview', async () => {
      await service.getOverview('store-1');

      expect(opsCache.set).toHaveBeenCalledWith(
        'store-1',
        'analytics',
        expect.objectContaining({ newCustomers: 4 }),
        expect.any(Number),
        'overview',
      );
    });
  });

  describe('series endpoints', () => {
    it('should produce one bucket per day over the last 7 days', async () => {
      const result = await service.getDaily('store-1');

      expect(result.granularity).toBe('day');
      expect(result.series).toHaveLength(7);
    });

    it('should bucket records into the right day and total them', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      prisma.customerProfile.findMany.mockResolvedValue([
        { createdAt: today },
        { createdAt: today },
        { createdAt: yesterday },
      ]);
      prisma.walletTransaction.findMany.mockResolvedValue([
        { createdAt: today, amount: '25.50' },
      ]);

      const result = await service.getDaily('store-1');

      expect(result.totals.newCustomers).toBe(3);
      expect(result.series.at(-1)?.newCustomers).toBe(2);
      expect(result.series.at(-2)?.newCustomers).toBe(1);
      expect(result.totals.walletCredits).toEqual({ count: 1, total: 25.5 });
    });

    it('should produce weekly buckets', async () => {
      const result = await service.getWeekly('store-1');

      expect(result.granularity).toBe('week');
      expect(result.series).toHaveLength(8);
    });

    it('should produce monthly buckets', async () => {
      const result = await service.getMonthly('store-1');

      expect(result.granularity).toBe('month');
      expect(result.series).toHaveLength(6);
    });

    it('should cache each series under its own suffix', async () => {
      await service.getDaily('store-1');

      expect(opsCache.set).toHaveBeenCalledWith(
        'store-1',
        'analytics',
        expect.objectContaining({ granularity: 'day' }),
        expect.any(Number),
        'daily',
      );
    });

    it('should serve a warm series from cache without querying', async () => {
      opsCache.get.mockResolvedValue({ granularity: 'day', series: [] });

      await service.getDaily('store-1');

      expect(prisma.customerProfile.findMany).not.toHaveBeenCalled();
    });
  });
});
