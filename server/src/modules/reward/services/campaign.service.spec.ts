import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardEventType, RewardSourceType, CampaignStatus } from '@prisma/client';
import { CampaignService } from './campaign.service';
import { PrismaService } from '../../../database/prisma.service';
import { RewardCacheService } from './reward-cache.service';

describe('CampaignService', () => {
  let service: CampaignService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  const mockCampaign = {
    id: 'c1',
    name: 'Double Weekend',
    slug: 'double-weekend',
    description: 'Double coins on weekends',
    eventType: RewardEventType.PURCHASE_COMPLETED,
    source: RewardSourceType.CAMPAIGN,
    status: CampaignStatus.ACTIVE,
    baseCoins: 20,
    multiplier: '2.0',
    bonusCoins: 5,
    maxClaims: null,
    dailyLimit: 3,
    totalBudget: '10000',
    spentBudget: '500',
    coinExpiryDays: 60,
    storeIds: [],
    brandIds: [],
    minPurchase: null,
    metadata: null,
    startsAt: new Date('2026-07-01'),
    endsAt: new Date('2026-07-31'),
    createdBy: 'admin-1',
    createdAt: new Date('2026-06-15'),
    updatedAt: new Date('2026-06-15'),
  };

  beforeEach(() => {
    prisma = {
      rewardCampaign: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      rewardRule: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        delete: vi.fn(),
      },
      rewardHistory: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };

    cache = {
      getCampaign: vi.fn().mockResolvedValue(null),
      setCampaign: vi.fn(),
      getActiveCampaigns: vi.fn().mockResolvedValue(null),
      setActiveCampaigns: vi.fn(),
      getRules: vi.fn().mockResolvedValue(null),
      setRules: vi.fn(),
      invalidateCampaign: vi.fn(),
      invalidateAll: vi.fn(),
    };

    service = new CampaignService(
      prisma as unknown as PrismaService,
      cache as unknown as RewardCacheService,
    );
  });

  describe('create', () => {
    const createDto = {
      name: 'New Campaign',
      slug: 'new-campaign',
      eventType: RewardEventType.GAME_COMPLETED,
      source: RewardSourceType.GAME,
      baseCoins: 50,
      startsAt: '2026-08-01T00:00:00Z',
      endsAt: '2026-08-31T23:59:59Z',
    };

    it('should create campaign', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(null);
      prisma.rewardCampaign.create.mockResolvedValue({
        ...mockCampaign,
        ...createDto,
        id: 'new-id',
      });

      const result = await service.create(createDto as any, 'admin-1');

      expect(result.name).toBe('New Campaign');
      expect(cache.invalidateAll).toHaveBeenCalled();
    });

    it('should reject duplicate slug', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(createDto as any, 'admin-1'))
        .rejects.toThrow(ConflictException);
    });

    it('should reject invalid date range', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { ...createDto, startsAt: '2026-12-31', endsAt: '2026-01-01' } as any,
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update campaign', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(mockCampaign);
      prisma.rewardCampaign.update.mockResolvedValue({
        ...mockCampaign,
        name: 'Updated',
      });

      const result = await service.update('c1', { name: 'Updated' } as any, 'admin-1');

      expect(result.name).toBe('Updated');
      expect(cache.invalidateCampaign).toHaveBeenCalledWith('c1');
    });

    it('should throw when not found', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', {} as any, 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(mockCampaign);
      prisma.rewardCampaign.update.mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.PAUSED,
      });

      const result = await service.updateStatus('c1', CampaignStatus.PAUSED);

      expect(result.status).toBe(CampaignStatus.PAUSED);
    });
  });

  describe('findAll', () => {
    it('should return paginated campaigns', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([mockCampaign]);
      prisma.rewardCampaign.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 20,
        get skip() { return 0; },
        get take() { return 20; },
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return cached campaign', async () => {
      const cached = { id: 'c1', name: 'Cached' };
      cache.getCampaign.mockResolvedValue(cached);

      const result = await service.findById('c1');

      expect(result).toEqual(cached);
      expect(prisma.rewardCampaign.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch and cache on miss', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.findById('c1');

      expect(result.name).toBe('Double Weekend');
      expect(cache.setCampaign).toHaveBeenCalled();
    });

    it('should throw when not found', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addRule', () => {
    it('should add rule to campaign', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.rewardRule.create.mockResolvedValue({
        id: 'r1',
        ruleType: 'DAILY_LIMIT',
      });

      const result = await service.addRule({
        campaignId: 'c1',
        ruleType: 'DAILY_LIMIT',
        operator: 'LESS_THAN',
        value: '5',
      } as any);

      expect(result.ruleType).toBe('DAILY_LIMIT');
      expect(cache.invalidateCampaign).toHaveBeenCalledWith('c1');
    });

    it('should throw when campaign not found', async () => {
      prisma.rewardCampaign.findUnique.mockResolvedValue(null);

      await expect(
        service.addRule({ campaignId: 'missing', ruleType: 'X', operator: 'Y', value: 'Z' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRule', () => {
    it('should remove rule', async () => {
      prisma.rewardRule.findUnique.mockResolvedValue({ id: 'r1', campaignId: 'c1' });

      await service.removeRule('r1');

      expect(prisma.rewardRule.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
      expect(cache.invalidateCampaign).toHaveBeenCalledWith('c1');
    });

    it('should throw when rule not found', async () => {
      prisma.rewardRule.findUnique.mockResolvedValue(null);

      await expect(service.removeRule('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('should return paginated history', async () => {
      const mockHistory = {
        id: 'h1',
        userId: 'user-1',
        campaignId: 'c1',
        eventType: RewardEventType.GAME_COMPLETED,
        source: RewardSourceType.GAME,
        rewardGranted: true,
        coins: 50,
        multiplier: '1.0',
        reason: 'Reward granted',
        referenceId: null,
        referenceType: null,
        ruleApplied: null,
        expiresAt: null,
        metadata: null,
        createdAt: new Date(),
      };
      prisma.rewardHistory.findMany.mockResolvedValue([mockHistory]);
      prisma.rewardHistory.count.mockResolvedValue(1);

      const result = await service.getHistory('user-1', {
        page: 1,
        pageSize: 20,
        get skip() { return 0; },
        get take() { return 20; },
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].rewardGranted).toBe(true);
    });
  });
});
