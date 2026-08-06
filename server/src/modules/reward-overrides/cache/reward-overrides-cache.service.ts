import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_OVERRIDE_CACHE } from '../constants';

@Injectable()
export class RewardOverridesCacheService {
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

  async getStoreOverrides<T>(storeId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_OVERRIDE_CACHE.STORE}${storeId}`),
    );
  }

  async setStoreOverrides(storeId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_OVERRIDE_CACHE.STORE}${storeId}`,
        data,
        REWARD_OVERRIDE_CACHE.TTL_STORE,
      ),
    );
  }

  async getItem<T>(id: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_OVERRIDE_CACHE.ITEM}${id}`),
    );
  }

  async setItem(id: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_OVERRIDE_CACHE.ITEM}${id}`,
        data,
        REWARD_OVERRIDE_CACHE.TTL_ITEM,
      ),
    );
  }

  async getPreview<T>(storeId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_OVERRIDE_CACHE.PREVIEW}${storeId}`),
    );
  }

  async setPreview(storeId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_OVERRIDE_CACHE.PREVIEW}${storeId}`,
        data,
        REWARD_OVERRIDE_CACHE.TTL_PREVIEW,
      ),
    );
  }

  async invalidateOverride(id: string, storeId: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${REWARD_OVERRIDE_CACHE.ITEM}${id}`);
      await this.redis.del(`${REWARD_OVERRIDE_CACHE.STORE}${storeId}`);
      await this.redis.del(`${REWARD_OVERRIDE_CACHE.PREVIEW}${storeId}`);
    });
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${REWARD_OVERRIDE_CACHE.PREFIX}*`),
    );
  }
}
