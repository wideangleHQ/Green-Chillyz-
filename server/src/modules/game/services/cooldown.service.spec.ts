import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CooldownService } from './cooldown.service';
import { PrismaService } from '../../../database/prisma.service';
import { GameCacheService } from './game-cache.service';

describe('CooldownService', () => {
  let service: CooldownService;
  let prisma: any;
  let cache: any;

  beforeEach(() => {
    prisma = {
      gameSession: { findFirst: vi.fn() },
      game: { findUnique: vi.fn() },
    };
    cache = {
      getCooldownExpiry: vi.fn(),
      setCooldownExpiry: vi.fn(),
    };

    service = new CooldownService(
      prisma as unknown as PrismaService,
      cache as unknown as GameCacheService,
    );
  });

  describe('checkCooldown', () => {
    it('should return inCooldown true if cached expiry is in the future', async () => {
      const future = Date.now() + 5000;
      cache.getCooldownExpiry.mockResolvedValue(future);

      const result = await service.checkCooldown('user-1', 'game-1');

      expect(result.inCooldown).toBe(true);
      expect(result.remainingMs).toBeGreaterThan(0);
    });

    it('should return inCooldown false if no sessions found in DB', async () => {
      cache.getCooldownExpiry.mockResolvedValue(null);
      prisma.gameSession.findFirst.mockResolvedValue(null);

      const result = await service.checkCooldown('user-1', 'game-1');

      expect(result.inCooldown).toBe(false);
      expect(result.remainingMs).toBe(0);
    });

    it('should check DB and cache result if inside cooldown window', async () => {
      cache.getCooldownExpiry.mockResolvedValue(null);
      
      const lastSessionEnded = new Date(Date.now() - 10000); // 10s ago
      prisma.gameSession.findFirst.mockResolvedValue({ endedAt: lastSessionEnded });
      prisma.game.findUnique.mockResolvedValue({ cooldown: 30 }); // 30s cooldown

      const result = await service.checkCooldown('user-1', 'game-1');

      expect(result.inCooldown).toBe(true);
      expect(cache.setCooldownExpiry).toHaveBeenCalled();
    });

    it('should return inCooldown false if cooldown window has expired', async () => {
      cache.getCooldownExpiry.mockResolvedValue(null);
      
      const lastSessionEnded = new Date(Date.now() - 40000); // 40s ago
      prisma.gameSession.findFirst.mockResolvedValue({ endedAt: lastSessionEnded });
      prisma.game.findUnique.mockResolvedValue({ cooldown: 30 }); // 30s cooldown

      const result = await service.checkCooldown('user-1', 'game-1');

      expect(result.inCooldown).toBe(false);
    });
  });
});
