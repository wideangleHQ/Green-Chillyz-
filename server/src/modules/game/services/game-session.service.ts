import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { GameCacheService } from './game-cache.service';
import { EligibilityService } from './eligibility.service';
import { CooldownService } from './cooldown.service';
import { AntiFraudService } from './anti-fraud.service';
import { GameAnalyticsService } from './game-analytics.service';
import { GameRegistry } from '../registry/game.registry';
import { RewardEngineService } from '../../reward/services/reward-engine.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { StartGameSessionDto, EndGameSessionDto, GameSessionQueryDto } from '../dto/game.dto';
import { GameSession, GameSessionStatus, RewardEventType, RewardSourceType, Prisma } from '@prisma/client';
import { GAME_ERRORS } from '../constants/game.constants';
import { PaginatedResponse } from '../../../common/interfaces';
import { paginate } from '../../../common/pagination/paginator';
import { NOTIFICATION_EVENTS } from '../../notification/constants';
import { GameCompletedEvent } from '../../notification/events';

@Injectable()
export class GameSessionService {
  private readonly logger = new Logger(GameSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: GameCacheService,
    private readonly eligibilityService: EligibilityService,
    private readonly cooldownService: CooldownService,
    private readonly antiFraudService: AntiFraudService,
    private readonly analyticsService: GameAnalyticsService,
    private readonly registry: GameRegistry,
    private readonly rewardEngine: RewardEngineService,
    private readonly walletService: WalletService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startSession(
    userId: string,
    dto: StartGameSessionDto,
    reqDetails: { ip: string; device: string; browser: string },
  ): Promise<GameSession> {
    const game = await this.prisma.game.findUnique({
      where: { slug: dto.gameSlug },
    });

    if (!game) {
      throw new NotFoundException(GAME_ERRORS.GAME_NOT_FOUND);
    }

    // 1. Eligibility Check
    const eligibility = await this.eligibilityService.checkEligibility(userId, game);
    if (!eligibility.eligible) {
      throw new BadRequestException(eligibility.reason);
    }

    // 2. Game-specific Start Validation (optional)
    const handler = this.registry.get(dto.gameSlug);
    if (handler) {
      await handler.validateStart(userId, game, dto.clientData);
    }

    // 3. Create Immutable Session
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        gameId: game.id,
        status: GameSessionStatus.STARTED, // transition straight to STARTED
        startedAt: new Date(),
        device: reqDetails.device,
        browser: reqDetails.browser,
        ipAddress: reqDetails.ip,
        metadata: dto.clientData ? (dto.clientData as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    // 4. Increment Daily Count in Cache
    await this.cache.incrementDailyCount(userId, game.id);

    // 5. Track Analytics
    await this.analyticsService.trackEvent('start', game.id);

    this.logger.log(`Started game session ${session.id} for user ${userId} on game ${game.slug}`);
    return session;
  }

  async endSession(
    userId: string,
    dto: EndGameSessionDto,
    reqDetails: { ip: string; device: string; browser: string },
  ): Promise<{ session: GameSession; rewardDecision: any }> {
    // 1. Acquire Lock to prevent Session Replay / Concurrent submissions
    const lockAcquired = await this.antiFraudService.acquireSessionLock(dto.sessionId);
    if (!lockAcquired) {
      throw new BadRequestException(GAME_ERRORS.FRAUD_DETECTED + ': Duplicate request');
    }

    try {
      const session = await this.prisma.gameSession.findUnique({
        where: { id: dto.sessionId },
        include: { game: true },
      });

      if (!session) {
        throw new NotFoundException(GAME_ERRORS.SESSION_NOT_FOUND);
      }

      // 2. Validate Session Ownership
      if (session.userId !== userId) {
        throw new ForbiddenException('You do not own this game session');
      }

      // 3. Validate Session State Transitions & Expiration
      this.antiFraudService.validateSessionTransition(session, [
        GameSessionStatus.CREATED,
        GameSessionStatus.STARTED,
        GameSessionStatus.PLAYING,
      ]);

      const handler = this.registry.get(session.game.slug);
      if (!handler) {
        throw new BadRequestException('No handler registered for game: ' + session.game.slug);
      }

      // 4. Server Validation of the outcome (executing game handler)
      const validationResult = await handler.validateEnd(userId, session, dto.clientData);

      if (!validationResult.isValid) {
        const failedSession = await this.prisma.gameSession.update({
          where: { id: session.id },
          data: {
            status: GameSessionStatus.FAILED,
            endedAt: new Date(),
            score: validationResult.score,
            metadata: {
              ...((session.metadata as Record<string, any>) || {}),
              failureReason: validationResult.reason,
            },
          },
        });

        await this.analyticsService.trackEvent('fail', session.gameId);
        return { session: failedSession, rewardDecision: { rewardGranted: false, reason: validationResult.reason } };
      }

      // 5. Evaluate rewards using the Reward Engine
      let rewardDecision: any = { rewardGranted: false, reason: 'No reward evaluation event details provided' };
      let finalStatus: GameSessionStatus = GameSessionStatus.COMPLETED;

      if (validationResult.rewardEvent) {
        const rewardEvent = {
          eventType: validationResult.rewardEvent.eventType || RewardEventType.GAME_COMPLETED,
          userId,
          source: validationResult.rewardEvent.source || RewardSourceType.GAME,
          referenceId: session.id,
          referenceType: 'game_session',
          storeId: validationResult.rewardEvent.storeId,
          brandId: validationResult.rewardEvent.brandId,
          purchaseAmount: validationResult.rewardEvent.purchaseAmount,
          metadata: {
            ...validationResult.rewardEvent.metadata,
            gameId: session.gameId,
            gameSlug: session.game.slug,
          },
          ip: reqDetails.ip,
          device: reqDetails.device,
        };

        const decision = await this.rewardEngine.evaluateReward(rewardEvent);
        rewardDecision = decision;

        // 6. Credit Wallet if reward granted
        if (decision.rewardGranted && decision.totalCoins > 0) {
          const creditResult = await this.walletService.credit(
            {
              userId,
              amount: decision.totalCoins,
              source: decision.walletSource,
              description: decision.reason,
              referenceId: session.id,
              referenceType: 'game_session',
              idempotencyKey: `game_reward:${session.id}`,
              expiresAt: decision.expiresAt ? decision.expiresAt.toISOString() : undefined,
              metadata: decision.metadata,
            },
            undefined, // no initiator user id (system credited)
            reqDetails.ip,
            reqDetails.device,
          );

          finalStatus = GameSessionStatus.REWARDED;
          this.logger.log(
            `Credited user ${userId} with ${decision.totalCoins} coins. New balance: ${creditResult.newBalance}`,
          );

          // Richer than the generic wallet event; the notification listener
          // suppresses the wallet message for GAME_REWARD so only one fires.
          this.eventEmitter.emit(
            NOTIFICATION_EVENTS.GAME_COMPLETED,
            new GameCompletedEvent(
              userId,
              session.gameId,
              session.game.name,
              decision.totalCoins,
              session.id,
            ),
          );
        }
      }

      // 7. Start Game Cooldown Period
      if (session.game.cooldown > 0) {
        await this.cooldownService.startCooldown(userId, session.gameId, session.game.cooldown);
      }

      // 8. Update Session in DB (Immutable session finalization)
      const finalizedSession = await this.prisma.gameSession.update({
        where: { id: session.id },
        data: {
          status: finalStatus,
          endedAt: new Date(),
          score: validationResult.score,
          rewardDecision: rewardDecision ? (rewardDecision as Prisma.InputJsonValue) : Prisma.JsonNull,
          metadata: {
            ...((session.metadata as Record<string, any>) || {}),
            clientData: dto.clientData,
          },
        },
      });

      // 9. Track Analytics
      await this.analyticsService.trackEvent(
        finalStatus === GameSessionStatus.REWARDED ? 'reward' : 'complete',
        session.gameId,
      );

      return { session: finalizedSession, rewardDecision };
    } finally {
      // 10. Clean up Redis Lock
      await this.antiFraudService.releaseSessionLock(dto.sessionId);
    }
  }

  async getSession(sessionId: string): Promise<GameSession> {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: true },
    });
    if (!session) {
      throw new NotFoundException(GAME_ERRORS.SESSION_NOT_FOUND);
    }
    return session;
  }

  async listSessions(query: GameSessionQueryDto): Promise<PaginatedResponse<GameSession>> {
    const where: Prisma.GameSessionWhereInput = {};
    if (query.gameId) where.gameId = query.gameId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status as GameSessionStatus;

    const [items, total] = await Promise.all([
      this.prisma.gameSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        include: { game: { select: { name: true, slug: true } } },
      }),
      this.prisma.gameSession.count({ where }),
    ]);

    return paginate(items, total, query.page, query.pageSize);
  }
}
