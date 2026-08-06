import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../providers/redis/redis.service';
import { DashboardStoreRepository } from '../repositories';
import { DashboardLoginThrottleService } from './dashboard-login-throttle.service';
import { DASHBOARD_REDIS_PREFIXES } from '../constants';

const CONFIG_VALUES: Record<string, unknown> = {
  'dashboardAuth.loginRateLimitWindowSeconds': 60,
  'dashboardAuth.loginRateLimitMaxAttempts': 3,
  'dashboardAuth.maxFailedAttempts': 3,
  'dashboardAuth.lockDurationMinutes': 15,
};

describe('DashboardLoginThrottleService', () => {
  let service: DashboardLoginThrottleService;
  let redis: {
    del: ReturnType<typeof vi.fn>;
    getClient: ReturnType<typeof vi.fn>;
  };
  let client: {
    incr: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
  };
  let storeRepository: {
    incrementFailedAttempts: ReturnType<typeof vi.fn>;
    applyLock: ReturnType<typeof vi.fn>;
    clearLock: ReturnType<typeof vi.fn>;
    recordSuccessfulLogin: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    client = { incr: vi.fn(), expire: vi.fn() };
    redis = {
      del: vi.fn().mockResolvedValue(undefined),
      getClient: vi.fn().mockReturnValue(client),
    };
    storeRepository = {
      incrementFailedAttempts: vi.fn(),
      applyLock: vi.fn().mockResolvedValue(undefined),
      clearLock: vi.fn().mockResolvedValue(undefined),
      recordSuccessfulLogin: vi.fn().mockResolvedValue(undefined),
    };

    const config = {
      get: (key: string, fallback?: unknown) => CONFIG_VALUES[key] ?? fallback,
    } as unknown as ConfigService;

    service = new DashboardLoginThrottleService(
      config,
      redis as unknown as RedisService,
      storeRepository as unknown as DashboardStoreRepository,
    );
  });

  describe('consumeAttempt', () => {
    it('should allow an attempt inside the window', async () => {
      client.incr.mockResolvedValue(1);
      expect(await service.consumeAttempt('203.0.113.10')).toBe(true);
    });

    it('should allow exactly the configured maximum', async () => {
      client.incr.mockResolvedValue(3);
      expect(await service.consumeAttempt('203.0.113.10')).toBe(true);
    });

    it('should reject once the maximum is exceeded', async () => {
      client.incr.mockResolvedValue(4);
      expect(await service.consumeAttempt('203.0.113.10')).toBe(false);
    });

    it('should key the counter by IP', async () => {
      client.incr.mockResolvedValue(1);
      await service.consumeAttempt('203.0.113.10');

      expect(client.incr).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.LOGIN_ATTEMPTS}203.0.113.10`,
      );
    });

    it('should set the TTL only on the first attempt, keeping the window fixed', async () => {
      client.incr.mockResolvedValue(1);
      await service.consumeAttempt('203.0.113.10');
      expect(client.expire).toHaveBeenCalledWith(expect.any(String), 60);

      client.expire.mockClear();
      client.incr.mockResolvedValue(2);
      await service.consumeAttempt('203.0.113.10');
      expect(client.expire).not.toHaveBeenCalled();
    });

    it('should count concurrent attempts independently', async () => {
      let counter = 0;
      client.incr.mockImplementation(async () => {
        counter += 1;
        return counter;
      });

      const results = await Promise.all([
        service.consumeAttempt('203.0.113.10'),
        service.consumeAttempt('203.0.113.10'),
        service.consumeAttempt('203.0.113.10'),
        service.consumeAttempt('203.0.113.10'),
      ]);

      expect(results.filter(Boolean)).toHaveLength(3);
      expect(results.filter((allowed) => !allowed)).toHaveLength(1);
    });

    it('should track separate IPs separately', async () => {
      client.incr.mockResolvedValue(1);

      await service.consumeAttempt('203.0.113.10');
      await service.consumeAttempt('203.0.113.11');

      expect(client.incr).toHaveBeenNthCalledWith(
        1,
        `${DASHBOARD_REDIS_PREFIXES.LOGIN_ATTEMPTS}203.0.113.10`,
      );
      expect(client.incr).toHaveBeenNthCalledWith(
        2,
        `${DASHBOARD_REDIS_PREFIXES.LOGIN_ATTEMPTS}203.0.113.11`,
      );
    });
  });

  describe('isLocked', () => {
    it('should report unlocked when no lock is set', () => {
      expect(service.isLocked(null)).toBe(false);
    });

    it('should report locked while the lock is in the future', () => {
      expect(service.isLocked(new Date(Date.now() + 60_000))).toBe(true);
    });

    it('should report unlocked once the lock has elapsed', () => {
      expect(service.isLocked(new Date(Date.now() - 1_000))).toBe(false);
    });
  });

  describe('registerFailure', () => {
    it('should not lock below the threshold', async () => {
      storeRepository.incrementFailedAttempts.mockResolvedValue({
        dashboardFailedAttempts: 2,
      });

      const state = await service.registerFailure('store-1');

      expect(state.locked).toBe(false);
      expect(state.failedAttempts).toBe(2);
      expect(storeRepository.applyLock).not.toHaveBeenCalled();
    });

    it('should lock exactly at the threshold', async () => {
      storeRepository.incrementFailedAttempts.mockResolvedValue({
        dashboardFailedAttempts: 3,
      });

      const state = await service.registerFailure('store-1');

      expect(state.locked).toBe(true);
      expect(state.lockedUntil).toBeInstanceOf(Date);
      expect(storeRepository.applyLock).toHaveBeenCalledWith(
        'store-1',
        expect.any(Date),
      );
    });

    it('should lock for the configured duration', async () => {
      storeRepository.incrementFailedAttempts.mockResolvedValue({
        dashboardFailedAttempts: 3,
      });

      const before = Date.now();
      const state = await service.registerFailure('store-1');
      const lockMs = (state.lockedUntil as Date).getTime() - before;

      expect(lockMs).toBeGreaterThan(14 * 60 * 1000);
      expect(lockMs).toBeLessThanOrEqual(15 * 60 * 1000 + 1000);
    });

    it('should use an atomic increment rather than read-modify-write', async () => {
      storeRepository.incrementFailedAttempts.mockResolvedValue({
        dashboardFailedAttempts: 1,
      });

      await service.registerFailure('store-1');

      expect(storeRepository.incrementFailedAttempts).toHaveBeenCalledWith(
        'store-1',
      );
    });
  });

  describe('registerSuccess', () => {
    it('should clear the failure counter and record the login', async () => {
      await service.registerSuccess('store-1', '203.0.113.10');

      expect(storeRepository.recordSuccessfulLogin).toHaveBeenCalledWith(
        'store-1',
        '203.0.113.10',
      );
    });

    it('should reset the IP rate-limit window', async () => {
      await service.registerSuccess('store-1', '203.0.113.10');

      expect(redis.del).toHaveBeenCalledWith(
        `${DASHBOARD_REDIS_PREFIXES.LOGIN_ATTEMPTS}203.0.113.10`,
      );
    });
  });
});
