import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewardStatus } from '@prisma/client';
import { RewardsController } from './rewards.controller';
import {
  RewardCatalogService,
  RewardRedemptionService,
  RewardEligibilityService,
  VoucherService,
  RewardAnalyticsService,
} from './services';

const mockUser = {
  sub: 'user-uuid-1',
  email: 'user@test.com',
  roles: [{ role: 'customer', storeId: null }],
  permissions: [],
  tokenVersion: 1,
  permissionsVersion: 1,
  sessionId: 'session-1',
};

const mockReq = {
  ip: '127.0.0.1',
  headers: { 'user-agent': 'TestAgent/1.0' },
} as never;

const pageQuery = { page: 1, pageSize: 20, skip: 0, take: 20 } as never;

describe('RewardsController', () => {
  let controller: RewardsController;
  let catalog: Record<string, ReturnType<typeof vi.fn>>;
  let redemption: Record<string, ReturnType<typeof vi.fn>>;
  let eligibility: Record<string, ReturnType<typeof vi.fn>>;
  let voucher: Record<string, ReturnType<typeof vi.fn>>;
  let analytics: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    catalog = {
      listCatalog: vi.fn().mockResolvedValue({ items: [], meta: {} }),
      listCategories: vi.fn().mockResolvedValue([]),
      getFeatured: vi.fn().mockResolvedValue([]),
      getPopular: vi.fn().mockResolvedValue([]),
      getDetail: vi.fn().mockResolvedValue({ id: 'reward-1', category: { id: 'cat-1' } }),
      getRelated: vi.fn().mockResolvedValue([]),
      listAdmin: vi.fn().mockResolvedValue({ items: [], meta: {} }),
      create: vi.fn().mockResolvedValue({ id: 'reward-1' }),
      update: vi.fn().mockResolvedValue({ id: 'reward-1' }),
      updateStatus: vi.fn().mockResolvedValue({ status: RewardStatus.PUBLISHED }),
      adjustStock: vi.fn().mockResolvedValue({ remainingStock: 42 }),
      delete: vi.fn().mockResolvedValue(undefined),
      createCategory: vi.fn().mockResolvedValue({ id: 'cat-1' }),
      updateCategory: vi.fn().mockResolvedValue({ id: 'cat-1' }),
    };
    redemption = {
      redeem: vi.fn().mockResolvedValue({ id: 'redemption-1' }),
      checkEligibility: vi.fn().mockResolvedValue({ eligible: true }),
      listUserRedemptions: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    };
    eligibility = {};
    voucher = {
      listUserVouchers: vi.fn().mockResolvedValue({ items: [], meta: {} }),
      getUserVoucher: vi.fn().mockResolvedValue({ id: 'voucher-1' }),
      verifyVoucher: vi.fn().mockResolvedValue({ valid: true }),
      redeemVoucher: vi.fn().mockResolvedValue({ valid: true }),
    };
    analytics = {
      trackView: vi.fn(),
      track: vi.fn(),
      getRewardStats: vi.fn().mockResolvedValue({ rewardId: 'reward-1' }),
      getOverview: vi.fn().mockResolvedValue({ totalRewards: 3 }),
    };

    controller = new RewardsController(
      catalog as unknown as RewardCatalogService,
      redemption as unknown as RewardRedemptionService,
      eligibility as unknown as RewardEligibilityService,
      voucher as unknown as VoucherService,
      analytics as unknown as RewardAnalyticsService,
      {} as any,
    );
  });

  it('should list the catalog', async () => {
    const result = await controller.listCatalog(pageQuery);
    expect(result.items).toEqual([]);
  });

  it('should list categories', async () => {
    await controller.listCategories();
    expect(catalog.listCategories).toHaveBeenCalled();
  });

  it('should list featured rewards', async () => {
    await controller.listFeatured();
    expect(catalog.getFeatured).toHaveBeenCalled();
  });

  it('should list popular rewards', async () => {
    await controller.listPopular();
    expect(catalog.getPopular).toHaveBeenCalled();
  });

  it('should return reward detail and record a view', async () => {
    const result = await controller.getReward('free-coffee', mockUser as never);

    expect(result.id).toBe('reward-1');
    expect(analytics.trackView).toHaveBeenCalledWith('reward-1', mockUser.sub);
  });

  it('should return related rewards', async () => {
    await controller.getRelated('free-coffee');
    expect(catalog.getRelated).toHaveBeenCalledWith('reward-1', 'cat-1');
  });

  it('should check eligibility for the signed-in user', async () => {
    const result = await controller.checkEligibility('free-coffee', mockUser as never);

    expect(result.eligible).toBe(true);
    expect(redemption.checkEligibility).toHaveBeenCalledWith(mockUser.sub, 'free-coffee');
  });

  it('should redeem using the authenticated user, never a body-supplied id', async () => {
    await controller.redeem('free-coffee', {}, mockUser as never, mockReq);

    expect(redemption.redeem).toHaveBeenCalledWith(
      mockUser.sub,
      'free-coffee',
      {},
      expect.objectContaining({ ip: '127.0.0.1' }),
    );
  });

  it('should scope voucher listing to the current user', async () => {
    await controller.listMyVouchers(mockUser as never, pageQuery);

    expect(voucher.listUserVouchers).toHaveBeenCalledWith(mockUser.sub, pageQuery);
  });

  it('should scope single voucher lookup to the current user', async () => {
    await controller.getMyVoucher(mockUser as never, 'voucher-1');

    expect(voucher.getUserVoucher).toHaveBeenCalledWith(mockUser.sub, 'voucher-1');
  });

  it('should verify a scanned voucher', async () => {
    const result = await controller.verifyVoucher({
      code: 'ABC', signature: 'sig',
    } as never);

    expect(result.valid).toBe(true);
  });

  it('should redeem a voucher as the scanning staff member', async () => {
    await controller.redeemVoucher(
      { code: 'ABC', signature: 'sig', storeId: 'store-1' } as never,
      mockUser as never,
    );

    expect(voucher.redeemVoucher).toHaveBeenCalledWith('ABC', 'sig', mockUser.sub, 'store-1');
  });

  it('should list my redemptions', async () => {
    await controller.listMyRedemptions(mockUser as never, pageQuery);

    expect(redemption.listUserRedemptions).toHaveBeenCalledWith(mockUser.sub, pageQuery);
  });

  it('should create a reward with the creator id', async () => {
    await controller.createReward({ title: 'X' } as never, mockUser as never);

    expect(catalog.create).toHaveBeenCalledWith({ title: 'X' }, mockUser.sub);
  });

  it('should update reward status', async () => {
    const result = await controller.updateRewardStatus('reward-1', RewardStatus.PUBLISHED);

    expect(result.status).toBe(RewardStatus.PUBLISHED);
  });

  it('should adjust stock from the path param', async () => {
    await controller.adjustStock('reward-1', '42');

    expect(catalog.adjustStock).toHaveBeenCalledWith('reward-1', 42);
  });

  it('should return a message on delete', async () => {
    const result = await controller.deleteReward('reward-1');

    expect(result.message).toBe('Reward deleted successfully');
  });

  it('should return reward stats', async () => {
    const result = await controller.getRewardStats('reward-1');

    expect(result.rewardId).toBe('reward-1');
  });

  it('should return the analytics overview', async () => {
    const result = await controller.getOverview();

    expect(result.totalRewards).toBe(3);
  });

  it('should record a tracked interaction', async () => {
    const result = await controller.trackEvent(
      'free-coffee',
      { eventType: 'REWARD_CLICK' } as never,
      mockUser as never,
    );

    expect(result.message).toBe('Event recorded');
    expect(analytics.track).toHaveBeenCalledWith(
      'REWARD_CLICK',
      expect.objectContaining({ rewardId: 'reward-1', userId: mockUser.sub }),
    );
  });
});
