import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { GameSessionStatus } from '@prisma/client';

@Injectable()
export class GameAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async trackEvent(eventType: 'start' | 'complete' | 'fail' | 'abandon' | 'fraud' | 'reward', gameId: string) {
    const redisClient = this.redis.getClient();
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Increment global counters
    await redisClient.hincrby(`game:analytics:global:${gameId}`, eventType, 1);
    // Increment daily counters
    await redisClient.hincrby(`game:analytics:daily:${gameId}:${dateStr}`, eventType, 1);
  }

  async getGameStats(gameId: string) {
    // 1. Fetch from Redis first
    const redisClient = this.redis.getClient();
    const globalData = await redisClient.hgetall(`game:analytics:global:${gameId}`);

    if (Object.keys(globalData).length > 0) {
      const starts = parseInt(globalData.start || '0', 10);
      const completes = parseInt(globalData.complete || '0', 10);
      const fails = parseInt(globalData.fail || '0', 10);
      const abandons = parseInt(globalData.abandon || '0', 10);
      const frauds = parseInt(globalData.fraud || '0', 10);
      const rewards = parseInt(globalData.reward || '0', 10);

      const totalEnded = completes + fails + abandons;
      const completionRate = starts > 0 ? (completes / starts) * 100 : 0;

      return {
        sessionsStarted: starts,
        sessionsCompleted: completes,
        sessionsFailed: fails,
        sessionsAbandoned: abandons,
        fraudAttempts: frauds,
        rewardsDistributed: rewards,
        completionRate: parseFloat(completionRate.toFixed(2)),
      };
    }

    // 2. Fallback to DB aggregations
    const sessions = await this.prisma.gameSession.groupBy({
      by: ['status'],
      where: { gameId },
      _count: { id: true },
    });

    const counts = {
      CREATED: 0,
      STARTED: 0,
      PLAYING: 0,
      COMPLETED: 0,
      FAILED: 0,
      EXPIRED: 0,
      ABANDONED: 0,
      REWARDED: 0,
    };

    for (const group of sessions) {
      if (group.status in counts) {
        counts[group.status as keyof typeof counts] = group._count.id;
      }
    }

    const started = counts.CREATED + counts.STARTED + counts.PLAYING + counts.COMPLETED + counts.FAILED + counts.EXPIRED + counts.ABANDONED + counts.REWARDED;
    const completed = counts.COMPLETED + counts.REWARDED;
    const failed = counts.FAILED;
    const abandoned = counts.ABANDONED + counts.EXPIRED;
    const completionRate = started > 0 ? (completed / started) * 100 : 0;

    // Average play time
    const completedSessions = await this.prisma.gameSession.findMany({
      where: {
        gameId,
        status: { in: [GameSessionStatus.COMPLETED, GameSessionStatus.REWARDED] },
        startedAt: { not: null },
        endedAt: { not: null },
      },
      select: { startedAt: true, endedAt: true },
      take: 1000, // sample size
    });

    let totalDurationMs = 0;
    completedSessions.forEach((s) => {
      if (s.startedAt && s.endedAt) {
        totalDurationMs += s.endedAt.getTime() - s.startedAt.getTime();
      }
    });

    const averageSessionTimeSeconds = completedSessions.length > 0
      ? Math.round(totalDurationMs / completedSessions.length / 1000)
      : 0;

    return {
      sessionsStarted: started,
      sessionsCompleted: completed,
      sessionsFailed: failed,
      sessionsAbandoned: abandoned,
      completionRate: parseFloat(completionRate.toFixed(2)),
      averageSessionTimeSeconds,
    };
  }

  async getLeaderboard(gameId: string, limit = 10) {
    const topSessions = await this.prisma.gameSession.findMany({
      where: {
        gameId,
        status: { in: [GameSessionStatus.COMPLETED, GameSessionStatus.REWARDED] },
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return topSessions.map((session, index) => ({
      rank: index + 1,
      userId: session.userId,
      fullName: session.user.fullName,
      avatarUrl: session.user.avatarUrl,
      score: session.score,
      playedAt: session.endedAt || session.createdAt,
    }));
  }
}
