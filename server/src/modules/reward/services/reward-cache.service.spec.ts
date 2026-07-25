import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewardCacheService } from './reward-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_CACHE } from '../constants';

describe('RewardCacheService', () => {
  let cacheService: RewardCacheService;
  let redis: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      del: vi.fn(),
      delPattern: vi.fn(),
      getClient: vi.fn().mockReturnValue({
        incr: vi.fn(),
        ttl: vi.fn().mockResolvedValue(100),
        expire: vi.fn(),
      }),
    };

    cacheService = new RewardCacheService(redis as unknown as RedisService);
  });

  describe('campaign cache', () => {
    it('should get campaign with correct key', async () => {
      await cacheService.getCampaign('c1');
      expect(redis.get).toHaveBeenCalledWith(`${REWARD_CACHE.CAMPAIGN}c1`);
    });

    it('should set campaign with TTL', async () => {
      await cacheService.setCampaign('c1', { name: 'Test' });
      expect(redis.set).toHaveBeenCalledWith(
        `${REWARD_CACHE.CAMPAIGN}c1`,
        { name: 'Test' },
        REWARD_CACHE.TTL_CAMPAIGN,
      );
    });
  });

  describe('active campaigns cache', () => {
    it('should key by event type', async () => {
      await cacheService.getActiveCampaigns('GAME_COMPLETED');
      expect(redis.get).toHaveBeenCalledWith(`${REWARD_CACHE.ACTIVE_CAMPAIGNS}GAME_COMPLETED`);
    });

    it('should set with TTL', async () => {
      await cacheService.setActiveCampaigns('GAME_COMPLETED', []);
      expect(redis.set).toHaveBeenCalledWith(
        `${REWARD_CACHE.ACTIVE_CAMPAIGNS}GAME_COMPLETED`,
        [],
        REWARD_CACHE.TTL_ACTIVE,
      );
    });
  });

  describe('rules cache', () => {
    it('should get rules for campaign', async () => {
      await cacheService.getRules('c1');
      expect(redis.get).toHaveBeenCalledWith(`${REWARD_CACHE.RULES}c1`);
    });
  });

  describe('daily count', () => {
    it('should return 0 when no count exists', async () => {
      const count = await cacheService.getDailyCount('user-1', 'GAME_COMPLETED');
      expect(count).toBe(0);
    });

    it('should increment and set TTL', async () => {
      const client = redis.getClient();
      client.ttl.mockResolvedValue(-1);

      await cacheService.incrementDailyCount('user-1', 'GAME_COMPLETED');

      expect(client.incr).toHaveBeenCalled();
      expect(client.expire).toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('should invalidate campaign and related caches', async () => {
      await cacheService.invalidateCampaign('c1');

      expect(redis.del).toHaveBeenCalledWith(`${REWARD_CACHE.CAMPAIGN}c1`);
      expect(redis.del).toHaveBeenCalledWith(`${REWARD_CACHE.RULES}c1`);
      expect(redis.delPattern).toHaveBeenCalledWith(`${REWARD_CACHE.ACTIVE_CAMPAIGNS}*`);
    });
  });

  describe('invalidateAll', () => {
    it('should delete all reward keys', async () => {
      await cacheService.invalidateAll();
      expect(redis.delPattern).toHaveBeenCalledWith(`${REWARD_CACHE.PREFIX}*`);
    });
  });
});
