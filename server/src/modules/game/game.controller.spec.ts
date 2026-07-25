import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameController } from './game.controller';
import { GameConfigurationService } from './services/game-configuration.service';
import { GameSessionService } from './services/game-session.service';
import { GameAnalyticsService } from './services/game-analytics.service';
import { GameSessionStatus } from '@prisma/client';

const mockUser = {
  sub: 'user-uuid-123',
  email: 'user@test.com',
  roles: [],
  permissions: [],
};

const mockReq = {
  ip: '192.168.1.1',
  headers: { 'user-agent': 'Chrome/100.0.0.0' },
} as any;

describe('GameController', () => {
  let controller: GameController;
  let gameConfigService: Record<string, ReturnType<typeof vi.fn>>;
  let gameSessionService: Record<string, ReturnType<typeof vi.fn>>;
  let gameAnalyticsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    gameConfigService = {
      create: vi.fn(),
      update: vi.fn(),
      findAll: vi.fn(),
      findByIdOrSlug: vi.fn(),
      delete: vi.fn(),
    };
    gameSessionService = {
      startSession: vi.fn(),
      endSession: vi.fn(),
      listSessions: vi.fn(),
      getSession: vi.fn(),
    };
    gameAnalyticsService = {
      getGameStats: vi.fn(),
      getLeaderboard: vi.fn(),
    };

    controller = new GameController(
      gameConfigService as unknown as GameConfigurationService,
      gameSessionService as unknown as GameSessionService,
      gameAnalyticsService as unknown as GameAnalyticsService,
    );
  });

  describe('startSession', () => {
    it('should start game session with request details', async () => {
      const session = { id: 'session-123', status: GameSessionStatus.STARTED };
      gameSessionService.startSession.mockResolvedValue(session);

      const dto = { gameSlug: 'spin-wheel', clientData: { initial: true } };
      const result = await controller.startSession(dto, mockUser as any, mockReq);

      expect(gameSessionService.startSession).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
        {
          ip: '192.168.1.1',
          device: 'Chrome/100.0.0.0',
          browser: 'Chrome',
        },
      );
      expect(result).toEqual(session);
    });
  });

  describe('endSession', () => {
    it('should end session and return reward decision', async () => {
      const outcome = {
        session: { id: 'session-123', status: GameSessionStatus.REWARDED },
        rewardDecision: { rewardGranted: true, totalCoins: 50 },
      };
      gameSessionService.endSession.mockResolvedValue(outcome);

      const dto = { sessionId: 'session-123', clientData: { sliceId: 'slice_1' } };
      const result = await controller.endSession(dto, mockUser as any, mockReq);

      expect(gameSessionService.endSession).toHaveBeenCalledWith(
        mockUser.sub,
        dto,
        {
          ip: '192.168.1.1',
          device: 'Chrome/100.0.0.0',
          browser: 'Chrome',
        },
      );
      expect(result).toEqual(outcome);
    });
  });

  describe('listGames', () => {
    it('should delegate to gameConfigService.findAll', async () => {
      const paginatedResult = { items: [], total: 0, page: 1, pageSize: 10 };
      gameConfigService.findAll.mockResolvedValue(paginatedResult);

      const query = { page: 1, pageSize: 10 };
      const result = await controller.listGames(query as any);

      expect(gameConfigService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const mockLeaderboard = [{ rank: 1, score: 100 }];
      gameAnalyticsService.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await controller.getLeaderboard('game-id-123');

      expect(gameAnalyticsService.getLeaderboard).toHaveBeenCalledWith('game-id-123');
      expect(result).toEqual(mockLeaderboard);
    });
  });
});
