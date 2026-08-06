import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../database/prisma.service';
import { RewardCatalogService } from '../../rewards/services/reward-catalog.service';
import { RewardAnalyticsService } from '../../rewards/services/reward-analytics.service';
import { RewardQueryDto } from '../../rewards/dto';
import { DashboardRewardsService } from './dashboard-rewards.service';
import { DashboardRedemptionQueryDto } from './dto/dashboard-reward.dto';

describe('DashboardRewardsService', () => {
  let service: DashboardRewardsService;
  let prisma: Record<string, any>;
  let catalogService: {
    listCatalog: ReturnType<typeof vi.fn>;
    getDetail: ReturnType<typeof vi.fn>;
  };
  let analyticsService: { getRewardStats: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
      rewardRedemption: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    catalogService = {
      listCatalog: vi.fn().mockResolvedValue({ items: [], meta: {} }),
      getDetail: vi.fn().mockResolvedValue({ id: 'reward-1', title: 'Momos' }),
    };
    analyticsService = {
      getRewardStats: vi.fn().mockResolvedValue({ totalRedemptions: 5 }),
    };

    service = new DashboardRewardsService(
      prisma as unknown as PrismaService,
      catalogService as unknown as RewardCatalogService,
      analyticsService as unknown as RewardAnalyticsService,
    );
  });

  describe('list', () => {
    it('should force the catalog query to the principal store', async () => {
      const query = new RewardQueryDto();
      query.storeId = 'spoofed-store';

      await service.list('store-1', query);

      expect(catalogService.listCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-1' }),
      );
    });
  });

  describe('getDetail', () => {
    it('should enrich the catalog detail with redemption stats', async () => {
      const detail = await service.getDetail('free-momos');

      expect(catalogService.getDetail).toHaveBeenCalledWith('free-momos');
      expect(analyticsService.getRewardStats).toHaveBeenCalledWith('reward-1');
      expect(detail).toMatchObject({
        id: 'reward-1',
        stats: { totalRedemptions: 5 },
      });
    });
  });

  describe('getRedemptions', () => {
    it('should scope redemptions to the reward AND the store', async () => {
      await service.getRedemptions(
        'store-1',
        'reward-1',
        new DashboardRedemptionQueryDto(),
      );

      const { where } = prisma.rewardRedemption.findMany.mock.calls[0][0];
      expect(where).toEqual({ rewardId: 'reward-1', storeId: 'store-1' });
    });

    it('should apply the status filter when given', async () => {
      const query = new DashboardRedemptionQueryDto();
      query.status = 'COMPLETED' as never;

      await service.getRedemptions('store-1', 'reward-1', query);

      const { where } = prisma.rewardRedemption.findMany.mock.calls[0][0];
      expect(where.status).toBe('COMPLETED');
    });
  });
});
