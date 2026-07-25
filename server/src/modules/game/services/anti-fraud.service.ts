import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { PrismaService } from '../../../database/prisma.service';
import { GameSession, GameSessionStatus } from '@prisma/client';
import { GAME_ERRORS } from '../constants/game.constants';

@Injectable()
export class AntiFraudService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async acquireSessionLock(sessionId: string, ttlSeconds = 5): Promise<boolean> {
    const redisKey = `lock:game_session:${sessionId}`;
    const client = this.redis.getClient();
    const result = await client.set(redisKey, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseSessionLock(sessionId: string): Promise<void> {
    const redisKey = `lock:game_session:${sessionId}`;
    await this.redis.del(redisKey);
  }

  async checkConcurrency(userId: string): Promise<void> {
    const activeSession = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        status: { in: [GameSessionStatus.CREATED, GameSessionStatus.STARTED, GameSessionStatus.PLAYING] },
      },
      select: { id: true, gameId: true },
    });

    if (activeSession) {
      throw new BadRequestException(GAME_ERRORS.CONCURRENT_SESSION);
    }
  }

  validateSessionTransition(session: GameSession, allowedStatuses: GameSessionStatus[]) {
    if (!allowedStatuses.includes(session.status)) {
      throw new BadRequestException(GAME_ERRORS.SESSION_NOT_ACTIVE);
    }
    
    // session expiration (e.g., 10 minutes session length limit)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (session.createdAt < tenMinutesAgo) {
      throw new BadRequestException(GAME_ERRORS.SESSION_EXPIRED);
    }
  }
}
