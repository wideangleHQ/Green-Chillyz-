import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoinCooldownService } from '../services/coin-cooldown.service';
import { CoinUsageRepository } from '../repositories/coin-usage.repository';
import { CoinEconomyCacheService } from '../cache/coin-economy-cache.service';

describe('CoinCooldownService', () => {
  let service: CoinCooldownService;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let usageRepo: Record<string, ReturnType<typeof vi.fn>>;
  const now = new Date('2026-08-05T10:00:00Z');

  beforeEach(() => {
    cache = {
      getCooldownTtl: vi.fn().mockResolvedValue(0),
      setCooldown: vi.fn().mockResolvedValue(undefined),
      clearCooldown: vi.fn().mockResolvedValue(undefined),
    };

    usageRepo = {
      findLastGrantAt: vi.fn().mockResolvedValue(null),
    };

    service = new CoinCooldownService(
      cache as unknown as CoinEconomyCacheService,
      usageRepo as unknown as CoinUsageRepository,
    );
  });

  describe('check', () => {
    it('returns inactive when cooldownSeconds is zero', async () => {
      const result = await service.check('u1', 'rule-1', 0, now);
      expect(result.active).toBe(false);
      expect(result.secondsRemaining).toBe(0);
    });

    it('returns inactive when cooldownSeconds is negative', async () => {
      const result = await service.check('u1', 'rule-1', -1, now);
      expect(result.active).toBe(false);
    });

    it('returns active from Redis TTL', async () => {
      cache.getCooldownTtl.mockResolvedValue(120);
      const result = await service.check('u1', 'rule-1', 300, now);
      expect(result.active).toBe(true);
      expect(result.secondsRemaining).toBe(120);
      expect(result.availableAt).toEqual(new Date(now.getTime() + 120 * 1000));
    });

    it('falls back to wallet timestamp when Redis has no TTL', async () => {
      const grantedAt = new Date(now.getTime() - 200 * 1000);
      usageRepo.findLastGrantAt.mockResolvedValue(grantedAt);

      const result = await service.check('u1', 'rule-1', 300, now);
      expect(result.active).toBe(true);
      expect(result.secondsRemaining).toBe(100);
    });

    it('repopulates Redis when falling back to DB', async () => {
      const grantedAt = new Date(now.getTime() - 200 * 1000);
      usageRepo.findLastGrantAt.mockResolvedValue(grantedAt);

      await service.check('u1', 'rule-1', 300, now);
      expect(cache.setCooldown).toHaveBeenCalledWith(
        'u1',
        'rule-1',
        100,
        expect.any(String),
      );
    });

    it('returns inactive when cooldown has elapsed in DB', async () => {
      const grantedAt = new Date(now.getTime() - 400 * 1000);
      usageRepo.findLastGrantAt.mockResolvedValue(grantedAt);

      const result = await service.check('u1', 'rule-1', 300, now);
      expect(result.active).toBe(false);
    });

    it('returns inactive when no grant exists in DB', async () => {
      const result = await service.check('u1', 'rule-1', 300, now);
      expect(result.active).toBe(false);
    });
  });

  describe('start', () => {
    it('writes a cooldown to Redis', async () => {
      await service.start('u1', 'rule-1', 300, now);
      expect(cache.setCooldown).toHaveBeenCalledWith(
        'u1',
        'rule-1',
        300,
        expect.any(String),
      );
    });

    it('skips when cooldownSeconds is zero', async () => {
      await service.start('u1', 'rule-1', 0, now);
      expect(cache.setCooldown).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('deletes the cooldown key', async () => {
      await service.clear('u1', 'rule-1');
      expect(cache.clearCooldown).toHaveBeenCalledWith('u1', 'rule-1');
    });
  });
});
