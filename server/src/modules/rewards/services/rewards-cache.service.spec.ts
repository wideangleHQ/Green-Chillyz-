import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewardsCacheService } from './rewards-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARDS_CACHE } from '../constants';

describe('RewardsCacheService', () => {
  let service: RewardsCacheService;
  let redis: Record<string, ReturnType<typeof vi.fn>>;
  let client: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    client = {
      incr: vi.fn(),
      ttl: vi.fn().mockResolvedValue(100),
      expire: vi.fn(),
    };
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      del: vi.fn(),
      delPattern: vi.fn(),
      getClient: vi.fn().mockReturnValue(client),
    };

    service = new RewardsCacheService(redis as unknown as RedisService);
  });

  describe('buildCatalogKey', () => {
    it('should be stable regardless of key order', () => {
      const a = service.buildCatalogKey({ page: 1, category: 'food' });
      const b = service.buildCatalogKey({ category: 'food', page: 1 });

      expect(a).toBe(b);
    });

    it('should differ for different filters', () => {
      const a = service.buildCatalogKey({ category: 'food' });
      const b = service.buildCatalogKey({ category: 'drinks' });

      expect(a).not.toBe(b);
    });

    it('should ignore undefined values', () => {
      const a = service.buildCatalogKey({ page: 1, search: undefined });
      const b = service.buildCatalogKey({ page: 1 });

      expect(a).toBe(b);
    });

    it('should be namespaced under the catalog prefix', () => {
      expect(service.buildCatalogKey({ page: 1 })).toContain(REWARDS_CACHE.CATALOG);
    });
  });

  describe('detail cache', () => {
    it('should read by id or slug', async () => {
      await service.getDetail('free-coffee');

      expect(redis.get).toHaveBeenCalledWith(`${REWARDS_CACHE.DETAIL}free-coffee`);
    });

    it('should write with the detail TTL', async () => {
      await service.setDetail('free-coffee', { id: 'r1' });

      expect(redis.set).toHaveBeenCalledWith(
        `${REWARDS_CACHE.DETAIL}free-coffee`,
        { id: 'r1' },
        REWARDS_CACHE.TTL_DETAIL,
      );
    });
  });

  describe('featured and popular', () => {
    it('should cache featured with its TTL', async () => {
      await service.setFeatured([]);

      expect(redis.set).toHaveBeenCalledWith(
        REWARDS_CACHE.FEATURED, [], REWARDS_CACHE.TTL_FEATURED,
      );
    });

    it('should cache popular with its TTL', async () => {
      await service.setPopular([]);

      expect(redis.set).toHaveBeenCalledWith(
        REWARDS_CACHE.POPULAR, [], REWARDS_CACHE.TTL_POPULAR,
      );
    });
  });

  describe('daily redemption counter', () => {
    it('should default to zero', async () => {
      expect(await service.getDailyRedemptionCount('reward-1')).toBe(0);
    });

    it('should increment and set an end-of-day expiry on first write', async () => {
      client.ttl.mockResolvedValue(-1);

      await service.incrementDailyRedemptionCount('reward-1');

      expect(client.incr).toHaveBeenCalled();
      expect(client.expire).toHaveBeenCalled();
    });

    it('should not reset an existing expiry', async () => {
      client.ttl.mockResolvedValue(500);

      await service.incrementDailyRedemptionCount('reward-1');

      expect(client.expire).not.toHaveBeenCalled();
    });
  });

  describe('invalidation', () => {
    it('should clear the reward and every listing surface', async () => {
      await service.invalidateReward('reward-1', 'free-coffee');

      expect(redis.del).toHaveBeenCalledWith(`${REWARDS_CACHE.DETAIL}reward-1`);
      expect(redis.del).toHaveBeenCalledWith(`${REWARDS_CACHE.DETAIL}free-coffee`);
      expect(redis.delPattern).toHaveBeenCalledWith(`${REWARDS_CACHE.CATALOG}*`);
      expect(redis.del).toHaveBeenCalledWith(REWARDS_CACHE.FEATURED);
      expect(redis.del).toHaveBeenCalledWith(REWARDS_CACHE.POPULAR);
    });

    it('should clear categories and listings together', async () => {
      await service.invalidateCategories();

      expect(redis.del).toHaveBeenCalledWith(REWARDS_CACHE.CATEGORIES);
      expect(redis.delPattern).toHaveBeenCalledWith(`${REWARDS_CACHE.CATALOG}*`);
    });

    it('should drop everything under the rewards prefix', async () => {
      await service.invalidateAll();

      expect(redis.delPattern).toHaveBeenCalledWith(`${REWARDS_CACHE.PREFIX}*`);
    });
  });
});
