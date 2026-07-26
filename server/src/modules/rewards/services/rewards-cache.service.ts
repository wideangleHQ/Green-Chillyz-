import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARDS_CACHE } from '../constants';

@Injectable()
export class RewardsCacheService {
  constructor(private readonly redis: RedisService) {}

  /** Query objects vary widely; hash them into a compact stable key. */
  buildCatalogKey(query: Record<string, unknown>): string {
    const normalized = Object.keys(query)
      .filter((k) => query[k] !== undefined && query[k] !== null)
      .sort()
      .map((k) => `${k}=${String(query[k])}`)
      .join('&');
    const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 16);
    return `${REWARDS_CACHE.CATALOG}${hash}`;
  }

  async getCatalog<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  async setCatalog(key: string, data: unknown): Promise<void> {
    await this.redis.set(key, data, REWARDS_CACHE.TTL_CATALOG);
  }

  async getDetail<T>(idOrSlug: string): Promise<T | null> {
    return this.redis.get<T>(`${REWARDS_CACHE.DETAIL}${idOrSlug}`);
  }

  async setDetail(idOrSlug: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${REWARDS_CACHE.DETAIL}${idOrSlug}`,
      data,
      REWARDS_CACHE.TTL_DETAIL,
    );
  }

  async getCategories<T>(): Promise<T | null> {
    return this.redis.get<T>(REWARDS_CACHE.CATEGORIES);
  }

  async setCategories(data: unknown): Promise<void> {
    await this.redis.set(
      REWARDS_CACHE.CATEGORIES,
      data,
      REWARDS_CACHE.TTL_CATEGORIES,
    );
  }

  async getFeatured<T>(): Promise<T | null> {
    return this.redis.get<T>(REWARDS_CACHE.FEATURED);
  }

  async setFeatured(data: unknown): Promise<void> {
    await this.redis.set(REWARDS_CACHE.FEATURED, data, REWARDS_CACHE.TTL_FEATURED);
  }

  async getPopular<T>(): Promise<T | null> {
    return this.redis.get<T>(REWARDS_CACHE.POPULAR);
  }

  async setPopular(data: unknown): Promise<void> {
    await this.redis.set(REWARDS_CACHE.POPULAR, data, REWARDS_CACHE.TTL_POPULAR);
  }

  async getDailyRedemptionCount(rewardId: string): Promise<number> {
    const count = await this.redis.get<number>(this.dailyKey(rewardId));
    return count ?? 0;
  }

  async incrementDailyRedemptionCount(rewardId: string): Promise<void> {
    const key = this.dailyKey(rewardId);
    const client = this.redis.getClient();
    await client.incr(key);
    const ttl = await client.ttl(key);
    if (ttl < 0) {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      await client.expire(key, Math.ceil((endOfDay.getTime() - now.getTime()) / 1000));
    }
  }

  /**
   * Invalidate every listing surface plus the specific reward.
   * Called on create, update, publish, delete and inventory change.
   */
  async invalidateReward(rewardId: string, slug?: string): Promise<void> {
    await this.redis.del(`${REWARDS_CACHE.DETAIL}${rewardId}`);
    if (slug) {
      await this.redis.del(`${REWARDS_CACHE.DETAIL}${slug}`);
    }
    await this.invalidateListings();
  }

  async invalidateListings(): Promise<void> {
    await this.redis.delPattern(`${REWARDS_CACHE.CATALOG}*`);
    await this.redis.del(REWARDS_CACHE.FEATURED);
    await this.redis.del(REWARDS_CACHE.POPULAR);
  }

  async invalidateCategories(): Promise<void> {
    await this.redis.del(REWARDS_CACHE.CATEGORIES);
    await this.invalidateListings();
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${REWARDS_CACHE.PREFIX}*`);
  }

  private dailyKey(rewardId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `${REWARDS_CACHE.DAILY_COUNT}${rewardId}:${today}`;
  }
}
