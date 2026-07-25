import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EligibilityService } from './eligibility.service';
import { PrismaService } from '../../../database/prisma.service';
import { GameCacheService } from './game-cache.service';
import { CooldownService } from './cooldown.service';

describe('EligibilityService', () => {
  let service: EligibilityService;
  let prisma: any;
  let cache: any;
  let cooldownService: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn() },
      gameSession: { findFirst: vi.fn() },
    };
    cache = {
      getDailyCount: vi.fn(),
    };
    cooldownService = {
      checkCooldown: vi.fn(),
    };

    service = new EligibilityService(
      prisma as unknown as PrismaService,
      cache as unknown as GameCacheService,
      cooldownService as unknown as CooldownService,
    );
  });

  describe('checkEligibility', () => {
    it('should return ineligible if game is inactive', async () => {
      const game = { isActive: false } as any;
      const result = await service.checkEligibility('u1', game);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('inactive');
    });

    it('should return ineligible if user or wallet is inactive', async () => {
      const game = { isActive: true } as any;
      prisma.user.findUnique.mockResolvedValue({
        isActive: true,
        wallet: { isActive: false },
      });

      const result = await service.checkEligibility('u1', game);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('wallet is inactive');
    });

    it('should return ineligible if cooldown is active', async () => {
      const game = { isActive: true, id: 'g1', minLevel: 0, storeEligibility: [] } as any;
      prisma.user.findUnique.mockResolvedValue({
        isActive: true,
        wallet: { isActive: true },
      });
      cooldownService.checkCooldown.mockResolvedValue({ inCooldown: true, remainingMs: 5000 });

      const result = await service.checkEligibility('u1', game);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('cooldown');
    });

    it('should return ineligible if daily limit exceeded', async () => {
      const game = { isActive: true, id: 'g1', minLevel: 0, storeEligibility: [], dailyLimit: 3 } as any;
      prisma.user.findUnique.mockResolvedValue({
        isActive: true,
        wallet: { isActive: true },
      });
      cooldownService.checkCooldown.mockResolvedValue({ inCooldown: false, remainingMs: 0 });
      cache.getDailyCount.mockResolvedValue(3);

      const result = await service.checkEligibility('u1', game);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('daily limit');
    });

    it('should return eligible if all checks pass', async () => {
      const game = { isActive: true, id: 'g1', minLevel: 0, storeEligibility: [], dailyLimit: 3 } as any;
      prisma.user.findUnique.mockResolvedValue({
        isActive: true,
        wallet: { isActive: true },
      });
      cooldownService.checkCooldown.mockResolvedValue({ inCooldown: false, remainingMs: 0 });
      cache.getDailyCount.mockResolvedValue(1);
      prisma.gameSession.findFirst.mockResolvedValue(null); // no active duplicate/concurrent sessions

      const result = await service.checkEligibility('u1', game);
      expect(result.eligible).toBe(true);
    });
  });
});
