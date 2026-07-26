import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reward, RewardStatus, RewardAvailability, RewardType } from '@prisma/client';
import { RewardEligibilityService } from './reward-eligibility.service';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { RewardsCacheService } from './rewards-cache.service';
import { REWARDS_ERRORS } from '../constants';

const makeReward = (overrides: Partial<Reward> = {}): Reward =>
  ({
    id: 'reward-1',
    title: 'Free Coffee',
    slug: 'free-coffee',
    coinCost: 100,
    status: RewardStatus.PUBLISHED,
    availability: RewardAvailability.GLOBAL,
    rewardType: RewardType.FREE_ITEM,
    stock: null,
    dailyLimit: null,
    userLimit: null,
    minimumLoyaltyTier: null,
    brandId: null,
    validFrom: null,
    validUntil: null,
    voucherValidDays: 30,
    ...overrides,
  }) as Reward;

describe('RewardEligibilityService', () => {
  let service: RewardEligibilityService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  const userId = 'user-1';

  const activeUser = {
    id: userId,
    isActive: true,
    deletedAt: null,
    wallet: { balance: '500', isActive: true },
    customerProfile: {
      assignedStoreId: 'store-1',
      assignedStore: { brandId: 'brand-1' },
    },
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(activeUser) },
      rewardStoreAvailability: { findMany: vi.fn().mockResolvedValue([]) },
      rewardRedemption: { count: vi.fn().mockResolvedValue(0) },
      customerProfile: { findUnique: vi.fn().mockResolvedValue({ assignedStoreId: 'store-1' }) },
    };
    cache = { getDailyRedemptionCount: vi.fn().mockResolvedValue(0) };

    service = new RewardEligibilityService(
      prisma as unknown as PrismaService,
      {} as unknown as WalletService,
      cache as unknown as RewardsCacheService,
    );
  });

  it('should pass a fully eligible user', async () => {
    const result = await service.check(userId, makeReward());

    expect(result.eligible).toBe(true);
    expect(result.balance).toBe(500);
    expect(result.shortBy).toBe(0);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it('should reject an inactive user', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, isActive: false });

    const result = await service.check(userId, makeReward());

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.USER_INACTIVE);
  });

  it('should reject a soft-deleted user', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, deletedAt: new Date() });

    const result = await service.check(userId, makeReward());

    expect(result.eligible).toBe(false);
  });

  it('should reject an inactive wallet', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      wallet: { balance: '500', isActive: false },
    });

    const result = await service.check(userId, makeReward());

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.WALLET_INACTIVE);
  });

  it('should reject an unpublished reward', async () => {
    const result = await service.check(userId, makeReward({ status: RewardStatus.DRAFT }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.REWARD_NOT_AVAILABLE);
  });

  it('should reject a reward that has not started', async () => {
    const future = new Date(Date.now() + 86_400_000);

    const result = await service.check(userId, makeReward({ validFrom: future }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.REWARD_NOT_STARTED);
  });

  it('should reject an expired reward', async () => {
    const past = new Date(Date.now() - 86_400_000);

    const result = await service.check(userId, makeReward({ validUntil: past }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.REWARD_EXPIRED);
  });

  it('should reject when out of stock', async () => {
    const result = await service.check(userId, makeReward({ stock: 0 }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.OUT_OF_STOCK);
  });

  it('should allow unlimited stock (null)', async () => {
    const result = await service.check(userId, makeReward({ stock: null }));

    expect(result.eligible).toBe(true);
  });

  it('should reject an ineligible store', async () => {
    prisma.rewardStoreAvailability.findMany.mockResolvedValue([{ storeId: 'store-99' }]);

    const result = await service.check(
      userId,
      makeReward({ availability: RewardAvailability.STORE_SPECIFIC }),
    );

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.STORE_INELIGIBLE);
  });

  it('should accept a matching store', async () => {
    prisma.rewardStoreAvailability.findMany.mockResolvedValue([{ storeId: 'store-1' }]);

    const result = await service.check(
      userId,
      makeReward({ availability: RewardAvailability.STORE_SPECIFIC }),
    );

    expect(result.eligible).toBe(true);
  });

  it('should reject an ineligible brand', async () => {
    const result = await service.check(
      userId,
      makeReward({ availability: RewardAvailability.BRAND_SPECIFIC, brandId: 'brand-99' }),
    );

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.BRAND_INELIGIBLE);
  });

  it('should reject when the global daily limit is reached', async () => {
    cache.getDailyRedemptionCount.mockResolvedValue(5);

    const result = await service.check(userId, makeReward({ dailyLimit: 5 }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.DAILY_LIMIT_REACHED);
  });

  it('should reject when the per-user limit is reached', async () => {
    prisma.rewardRedemption.count.mockResolvedValue(2);

    const result = await service.check(userId, makeReward({ userLimit: 2 }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.USER_LIMIT_REACHED);
  });

  it('should reject insufficient coins and report the gap', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      wallet: { balance: '40', isActive: true },
    });

    const result = await service.check(userId, makeReward({ coinCost: 100 }));

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe(REWARDS_ERRORS.INSUFFICIENT_COINS);
    expect(result.shortBy).toBe(60);
  });

  it('should treat an exact balance as sufficient', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      wallet: { balance: '100', isActive: true },
    });

    const result = await service.check(userId, makeReward({ coinCost: 100 }));

    expect(result.eligible).toBe(true);
  });

  describe('resolveStoreId', () => {
    it('should prefer an explicitly requested store', async () => {
      const storeId = await service.resolveStoreId(userId, 'store-42');

      expect(storeId).toBe('store-42');
      expect(prisma.customerProfile.findUnique).not.toHaveBeenCalled();
    });

    it('should fall back to the assigned store', async () => {
      const storeId = await service.resolveStoreId(userId);

      expect(storeId).toBe('store-1');
    });

    it('should return null when the user has no profile', async () => {
      prisma.customerProfile.findUnique.mockResolvedValue(null);

      const storeId = await service.resolveStoreId(userId);

      expect(storeId).toBeNull();
    });
  });
});
