import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../database/prisma.service';
import { StoreService } from '../../store/services/store.service';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import { DashboardActivityQueryDto } from '../customers/dto/dashboard-customer.dto';
import { DashboardStoresService } from './dashboard-stores.service';

describe('DashboardStoresService', () => {
  let service: DashboardStoresService;
  let prisma: Record<string, any>;
  let storeService: {
    findById: ReturnType<typeof vi.fn>;
    isOpenNow: ReturnType<typeof vi.fn>;
  };
  let opsCache: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      customerProfile: {
        count: vi.fn().mockResolvedValue(12),
        findMany: vi.fn().mockResolvedValue([]),
      },
      rewardVoucher: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn().mockResolvedValue([]),
      },
      rewardRedemption: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([]),
      },
      wallet: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { balance: '540.50' } }),
      },
    };
    storeService = {
      findById: vi.fn().mockResolvedValue({ id: 'store-1' }),
      isOpenNow: vi.fn().mockResolvedValue(true),
    };
    opsCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    service = new DashboardStoresService(
      prisma as unknown as PrismaService,
      storeService as unknown as StoreService,
      opsCache as unknown as DashboardOpsCacheService,
    );
  });

  describe('getMe', () => {
    it('should delegate to the shared StoreService', async () => {
      await service.getMe('store-1');

      expect(storeService.findById).toHaveBeenCalledWith('store-1');
    });
  });

  describe('getStats', () => {
    it('should serve from cache when warm', async () => {
      opsCache.get.mockResolvedValue({ totalCustomers: 99 });

      const stats = await service.getStats('store-1');

      expect(stats.totalCustomers).toBe(99);
      expect(prisma.customerProfile.count).not.toHaveBeenCalled();
    });

    it('should aggregate the store slice and cache the result', async () => {
      const stats = await service.getStats('store-1');

      expect(stats).toMatchObject({
        totalCustomers: 12,
        walletBalanceTotal: 540.5,
        isOpenNow: true,
      });
      expect(opsCache.set).toHaveBeenCalledWith(
        'store-1',
        'stats',
        expect.objectContaining({ totalCustomers: 12 }),
        expect.any(Number),
      );
    });

    it('should scope every aggregate to the store', async () => {
      await service.getStats('store-1');

      expect(prisma.customerProfile.count.mock.calls[0][0].where).toMatchObject(
        { assignedStoreId: 'store-1' },
      );
      expect(prisma.rewardRedemption.count.mock.calls[0][0].where).toMatchObject(
        { storeId: 'store-1' },
      );
      expect(prisma.wallet.aggregate.mock.calls[0][0].where).toEqual({
        user: { customerProfile: { assignedStoreId: 'store-1' } },
      });
    });

    it('should count zero wallet balance when the store has no customers', async () => {
      prisma.wallet.aggregate.mockResolvedValue({ _sum: { balance: null } });

      const stats = await service.getStats('store-1');

      expect(stats.walletBalanceTotal).toBe(0);
    });
  });

  describe('getActivity', () => {
    it('should merge redemptions, scans and joiners newest-first', async () => {
      prisma.rewardRedemption.findMany.mockResolvedValue([
        {
          id: 'red-1',
          status: 'COMPLETED',
          coinsSpent: 100,
          createdAt: new Date('2026-07-28T09:00:00Z'),
          reward: { title: 'Free Momos' },
          user: { fullName: 'Asha Rao' },
        },
      ]);
      prisma.rewardVoucher.findMany.mockResolvedValue([
        {
          id: 'vch-1',
          code: 'GC-1',
          redeemedAt: new Date('2026-07-28T11:00:00Z'),
          reward: { title: 'Free Momos' },
          user: { fullName: 'Asha Rao' },
        },
      ]);
      prisma.customerProfile.findMany.mockResolvedValue([
        {
          userId: 'user-2',
          createdAt: new Date('2026-07-28T10:00:00Z'),
          user: { fullName: 'New Customer' },
        },
      ]);

      const items = await service.getActivity(
        'store-1',
        new DashboardActivityQueryDto(),
      );

      expect(items.map((i) => i.type)).toEqual([
        'VOUCHER_REDEEMED',
        'NEW_CUSTOMER',
        'REDEMPTION',
      ]);
    });

    it('should respect the limit', async () => {
      prisma.rewardRedemption.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: `red-${i}`,
          status: 'COMPLETED',
          coinsSpent: 10,
          createdAt: new Date(2026, 6, 28, i),
          reward: { title: 'R' },
          user: { fullName: 'U' },
        })),
      );

      const query = new DashboardActivityQueryDto();
      query.limit = 2;
      const items = await service.getActivity('store-1', query);

      expect(items).toHaveLength(2);
    });
  });
});
