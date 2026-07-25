import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletCacheService } from './wallet-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { WALLET_CACHE } from '../constants';

describe('WalletCacheService', () => {
  let cacheService: WalletCacheService;
  let redis: any;

  const userId = 'user-uuid-1';

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      del: vi.fn(),
      delPattern: vi.fn(),
    };

    cacheService = new WalletCacheService(redis as unknown as RedisService);
  });

  describe('getSummary / setSummary', () => {
    it('should get summary with correct key', async () => {
      await cacheService.getSummary(userId);
      expect(redis.get).toHaveBeenCalledWith(`${WALLET_CACHE.SUMMARY}${userId}`);
    });

    it('should set summary with TTL', async () => {
      const data = { balance: 100 };
      await cacheService.setSummary(userId, data);
      expect(redis.set).toHaveBeenCalledWith(
        `${WALLET_CACHE.SUMMARY}${userId}`,
        data,
        WALLET_CACHE.TTL,
      );
    });
  });

  describe('getBalance / setBalance', () => {
    it('should get balance with correct key', async () => {
      await cacheService.getBalance(userId);
      expect(redis.get).toHaveBeenCalledWith(`${WALLET_CACHE.BALANCE}${userId}`);
    });

    it('should set balance with TTL', async () => {
      const data = { balance: 50, pendingBalance: 0 };
      await cacheService.setBalance(userId, data);
      expect(redis.set).toHaveBeenCalledWith(
        `${WALLET_CACHE.BALANCE}${userId}`,
        data,
        WALLET_CACHE.TTL,
      );
    });
  });

  describe('invalidate', () => {
    it('should delete both summary and balance keys', async () => {
      await cacheService.invalidate(userId);
      expect(redis.del).toHaveBeenCalledWith(`${WALLET_CACHE.SUMMARY}${userId}`);
      expect(redis.del).toHaveBeenCalledWith(`${WALLET_CACHE.BALANCE}${userId}`);
    });
  });

  describe('invalidateAll', () => {
    it('should delete all wallet keys by pattern', async () => {
      await cacheService.invalidateAll();
      expect(redis.delPattern).toHaveBeenCalledWith(`${WALLET_CACHE.PREFIX}*`);
    });
  });
});
