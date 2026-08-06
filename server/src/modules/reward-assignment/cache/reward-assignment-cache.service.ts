import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_ASSIGNMENT_CACHE } from '../constants';

@Injectable()
export class RewardAssignmentCacheService {
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
    } catch {}
  }

  async getStoreAssignment<T>(storeId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_ASSIGNMENT_CACHE.STORE}${storeId}`),
    );
  }

  async setStoreAssignment(storeId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_ASSIGNMENT_CACHE.STORE}${storeId}`,
        data,
        REWARD_ASSIGNMENT_CACHE.TTL_STORE,
      ),
    );
  }

  async getStoreProfile<T>(storeId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_ASSIGNMENT_CACHE.PROFILE_STORE}${storeId}`),
    );
  }

  async setStoreProfile(storeId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_ASSIGNMENT_CACHE.PROFILE_STORE}${storeId}`,
        data,
        REWARD_ASSIGNMENT_CACHE.TTL_STORE,
      ),
    );
  }

  async getItem<T>(id: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_ASSIGNMENT_CACHE.ITEM}${id}`),
    );
  }

  async setItem(id: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_ASSIGNMENT_CACHE.ITEM}${id}`,
        data,
        REWARD_ASSIGNMENT_CACHE.TTL_ITEM,
      ),
    );
  }

  async invalidateAssignment(id: string, storeId: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${REWARD_ASSIGNMENT_CACHE.ITEM}${id}`);
      await this.redis.del(`${REWARD_ASSIGNMENT_CACHE.STORE}${storeId}`);
      await this.redis.del(`${REWARD_ASSIGNMENT_CACHE.PROFILE_STORE}${storeId}`);
    });
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${REWARD_ASSIGNMENT_CACHE.PREFIX}*`),
    );
  }
}
