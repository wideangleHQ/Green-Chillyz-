import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameSessionService } from './game-session.service';
import { PrismaService } from '../../../database/prisma.service';
import { GameCacheService } from './game-cache.service';
import { EligibilityService } from './eligibility.service';
import { CooldownService } from './cooldown.service';
import { AntiFraudService } from './anti-fraud.service';
import { GameAnalyticsService } from './game-analytics.service';
import { GameRegistry } from '../registry/game.registry';
import { RewardEngineService } from '../../reward/services/reward-engine.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { GameSessionStatus, RewardEventType, RewardSourceType } from '@prisma/client';

describe('GameSessionService', () => {
  let service: GameSessionService;
  let prisma: any;
  let cache: any;
  let eligibilityService: any;
  let cooldownService: any;
  let antiFraudService: any;
  let analyticsService: any;
  let registry: any;
  let rewardEngine: any;
  let walletService: any;

  beforeEach(() => {
    prisma = {
      game: { findUnique: vi.fn() },
      gameSession: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      user: { findFirst: vi.fn() },
      rewardCampaign: { findUnique: vi.fn() },
    };
    cache = {
      incrementDailyCount: vi.fn(),
      getDailyCount: vi.fn(),
    };
    eligibilityService = {
      checkEligibility: vi.fn(),
    };
    cooldownService = {
      checkCooldown: vi.fn(),
      startCooldown: vi.fn(),
    };
    antiFraudService = {
      acquireSessionLock: vi.fn(),
      releaseSessionLock: vi.fn(),
      validateSessionTransition: vi.fn(),
    };
    analyticsService = {
      trackEvent: vi.fn(),
    };
    registry = {
      get: vi.fn(),
    };
    rewardEngine = {
      evaluateReward: vi.fn(),
    };
    walletService = {
      credit: vi.fn(),
    };

    service = new GameSessionService(
      prisma as unknown as PrismaService,
      cache as unknown as GameCacheService,
      eligibilityService as unknown as EligibilityService,
      cooldownService as unknown as CooldownService,
      antiFraudService as unknown as AntiFraudService,
      analyticsService as unknown as GameAnalyticsService,
      registry as unknown as GameRegistry,
      rewardEngine as unknown as RewardEngineService,
      walletService as unknown as WalletService,
    );
  });

  describe('startSession', () => {
    it('should throw if game is not found', async () => {
      prisma.game.findUnique.mockResolvedValue(null);
      await expect(
        service.startSession('user-1', { gameSlug: 'unknown' }, { ip: '', device: '', browser: '' }),
      ).rejects.toThrow();
    });

    it('should throw if user is not eligible', async () => {
      const mockGame = { id: 'g1', slug: 'game-1' };
      prisma.game.findUnique.mockResolvedValue(mockGame);
      eligibilityService.checkEligibility.mockResolvedValue({ eligible: false, reason: 'Cooldown active' });

      await expect(
        service.startSession('user-1', { gameSlug: 'game-1' }, { ip: '', device: '', browser: '' }),
      ).rejects.toThrow('Cooldown active');
    });

    it('should create session and return it when eligible', async () => {
      const mockGame = { id: 'g1', slug: 'game-1', cooldown: 0 };
      prisma.game.findUnique.mockResolvedValue(mockGame);
      eligibilityService.checkEligibility.mockResolvedValue({ eligible: true });
      
      const mockSession = { id: 's1', userId: 'user-1', gameId: 'g1', status: GameSessionStatus.STARTED };
      prisma.gameSession.create.mockResolvedValue(mockSession);

      const result = await service.startSession(
        'user-1',
        { gameSlug: 'game-1' },
        { ip: '127.0.0.1', device: 'agent', browser: 'Chrome' },
      );

      expect(prisma.gameSession.create).toHaveBeenCalled();
      expect(cache.incrementDailyCount).toHaveBeenCalledWith('user-1', 'g1');
      expect(analyticsService.trackEvent).toHaveBeenCalledWith('start', 'g1');
      expect(result).toEqual(mockSession);
    });
  });

  describe('endSession', () => {
    it('should throw if lock not acquired', async () => {
      antiFraudService.acquireSessionLock.mockResolvedValue(false);
      await expect(
        service.endSession('user-1', { sessionId: 's1', clientData: {} }, { ip: '', device: '', browser: '' }),
      ).rejects.toThrow(/Anti-fraud system flagged this request/);
    });

    it('should update status to FAILED if validateEnd returns invalid', async () => {
      antiFraudService.acquireSessionLock.mockResolvedValue(true);
      const mockGame = { id: 'g1', slug: 'game-1', cooldown: 0 };
      const mockSession = { id: 's1', userId: 'user-1', gameId: 'g1', game: mockGame, status: GameSessionStatus.STARTED, createdAt: new Date() };
      prisma.gameSession.findUnique.mockResolvedValue(mockSession);
      
      const mockHandler = {
        validateEnd: vi.fn().mockResolvedValue({ isValid: false, score: 0, reason: 'Cheated' }),
      };
      registry.get.mockReturnValue(mockHandler);

      const failedSession = { id: 's1', status: GameSessionStatus.FAILED };
      prisma.gameSession.update.mockResolvedValue(failedSession);

      const result = await service.endSession(
        'user-1',
        { sessionId: 's1', clientData: {} },
        { ip: '', device: '', browser: '' },
      );

      expect(prisma.gameSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({ status: GameSessionStatus.FAILED }),
        }),
      );
      expect(result.session).toEqual(failedSession);
      expect(result.rewardDecision.rewardGranted).toBe(false);
    });

    it('should process rewards and credit wallet if valid and rewarded', async () => {
      antiFraudService.acquireSessionLock.mockResolvedValue(true);
      const mockGame = { id: 'g1', slug: 'game-1', cooldown: 60 };
      const mockSession = { id: 's1', userId: 'user-1', gameId: 'g1', game: mockGame, status: GameSessionStatus.STARTED, createdAt: new Date() };
      prisma.gameSession.findUnique.mockResolvedValue(mockSession);
      
      const mockHandler = {
        validateEnd: vi.fn().mockResolvedValue({
          isValid: true,
          score: 10,
          rewardEvent: { eventType: RewardEventType.GAME_COMPLETED, source: RewardSourceType.GAME, storeId: 'store-1' },
        }),
      };
      registry.get.mockReturnValue(mockHandler);

      rewardEngine.evaluateReward.mockResolvedValue({
        rewardGranted: true,
        totalCoins: 100,
        walletSource: 'GAME_REWARD',
        reason: 'Won spin',
        expiresAt: null,
      });

      walletService.credit.mockResolvedValue({ newBalance: 500 });
      
      const rewardedSession = { id: 's1', status: GameSessionStatus.REWARDED };
      prisma.gameSession.update.mockResolvedValue(rewardedSession);

      const result = await service.endSession(
        'user-1',
        { sessionId: 's1', clientData: {} },
        { ip: '127.0.0.1', device: 'agent', browser: 'Chrome' },
      );

      expect(walletService.credit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          amount: 100,
          referenceId: 's1',
        }),
        undefined,
        '127.0.0.1',
        'agent',
      );
      expect(cooldownService.startCooldown).toHaveBeenCalledWith('user-1', 'g1', 60);
      expect(result.session).toEqual(rewardedSession);
      expect(result.rewardDecision.rewardGranted).toBe(true);
    });
  });
});
