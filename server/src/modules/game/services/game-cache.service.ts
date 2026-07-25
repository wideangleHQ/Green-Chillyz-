import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { GAME_CACHE } from '../constants/game.constants';
import { Game } from '@prisma/client';

@Injectable()
export class GameCacheService {
  private readonly logger = new Logger(GameCacheService.name);

  constructor(private readonly redis: RedisService) {}

  async getGameConfig(slug: string): Promise<Game | null> {
    return this.redis.get<Game>(`${GAME_CACHE.CONFIG}${slug}`);
  }

  async setGameConfig(slug: string, data: Game): Promise<void> {
    await this.redis.set(
      `${GAME_CACHE.CONFIG}${slug}`,
      data,
      GAME_CACHE.TTL_CONFIG,
    );
  }

  async invalidateGameConfig(slug: string): Promise<void> {
    await this.redis.del(`${GAME_CACHE.CONFIG}${slug}`);
  }

  async getCooldownExpiry(userId: string, gameId: string): Promise<number | null> {
    const key = `${GAME_CACHE.COOLDOWN}${userId}:${gameId}`;
    const val = await this.redis.get<string>(key);
    return val ? parseInt(val, 10) : null;
  }

  async setCooldownExpiry(userId: string, gameId: string, expiryTimestamp: number, durationSeconds: number): Promise<void> {
    const key = `${GAME_CACHE.COOLDOWN}${userId}:${gameId}`;
    await this.redis.set(key, expiryTimestamp.toString(), durationSeconds);
  }

  async getDailyCount(userId: string, gameId: string): Promise<number> {
    const dateStr = new Date().toISOString().split('T')[0];
    const key = `${GAME_CACHE.DAILY_COUNT}${userId}:${gameId}:${dateStr}`;
    const val = await this.redis.get<number>(key);
    return val ?? 0;
  }

  async incrementDailyCount(userId: string, gameId: string): Promise<void> {
    const dateStr = new Date().toISOString().split('T')[0];
    const key = `${GAME_CACHE.DAILY_COUNT}${userId}:${gameId}:${dateStr}`;
    const client = this.redis.getClient();
    await client.incr(key);
    const ttl = await client.ttl(key);
    if (ttl < 0) {
      // Set to expire at midnight plus some buffer
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const secondsLeft = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000) + 3600; // +1 hour buffer
      await client.expire(key, secondsLeft);
    }
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${GAME_CACHE.PREFIX}*`);
  }
}
