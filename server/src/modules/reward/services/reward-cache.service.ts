import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_CACHE } from '../constants';

@Injectable()
export class RewardCacheService {
  constructor(private readonly redis: RedisService) {}

  async getCampaign<T>(campaignId: string): Promise<T | null> {
    return this.redis.get<T>(`${REWARD_CACHE.CAMPAIGN}${campaignId}`);
  }

  async setCampaign(campaignId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${REWARD_CACHE.CAMPAIGN}${campaignId}`,
      data,
      REWARD_CACHE.TTL_CAMPAIGN,
    );
  }

  async getActiveCampaigns<T>(eventType: string): Promise<T | null> {
    return this.redis.get<T>(`${REWARD_CACHE.ACTIVE_CAMPAIGNS}${eventType}`);
  }

  async setActiveCampaigns(eventType: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${REWARD_CACHE.ACTIVE_CAMPAIGNS}${eventType}`,
      data,
      REWARD_CACHE.TTL_ACTIVE,
    );
  }

  async getRules<T>(campaignId: string): Promise<T | null> {
    return this.redis.get<T>(`${REWARD_CACHE.RULES}${campaignId}`);
  }

  async setRules(campaignId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${REWARD_CACHE.RULES}${campaignId}`,
      data,
      REWARD_CACHE.TTL_RULES,
    );
  }

  async getDailyCount(userId: string, eventType: string): Promise<number> {
    const key = `${REWARD_CACHE.DAILY_COUNT}${userId}:${eventType}`;
    const count = await this.redis.get<number>(key);
    return count ?? 0;
  }

  async incrementDailyCount(userId: string, eventType: string): Promise<void> {
    const key = `${REWARD_CACHE.DAILY_COUNT}${userId}:${eventType}`;
    const client = this.redis.getClient();
    await client.incr(key);
    const ttl = await client.ttl(key);
    if (ttl < 0) {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const secondsLeft = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);
      await client.expire(key, secondsLeft);
    }
  }

  async invalidateCampaign(campaignId: string): Promise<void> {
    await this.redis.del(`${REWARD_CACHE.CAMPAIGN}${campaignId}`);
    await this.redis.del(`${REWARD_CACHE.RULES}${campaignId}`);
    await this.redis.delPattern(`${REWARD_CACHE.ACTIVE_CAMPAIGNS}*`);
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${REWARD_CACHE.PREFIX}*`);
  }
}
