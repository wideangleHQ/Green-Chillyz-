import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisService } from '../../../providers/redis/redis.service';
import { DashboardCacheService } from './dashboard-cache.service';
import {
  DASHBOARD_CACHE_TTL,
  DASHBOARD_REDIS_PREFIXES,
} from '../constants';
import { DashboardSessionData, DashboardStoreContext } from '../interfaces';

function sessionData(
  overrides: Partial<DashboardSessionData> = {},
): DashboardSessionData {
  return {
    sessionId: 'session-1',
    storeId: 'store-1',
    ipAddress: '203.0.113.10',
    userAgent: 'vitest',
    deviceFingerprint: null,
    issuedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}

describe('DashboardCacheService', () => {
  let service: DashboardCacheService;
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    ttl: ReturnType<typeof vi.fn>;
    getClient: ReturnType<typeof vi.fn>;
  };
  let client: { incr: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    client = { incr: vi.fn() };
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      ttl: vi.fn().mockResolvedValue(-1),
      getClient: vi.fn().mockReturnValue(client),
    };
    service = new DashboardCacheService(redis as unknown as RedisService);
  });

  describe('setSession', () => {
    it('should write the session under the dashboard prefix', async () => {
      const data = sessionData();
      await service.setSession(data, 120);

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.SESSION}session-1`,
        data,
        120,
      );
    });

    it('should register the session in the store index', async () => {
      await service.setSession(sessionData(), 120);

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}store-1`,
        ['session-1'],
        120,
      );
    });

    it('should not duplicate a session already in the store index', async () => {
      redis.get.mockResolvedValue(['session-1']);
      await service.setSession(sessionData(), 120);

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}store-1`,
        ['session-1'],
        120,
      );
    });

    it('should keep sessions from the same store side by side', async () => {
      redis.get.mockResolvedValue(['session-0']);
      await service.setSession(sessionData({ sessionId: 'session-1' }), 120);

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}store-1`,
        ['session-0', 'session-1'],
        120,
      );
    });
  });

  describe('getSession', () => {
    it('should read from the session key', async () => {
      const data = sessionData();
      redis.get.mockResolvedValue(data);

      expect(await service.getSession('session-1')).toEqual(data);
      expect(redis.get).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.SESSION}session-1`,
      );
    });

    it('should return null on a miss', async () => {
      expect(await service.getSession('missing')).toBeNull();
    });
  });

  describe('touchSession', () => {
    it('should do nothing when the session is not cached', async () => {
      await service.touchSession('missing');
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('should preserve the remaining TTL rather than extending the session', async () => {
      redis.get.mockResolvedValue(sessionData());
      redis.ttl.mockResolvedValue(45);

      await service.touchSession('session-1');

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.SESSION}session-1`,
        expect.objectContaining({ sessionId: 'session-1' }),
        45,
      );
    });

    it('should fall back to the default TTL when Redis reports none', async () => {
      redis.get.mockResolvedValue(sessionData());
      redis.ttl.mockResolvedValue(-1);

      await service.touchSession('session-1');

      expect(redis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        DASHBOARD_CACHE_TTL.SESSION_SECONDS,
      );
    });

    it('should advance lastActivityAt', async () => {
      const original = sessionData({
        lastActivityAt: new Date(Date.now() - 60_000).toISOString(),
      });
      redis.get.mockResolvedValue(original);

      await service.touchSession('session-1');

      const written = redis.set.mock.calls[0][1] as DashboardSessionData;
      expect(new Date(written.lastActivityAt).getTime()).toBeGreaterThan(
        new Date(original.lastActivityAt).getTime(),
      );
    });
  });

  describe('deleteSession', () => {
    it('should drop the session key', async () => {
      await service.deleteSession('session-1', 'store-1');

      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.SESSION}session-1`,
      );
    });

    it('should drop the store index once the last session goes', async () => {
      redis.get.mockResolvedValue(['session-1']);
      await service.deleteSession('session-1', 'store-1');

      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}store-1`,
      );
    });

    it('should keep the remaining sessions in the store index', async () => {
      redis.get.mockResolvedValue(['session-1', 'session-2']);
      await service.deleteSession('session-1', 'store-1');

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}store-1`,
        ['session-2'],
        DASHBOARD_CACHE_TTL.SESSION_SECONDS,
      );
    });
  });

  describe('deleteStoreSessions', () => {
    it('should clear every cached session and the index', async () => {
      redis.get.mockResolvedValue(['session-1', 'session-2']);

      await service.deleteStoreSessions('store-1');

      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.SESSION}session-1`,
      );
      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.SESSION}session-2`,
      );
      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}store-1`,
      );
    });

    it('should tolerate a store with no cached sessions', async () => {
      await expect(
        service.deleteStoreSessions('store-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('store context', () => {
    const context = { storeId: 'store-1' } as DashboardStoreContext;

    it('should cache with the store context TTL', async () => {
      await service.setStoreContext(context);

      expect(redis.set).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_CONTEXT}store-1`,
        context,
        DASHBOARD_CACHE_TTL.STORE_CONTEXT_SECONDS,
      );
    });

    it('should read from the store context key', async () => {
      redis.get.mockResolvedValue(context);
      expect(await service.getStoreContext('store-1')).toEqual(context);
    });

    it('should invalidate a single store context', async () => {
      await service.invalidateStoreContext('store-1');

      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.STORE_CONTEXT}store-1`,
      );
    });
  });

  describe('token version', () => {
    it('should default to zero when unset', async () => {
      expect(await service.getTokenVersion('store-1')).toBe(0);
    });

    it('should return the stored version', async () => {
      redis.get.mockResolvedValue(4);
      expect(await service.getTokenVersion('store-1')).toBe(4);
    });

    it('should increment atomically through Redis INCR', async () => {
      client.incr.mockResolvedValue(5);

      expect(await service.incrementTokenVersion('store-1')).toBe(5);
      expect(client.incr).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.TOKEN_VERSION}store-1`,
      );
    });

    it('should not lose increments under concurrency', async () => {
      let counter = 0;
      client.incr.mockImplementation(async () => {
        counter += 1;
        return counter;
      });

      const results = await Promise.all([
        service.incrementTokenVersion('store-1'),
        service.incrementTokenVersion('store-1'),
        service.incrementTokenVersion('store-1'),
      ]);

      expect(new Set(results).size).toBe(3);
      expect(Math.max(...results)).toBe(3);
    });
  });
});
