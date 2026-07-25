import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { WALLET_CACHE } from '../constants';

@Injectable()
export class WalletCacheService {
  constructor(private readonly redis: RedisService) {}

  async getSummary<T>(userId: string): Promise<T | null> {
    return this.redis.get<T>(`${WALLET_CACHE.SUMMARY}${userId}`);
  }

  async setSummary(userId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${WALLET_CACHE.SUMMARY}${userId}`,
      data,
      WALLET_CACHE.TTL,
    );
  }

  async getBalance<T>(userId: string): Promise<T | null> {
    return this.redis.get<T>(`${WALLET_CACHE.BALANCE}${userId}`);
  }

  async setBalance(userId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${WALLET_CACHE.BALANCE}${userId}`,
      data,
      WALLET_CACHE.TTL,
    );
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(`${WALLET_CACHE.SUMMARY}${userId}`);
    await this.redis.del(`${WALLET_CACHE.BALANCE}${userId}`);
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${WALLET_CACHE.PREFIX}*`);
  }
}
