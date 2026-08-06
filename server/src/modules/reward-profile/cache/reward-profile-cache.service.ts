import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_PROFILE_CACHE } from '../constants';

@Injectable()
export class RewardProfileCacheService {
  constructor(private readonly redis: RedisService) {}

  private async safeGet<T>(fn: () => Promise<T | null>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private async safeWrite(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch {
      // Redis unavailable — skip silently
    }
  }

  async getList<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(REWARD_PROFILE_CACHE.LIST));
  }

  async setList(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(REWARD_PROFILE_CACHE.LIST, data, REWARD_PROFILE_CACHE.TTL_LIST),
    );
  }

  async getDefault<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(REWARD_PROFILE_CACHE.DEFAULT));
  }

  async setDefault(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(REWARD_PROFILE_CACHE.DEFAULT, data, REWARD_PROFILE_CACHE.TTL_DEFAULT),
    );
  }

  async getItem<T>(id: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_PROFILE_CACHE.ITEM}${id}`),
    );
  }

  async setItem(id: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(`${REWARD_PROFILE_CACHE.ITEM}${id}`, data, REWARD_PROFILE_CACHE.TTL_ITEM),
    );
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${REWARD_PROFILE_CACHE.PREFIX}*`),
    );
  }

  async invalidateProfile(id: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${REWARD_PROFILE_CACHE.ITEM}${id}`);
      await this.redis.del(REWARD_PROFILE_CACHE.LIST);
      await this.redis.del(REWARD_PROFILE_CACHE.DEFAULT);
    });
  }
}
