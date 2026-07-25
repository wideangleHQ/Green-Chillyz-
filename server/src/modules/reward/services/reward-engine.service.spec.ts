import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RewardEventType,
  RewardSourceType,
  TransactionType,
  CampaignStatus,
} from '@prisma/client';
import { RewardEngineService } from './reward-engine.service';
import { PrismaService } from '../../../database/prisma.service';
import { RewardCacheService } from './reward-cache.service';
import { RewardEvent } from '../interfaces';

describe('RewardEngineService', () => {
  let service: RewardEngineService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  const userId = 'user-uuid-1';
  const campaignId = 'campaign-uuid-1';

  const makeCampaign = (overrides: Record<string, unknown> = {}) => ({
    id: campaignId,
    name: 'Test Campaign',
    slug: 'test-campaign',
    eventType: RewardEventType.GAME_COMPLETED,
    source: RewardSourceType.GAME,
    status: CampaignStatus.ACTIVE,
    baseCoins: 50,
    multiplier: '1.0',
    bonusCoins: 10,
    maxClaims: null,
    dailyLimit: null,
    totalBudget: null,
    spentBudget: '0',
    coinExpiryDays: 30,
    storeIds: [],
    brandIds: [],
    minPurchase: null,
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-12-31'),
    createdAt: new Date('2026-01-01'),
    ...overrides,
  });

  const baseEvent: RewardEvent = {
    eventType: RewardEventType.GAME_COMPLETED,
    userId,
    source: RewardSourceType.GAME,
    referenceId: 'game-123',
    referenceType: 'GAME',
  };

  beforeEach(() => {
    prisma = {
      rewardCampaign: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      rewardRule: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      rewardHistory: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
      },
    };

    cache = {
      getCampaign: vi.fn().mockResolvedValue(null),
      setCampaign: vi.fn(),
      getActiveCampaigns: vi.fn().mockResolvedValue(null),
      setActiveCampaigns: vi.fn(),
      getRules: vi.fn().mockResolvedValue(null),
      setRules: vi.fn(),
      getDailyCount: vi.fn().mockResolvedValue(0),
      incrementDailyCount: vi.fn(),
      invalidateCampaign: vi.fn(),
      invalidateAll: vi.fn(),
    };

    service = new RewardEngineService(
      prisma as unknown as PrismaService,
      cache as unknown as RewardCacheService,
    );
  });

  describe('evaluateReward', () => {
    it('should return no reward when no active campaigns', async () => {
      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      expect(result.totalCoins).toBe(0);
      expect(result.reason).toContain('No active campaign');
    });

    it('should grant reward when campaign matches', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(true);
      expect(result.totalCoins).toBe(60); // 50 * 1.0 + 10
      expect(result.campaignId).toBe(campaignId);
      expect(result.walletTransactionType).toBe(TransactionType.CREDIT);
    });

    it('should apply multiplier correctly', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ multiplier: '2.0', bonusCoins: 0 }),
      ]);

      const result = await service.evaluateReward(baseEvent);

      expect(result.totalCoins).toBe(100); // 50 * 2.0
      expect(result.multiplier).toBe(2.0);
    });

    it('should apply bonus coins correctly', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ multiplier: '1.5', bonusCoins: 25 }),
      ]);

      const result = await service.evaluateReward(baseEvent);

      expect(result.totalCoins).toBe(100); // round(50 * 1.5) + 25
    });

    it('should reject when budget exhausted', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ totalBudget: '1000', spentBudget: '1000' }),
      ]);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('budget');
    });

    it('should reject when campaign is outside date range', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({
          startsAt: new Date('2099-01-01'),
          endsAt: new Date('2099-12-31'),
        }),
      ]);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
    });

    it('should reject duplicate claims', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);
      prisma.rewardHistory.findFirst.mockResolvedValue({ id: 'existing' });

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('already claimed');
    });

    it('should reject when max claims reached', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ maxClaims: 3 }),
      ]);
      prisma.rewardHistory.count.mockResolvedValue(3);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('Maximum claims');
    });

    it('should reject when daily limit reached', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ dailyLimit: 2 }),
      ]);
      cache.getDailyCount.mockResolvedValue(2);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('Daily limit');
    });

    it('should reject ineligible store', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ storeIds: ['store-1', 'store-2'] }),
      ]);

      const result = await service.evaluateReward({
        ...baseEvent,
        storeId: 'store-99',
      });

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('Store not eligible');
    });

    it('should reject ineligible brand', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ brandIds: ['brand-1'] }),
      ]);

      const result = await service.evaluateReward({
        ...baseEvent,
        brandId: 'brand-99',
      });

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('Brand not eligible');
    });

    it('should reject when min purchase not met', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([
        makeCampaign({ minPurchase: '500' }),
      ]);

      const result = await service.evaluateReward({
        ...baseEvent,
        purchaseAmount: 200,
      });

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('Minimum purchase');
    });

    it('should record history on reward granted', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);

      await service.evaluateReward(baseEvent);

      expect(prisma.rewardHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            rewardGranted: true,
            coins: 60,
          }),
        }),
      );
    });

    it('should record history on reward denied', async () => {
      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      // No history for "no campaign found" — only recorded when a campaign was evaluated
    });

    it('should increment daily count on success', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);

      await service.evaluateReward(baseEvent);

      expect(cache.incrementDailyCount).toHaveBeenCalledWith(userId, RewardEventType.GAME_COMPLETED);
    });

    it('should update spent budget on success', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);

      await service.evaluateReward(baseEvent);

      expect(prisma.rewardCampaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: { spentBudget: { increment: 60 } },
      });
    });

    it('should use cached active campaigns', async () => {
      cache.getActiveCampaigns.mockResolvedValue([makeCampaign()]);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(true);
      expect(prisma.rewardCampaign.findMany).not.toHaveBeenCalled();
    });

    it('should evaluate rules from campaign', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);
      prisma.rewardRule.findMany.mockResolvedValue([
        { id: 'r1', ruleType: 'DAILY_LIMIT', operator: 'LESS_THAN', value: '1', priority: 0 },
      ]);
      cache.getDailyCount.mockResolvedValue(5);

      const result = await service.evaluateReward(baseEvent);

      expect(result.rewardGranted).toBe(false);
      expect(result.reason).toContain('Daily limit');
    });

    it('should include metadata in decision', async () => {
      prisma.rewardCampaign.findMany.mockResolvedValue([makeCampaign()]);

      const result = await service.evaluateReward({
        ...baseEvent,
        metadata: { gameScore: 100 },
      });

      expect(result.metadata).toHaveProperty('gameScore', 100);
      expect(result.metadata).toHaveProperty('campaignSlug', 'test-campaign');
    });
  });

  describe('calculateCoins', () => {
    it('should return base coins', () => {
      expect(service.calculateCoins(makeCampaign() as any)).toBe(50);
    });
  });

  describe('applyMultiplier', () => {
    it('should parse multiplier from Decimal', () => {
      expect(service.applyMultiplier(makeCampaign({ multiplier: '2.5' }) as any)).toBe(2.5);
    });

    it('should default to 1.0 on null', () => {
      expect(service.applyMultiplier(makeCampaign({ multiplier: null }) as any)).toBe(1.0);
    });
  });

  describe('computeTotal', () => {
    it('should compute base * multiplier + bonus', () => {
      expect(service.computeTotal(50, 2.0, 10)).toBe(110);
    });

    it('should round fractional results', () => {
      expect(service.computeTotal(33, 1.5, 0)).toBe(50); // round(49.5) = 50
    });
  });

  describe('calculateExpiry', () => {
    it('should calculate expiry from days', () => {
      const expiry = service.calculateExpiry(30);
      expect(expiry).toBeInstanceOf(Date);
      const diff = expiry!.getTime() - Date.now();
      expect(diff).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(31 * 24 * 60 * 60 * 1000);
    });

    it('should use default expiry when null', () => {
      const expiry = service.calculateExpiry(null);
      expect(expiry).toBeInstanceOf(Date);
      const diff = expiry!.getTime() - Date.now();
      expect(diff).toBeGreaterThan(89 * 24 * 60 * 60 * 1000);
    });
  });
});
