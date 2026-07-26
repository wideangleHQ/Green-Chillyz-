import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { RedemptionStatus, RewardStatus, TransactionSource } from '@prisma/client';
import { RewardRedemptionService } from './reward-redemption.service';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { RewardCatalogService } from './reward-catalog.service';
import { RewardEligibilityService } from './reward-eligibility.service';
import { VoucherService } from './voucher.service';
import { RewardsCacheService } from './rewards-cache.service';
import { RewardAnalyticsService } from './reward-analytics.service';
import { REWARDS_ERRORS } from '../constants';

describe('RewardRedemptionService', () => {
  let service: RewardRedemptionService;
  let prisma: Record<string, any>;
  let wallet: Record<string, ReturnType<typeof vi.fn>>;
  let catalog: Record<string, ReturnType<typeof vi.fn>>;
  let eligibility: Record<string, ReturnType<typeof vi.fn>>;
  let voucher: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let analytics: Record<string, ReturnType<typeof vi.fn>>;

  const userId = 'user-1';
  const reward = {
    id: 'reward-1',
    title: 'Free Coffee',
    slug: 'free-coffee',
    image: null,
    coinCost: 100,
    stock: 10,
    status: RewardStatus.PUBLISHED,
    voucherValidDays: 30,
  };

  beforeEach(() => {
    prisma = {
      reward: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({ stock: 9, status: RewardStatus.PUBLISHED, slug: reward.slug }),
        update: vi.fn(),
      },
      rewardRedemption: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'redemption-1' }),
        update: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      $transaction: vi.fn(async (cb: (tx: unknown) => unknown) =>
        cb({
          rewardRedemption: { update: vi.fn() },
          reward: { update: vi.fn() },
        }),
      ),
    };

    wallet = {
      debit: vi.fn().mockResolvedValue({
        newBalance: 400,
        transaction: { id: 'txn-1' },
      }),
    };

    catalog = {
      findRewardForRedemption: vi.fn().mockResolvedValue(reward),
    };

    eligibility = {
      check: vi.fn().mockResolvedValue({ eligible: true, checks: [], balance: 500, coinCost: 100, shortBy: 0 }),
      resolveStoreId: vi.fn().mockResolvedValue('store-1'),
    };

    voucher = {
      createVoucher: vi.fn().mockResolvedValue({
        id: 'voucher-1',
        code: 'ABCD1234EFGH',
        signature: 'sig',
        expiresAt: new Date(),
      }),
      getUserVoucher: vi.fn().mockResolvedValue({ id: 'voucher-1', code: 'ABCD1234EFGH' }),
    };

    cache = {
      incrementDailyRedemptionCount: vi.fn(),
      invalidateReward: vi.fn(),
    };

    analytics = { track: vi.fn(), trackView: vi.fn() };

    const eventEmitter = { emit: vi.fn(), emitAsync: vi.fn() };

    service = new RewardRedemptionService(
      prisma as unknown as PrismaService,
      wallet as unknown as WalletService,
      catalog as unknown as RewardCatalogService,
      eligibility as unknown as RewardEligibilityService,
      voucher as unknown as VoucherService,
      cache as unknown as RewardsCacheService,
      analytics as unknown as RewardAnalyticsService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('redeem', () => {
    it('should complete a valid redemption', async () => {
      const result = await service.redeem(userId, 'free-coffee', {}, {});

      expect(result.status).toBe(RedemptionStatus.COMPLETED);
      expect(result.coinsSpent).toBe(100);
      expect(result.newBalance).toBe(400);
      expect(result.voucher.code).toBe('ABCD1234EFGH');
    });

    it('should debit through WalletService with the REWARD_REDEMPTION source', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      expect(wallet.debit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          amount: 100,
          source: TransactionSource.REWARD_REDEMPTION,
          referenceType: 'REWARD_REDEMPTION',
        }),
        undefined,
        undefined,
        undefined,
      );
    });

    it('should never modify wallet balances directly', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      // The only balance mutation path is WalletService.debit.
      expect(prisma.reward.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ balance: expect.anything() }) }),
      );
      expect(wallet.debit).toHaveBeenCalledTimes(1);
    });

    it('should reject when ineligible and never touch the wallet', async () => {
      eligibility.check.mockResolvedValue({
        eligible: false,
        reason: REWARDS_ERRORS.INSUFFICIENT_COINS,
        checks: [], balance: 10, coinCost: 100, shortBy: 90,
      });

      await expect(service.redeem(userId, 'free-coffee', {}, {})).rejects.toThrow(
        BadRequestException,
      );
      expect(wallet.debit).not.toHaveBeenCalled();
    });

    it('should reject a duplicate idempotency key', async () => {
      prisma.rewardRedemption.findUnique.mockResolvedValue({
        id: 'existing', status: RedemptionStatus.COMPLETED,
      });

      await expect(
        service.redeem(userId, 'free-coffee', { idempotencyKey: 'dup' }, {}),
      ).rejects.toThrow(ConflictException);
      expect(wallet.debit).not.toHaveBeenCalled();
    });

    it('should claim stock atomically before debiting', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      expect(prisma.reward.updateMany).toHaveBeenCalledWith({
        where: { id: reward.id, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
    });

    it('should reject when stock is exhausted by a concurrent redemption', async () => {
      // Conditional claim matched nothing and stock is finite.
      prisma.reward.updateMany.mockResolvedValue({ count: 0 });
      prisma.reward.findUnique.mockResolvedValue({ stock: 0 });

      await expect(service.redeem(userId, 'free-coffee', {}, {})).rejects.toThrow(
        BadRequestException,
      );
      expect(wallet.debit).not.toHaveBeenCalled();
    });

    it('should allow redemption when stock is unlimited', async () => {
      prisma.reward.updateMany.mockResolvedValue({ count: 0 });
      prisma.reward.findUnique.mockResolvedValue({ stock: null, status: RewardStatus.PUBLISHED, slug: reward.slug });

      const result = await service.redeem(userId, 'free-coffee', {}, {});

      expect(result.status).toBe(RedemptionStatus.COMPLETED);
    });

    it('should release stock when the wallet debit fails', async () => {
      wallet.debit.mockRejectedValue(new Error('Insufficient wallet balance'));

      await expect(service.redeem(userId, 'free-coffee', {}, {})).rejects.toThrow(
        'Insufficient wallet balance',
      );

      expect(prisma.reward.updateMany).toHaveBeenCalledWith({
        where: { id: reward.id, stock: { not: null } },
        data: { stock: { increment: 1 } },
      });
    });

    it('should mark the redemption FAILED when the debit fails', async () => {
      wallet.debit.mockRejectedValue(new Error('Wallet not found'));

      await expect(service.redeem(userId, 'free-coffee', {}, {})).rejects.toThrow();

      expect(prisma.rewardRedemption.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'redemption-1' },
          data: expect.objectContaining({ status: RedemptionStatus.FAILED }),
        }),
      );
    });

    it('should pass a deterministic idempotency key to the wallet', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      expect(wallet.debit).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'reward-redemption:redemption-1' }),
        undefined, undefined, undefined,
      );
    });

    it('should generate the voucher inside a transaction', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(voucher.createVoucher).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          redemptionId: 'redemption-1',
          rewardId: reward.id,
          userId,
          validDays: 30,
        }),
      );
    });

    it('should invalidate reward cache and bump the daily counter', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      expect(cache.incrementDailyRedemptionCount).toHaveBeenCalledWith(reward.id);
      expect(cache.invalidateReward).toHaveBeenCalledWith(reward.id, reward.slug);
    });

    it('should flip a reward to SOLD_OUT when the last unit goes', async () => {
      prisma.reward.findUnique.mockResolvedValue({
        stock: 0, status: RewardStatus.PUBLISHED, slug: reward.slug,
      });

      await service.redeem(userId, 'free-coffee', {}, {});

      expect(prisma.reward.update).toHaveBeenCalledWith({
        where: { id: reward.id },
        data: { status: RewardStatus.SOLD_OUT },
      });
    });

    it('should record success analytics', async () => {
      await service.redeem(userId, 'free-coffee', {}, {});

      expect(analytics.track).toHaveBeenCalledWith(
        'REDEEM_SUCCESS',
        expect.objectContaining({ rewardId: reward.id, userId }),
      );
    });

    it('should record failure analytics when ineligible', async () => {
      eligibility.check.mockResolvedValue({
        eligible: false, reason: 'nope', checks: [], balance: 0, coinCost: 100, shortBy: 100,
      });

      await expect(service.redeem(userId, 'free-coffee', {}, {})).rejects.toThrow();

      expect(analytics.track).toHaveBeenCalledWith(
        'REDEEM_FAILED',
        expect.objectContaining({ rewardId: reward.id }),
      );
    });

    it('should persist request context for auditing', async () => {
      await service.redeem(userId, 'free-coffee', {}, { ip: '1.2.3.4', device: 'Chrome' });

      expect(prisma.rewardRedemption.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ipAddress: '1.2.3.4', deviceInfo: 'Chrome' }),
        }),
      );
    });
  });

  describe('checkEligibility', () => {
    it('should delegate to the eligibility service', async () => {
      const result = await service.checkEligibility(userId, 'free-coffee');

      expect(result.eligible).toBe(true);
      expect(eligibility.check).toHaveBeenCalledWith(userId, reward);
    });
  });
});
