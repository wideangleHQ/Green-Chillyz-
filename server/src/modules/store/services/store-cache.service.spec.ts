import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreCacheService } from './store-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { STORE_CACHE } from '../constants';

describe('StoreCacheService', () => {
  let service: StoreCacheService;
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    delPattern: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    redis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      delPattern: vi.fn(),
    };
    service = new StoreCacheService(redis as unknown as RedisService);
  });

  describe('getStoreDetail / setStoreDetail', () => {
    it('should get detail from redis with correct key', async () => {
      const data = { id: 'store-1', name: 'Test' };
      redis.get.mockResolvedValue(data);

      const result = await service.getStoreDetail('store-1');

      expect(redis.get).toHaveBeenCalledWith(`${STORE_CACHE.DETAIL}store-1`);
      expect(result).toEqual(data);
    });

    it('should return null when not cached', async () => {
      redis.get.mockResolvedValue(null);
      expect(await service.getStoreDetail('missing')).toBeNull();
    });

    it('should set detail with TTL', async () => {
      const data = { id: 'store-1' };
      await service.setStoreDetail('store-1', data);

      expect(redis.set).toHaveBeenCalledWith(
        `${STORE_CACHE.DETAIL}store-1`,
        data,
        STORE_CACHE.TTL_DETAIL,
      );
    });
  });

  describe('getStoreBySlug / setStoreBySlug', () => {
    it('should get by slug key', async () => {
      redis.get.mockResolvedValue({ slug: 'test-slug' });
      await service.getStoreBySlug('test-slug');
      expect(redis.get).toHaveBeenCalledWith(`${STORE_CACHE.SLUG}test-slug`);
    });

    it('should set slug with detail TTL', async () => {
      await service.setStoreBySlug('test-slug', { id: '1' });
      expect(redis.set).toHaveBeenCalledWith(
        `${STORE_CACHE.SLUG}test-slug`,
        { id: '1' },
        STORE_CACHE.TTL_DETAIL,
      );
    });
  });

  describe('getList / setList', () => {
    it('should use list prefix', async () => {
      redis.get.mockResolvedValue([]);
      await service.getList('page:1');
      expect(redis.get).toHaveBeenCalledWith(`${STORE_CACHE.LIST}page:1`);
    });

    it('should use default TTL when none provided', async () => {
      await service.setList('page:1', []);
      expect(redis.set).toHaveBeenCalledWith(
        `${STORE_CACHE.LIST}page:1`,
        [],
        STORE_CACHE.TTL_LIST,
      );
    });

    it('should use custom TTL when provided', async () => {
      await service.setList('page:1', [], 60);
      expect(redis.set).toHaveBeenCalledWith(
        `${STORE_CACHE.LIST}page:1`,
        [],
        60,
      );
    });
  });

  describe('getFeatured / setFeatured', () => {
    it('should use featured key', async () => {
      redis.get.mockResolvedValue([]);
      await service.getFeatured();
      expect(redis.get).toHaveBeenCalledWith(STORE_CACHE.FEATURED);
    });

    it('should set with featured TTL', async () => {
      await service.setFeatured([]);
      expect(redis.set).toHaveBeenCalledWith(
        STORE_CACHE.FEATURED,
        [],
        STORE_CACHE.TTL_FEATURED,
      );
    });
  });

  describe('getNearby / setNearby', () => {
    it('should use nearby prefix', async () => {
      redis.get.mockResolvedValue(null);
      await service.getNearby('12.9:77.5');
      expect(redis.get).toHaveBeenCalledWith(`${STORE_CACHE.NEARBY}12.9:77.5`);
    });

    it('should set with nearby TTL', async () => {
      await service.setNearby('12.9:77.5', []);
      expect(redis.set).toHaveBeenCalledWith(
        `${STORE_CACHE.NEARBY}12.9:77.5`,
        [],
        STORE_CACHE.TTL_NEARBY,
      );
    });
  });

  describe('getSearch / setSearch', () => {
    it('should use search prefix', async () => {
      redis.get.mockResolvedValue(null);
      await service.getSearch('q:pizza');
      expect(redis.get).toHaveBeenCalledWith(`${STORE_CACHE.SEARCH}q:pizza`);
    });

    it('should set with search TTL', async () => {
      await service.setSearch('q:pizza', { items: [] });
      expect(redis.set).toHaveBeenCalledWith(
        `${STORE_CACHE.SEARCH}q:pizza`,
        { items: [] },
        STORE_CACHE.TTL_SEARCH,
      );
    });
  });

  describe('invalidateStore', () => {
    it('should clear detail, lists, featured, nearby, and search', async () => {
      await service.invalidateStore('store-1');

      expect(redis.del).toHaveBeenCalledWith(`${STORE_CACHE.DETAIL}store-1`);
      expect(redis.del).toHaveBeenCalledWith(STORE_CACHE.FEATURED);
      expect(redis.delPattern).toHaveBeenCalledWith(`${STORE_CACHE.LIST}*`);
      expect(redis.delPattern).toHaveBeenCalledWith(`${STORE_CACHE.NEARBY}*`);
      expect(redis.delPattern).toHaveBeenCalledWith(`${STORE_CACHE.SEARCH}*`);
    });

    it('should also clear slug when provided', async () => {
      await service.invalidateStore('store-1', 'test-slug');

      expect(redis.del).toHaveBeenCalledWith(`${STORE_CACHE.SLUG}test-slug`);
    });

    it('should not clear slug when not provided', async () => {
      await service.invalidateStore('store-1');

      const slugCalls = redis.del.mock.calls.filter((c: string[]) =>
        c[0].startsWith(STORE_CACHE.SLUG),
      );
      expect(slugCalls).toHaveLength(0);
    });
  });

  describe('invalidateAll', () => {
    it('should clear all store keys', async () => {
      await service.invalidateAll();
      expect(redis.delPattern).toHaveBeenCalledWith(`${STORE_CACHE.PREFIX}*`);
    });
  });
});
