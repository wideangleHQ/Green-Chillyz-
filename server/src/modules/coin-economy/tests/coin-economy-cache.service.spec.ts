import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoinEconomyCacheService } from '../cache/coin-economy-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { COIN_ECONOMY_CACHE } from '../constants';

describe('CoinEconomyCacheService', () => {
  let service: CoinEconomyCacheService;
  let redis: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
      ttl: vi.fn().mockResolvedValue(-2),
      exists: vi.fn().mockResolvedValue(false),
    };

    service = new CoinEconomyCacheService(redis as unknown as RedisService);
  });

  // ─── Rules ────────────────────────────────────────

  describe('rules cache', () => {
    it('getRules delegates to Redis', async () => {
      redis.get.mockResolvedValue([{ id: 'r1' }]);
      const result = await service.getRules();
      expect(result).toEqual([{ id: 'r1' }]);
      expect(redis.get).toHaveBeenCalledWith(COIN_ECONOMY_CACHE.RULES);
    });

    it('setRules writes with TTL', async () => {
      await service.setRules([{ id: 'r1' }]);
      expect(redis.set).toHaveBeenCalledWith(
        COIN_ECONOMY_CACHE.RULES,
        [{ id: 'r1' }],
        COIN_ECONOMY_CACHE.TTL_RULES,
      );
    });

    it('getRule/setRule use the rule-specific key', async () => {
      await service.setRule('rule-1', { id: 'rule-1' });
      expect(redis.set).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.RULE_ITEM}rule-1`,
        { id: 'rule-1' },
        COIN_ECONOMY_CACHE.TTL_RULE_ITEM,
      );

      await service.getRule('rule-1');
      expect(redis.get).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.RULE_ITEM}rule-1`,
      );
    });

    it('getRuleByType uses the type key', async () => {
      await service.getRuleByType('SPIN_WHEEL' as any);
      expect(redis.get).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.RULE_BY_TYPE}SPIN_WHEEL`,
      );
    });
  });

  // ─── Cooldown ─────────────────────────────────────

  describe('cooldown', () => {
    it('setCooldown writes with TTL', async () => {
      await service.setCooldown('u1', 'r1', 300, '2026-08-05T10:05:00Z');
      expect(redis.set).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.COOLDOWN}u1:r1`,
        '2026-08-05T10:05:00Z',
        300,
      );
    });

    it('setCooldown skips when seconds is zero', async () => {
      await service.setCooldown('u1', 'r1', 0, '2026-08-05T10:05:00Z');
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('getCooldownTtl returns the TTL', async () => {
      redis.ttl.mockResolvedValue(120);
      const ttl = await service.getCooldownTtl('u1', 'r1');
      expect(ttl).toBe(120);
    });

    it('getCooldownTtl returns 0 when key is missing', async () => {
      redis.ttl.mockResolvedValue(-2);
      const ttl = await service.getCooldownTtl('u1', 'r1');
      expect(ttl).toBe(0);
    });

    it('clearCooldown deletes the key', async () => {
      await service.clearCooldown('u1', 'r1');
      expect(redis.del).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.COOLDOWN}u1:r1`,
      );
    });
  });

  // ─── Daily markers ────────────────────────────────

  describe('daily markers', () => {
    it('getDailyLoginMarker returns true when set', async () => {
      redis.get.mockResolvedValue('1');
      const result = await service.getDailyLoginMarker('u1', '2026-08-05');
      expect(result).toBe(true);
    });

    it('getDailyLoginMarker returns false when not set', async () => {
      const result = await service.getDailyLoginMarker('u1', '2026-08-05');
      expect(result).toBe(false);
    });

    it('setDailyLoginMarker writes with marker TTL', async () => {
      await service.setDailyLoginMarker('u1', '2026-08-05');
      expect(redis.set).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.DAILY_LOGIN}u1:2026-08-05`,
        '1',
        COIN_ECONOMY_CACHE.TTL_MARKER,
      );
    });
  });

  // ─── Invalidation ─────────────────────────────────

  describe('invalidation', () => {
    it('invalidateRule deletes rule-specific keys', async () => {
      await service.invalidateRule('rule-1', 'SPIN_WHEEL' as any);
      expect(redis.del).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.RULE_ITEM}rule-1`,
      );
      expect(redis.del).toHaveBeenCalledWith(COIN_ECONOMY_CACHE.RULES);
      expect(redis.del).toHaveBeenCalledWith(COIN_ECONOMY_CACHE.GAME_RULES);
      expect(redis.del).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.RULE_BY_TYPE}SPIN_WHEEL`,
      );
    });

    it('invalidateLimits deletes the limits key', async () => {
      await service.invalidateLimits('rule-1');
      expect(redis.del).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.LIMITS}rule-1`,
      );
    });

    it('invalidateMultipliers uses pattern delete', async () => {
      await service.invalidateMultipliers();
      expect(redis.delPattern).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.MULTIPLIERS}*`,
      );
    });

    it('invalidateAll uses pattern delete on prefix', async () => {
      await service.invalidateAll();
      expect(redis.delPattern).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.PREFIX}*`,
      );
    });

    it('invalidateUsage deletes by user pattern', async () => {
      await service.invalidateUsage('u1');
      expect(redis.delPattern).toHaveBeenCalledWith(
        `${COIN_ECONOMY_CACHE.USAGE}u1:*`,
      );
    });
  });

  // ─── Fault tolerance ──────────────────────────────

  describe('safeGet / safeWrite', () => {
    it('returns null on Redis read failure', async () => {
      redis.get.mockRejectedValue(new Error('connection lost'));
      const result = await service.getRules();
      expect(result).toBeNull();
    });

    it('does not throw on Redis write failure', async () => {
      redis.set.mockRejectedValue(new Error('connection lost'));
      await expect(service.setRules([{ id: 'r1' }])).resolves.toBeUndefined();
    });
  });
});
