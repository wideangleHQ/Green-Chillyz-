import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_RESOLUTION_CACHE } from '../constants';

@Injectable()
export class RewardResolutionCacheService {
  private readonly logger = new Logger(RewardResolutionCacheService.name);
  private readonly prefix = REWARD_RESOLUTION_CACHE.PREFIX;

  constructor(private readonly redis: RedisService) {}

  private key(...parts: string[]): string {
    return `${this.prefix}:${parts.join(':')}`;
  }

  async safeGet<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      this.logger.warn(`Cache read failed: ${key}`);
      return null;
    }
  }

  async safeWrite(key: string, data: unknown, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), ttl);
    } catch {
      this.logger.warn(`Cache write failed: ${key}`);
    }
  }

  async getResolution<T>(customerId: string, storeId: string, hash: string): Promise<T | null> {
    return this.safeGet<T>(this.key(REWARD_RESOLUTION_CACHE.KEYS.RESOLVE, storeId, customerId, hash));
  }

  async setResolution(customerId: string, storeId: string, hash: string, data: unknown): Promise<void> {
    await this.safeWrite(
      this.key(REWARD_RESOLUTION_CACHE.KEYS.RESOLVE, storeId, customerId, hash),
      data,
      REWARD_RESOLUTION_CACHE.TTL.RESOLVE,
    );
  }

  async getPreview<T>(customerId: string, storeId: string, hash: string): Promise<T | null> {
    return this.safeGet<T>(this.key(REWARD_RESOLUTION_CACHE.KEYS.PREVIEW, storeId, customerId, hash));
  }

  async setPreview(customerId: string, storeId: string, hash: string, data: unknown): Promise<void> {
    await this.safeWrite(
      this.key(REWARD_RESOLUTION_CACHE.KEYS.PREVIEW, storeId, customerId, hash),
      data,
      REWARD_RESOLUTION_CACHE.TTL.PREVIEW,
    );
  }

  async getStoreContext<T>(storeId: string): Promise<T | null> {
    return this.safeGet<T>(this.key(REWARD_RESOLUTION_CACHE.KEYS.STORE_CONTEXT, storeId));
  }

  async setStoreContext(storeId: string, data: unknown): Promise<void> {
    await this.safeWrite(
      this.key(REWARD_RESOLUTION_CACHE.KEYS.STORE_CONTEXT, storeId),
      data,
      REWARD_RESOLUTION_CACHE.TTL.STORE_CONTEXT,
    );
  }

  async getCustomerSummary<T>(customerId: string, storeId: string): Promise<T | null> {
    return this.safeGet<T>(this.key(REWARD_RESOLUTION_CACHE.KEYS.CUSTOMER_SUMMARY, storeId, customerId));
  }

  async setCustomerSummary(customerId: string, storeId: string, data: unknown): Promise<void> {
    await this.safeWrite(
      this.key(REWARD_RESOLUTION_CACHE.KEYS.CUSTOMER_SUMMARY, storeId, customerId),
      data,
      REWARD_RESOLUTION_CACHE.TTL.CUSTOMER_SUMMARY,
    );
  }

  async invalidateCustomer(customerId: string, storeId: string): Promise<void> {
    try {
      await this.redis.delPattern(`${this.prefix}:*:${storeId}:${customerId}:*`);
    } catch {
      this.logger.warn(`Cache invalidation failed for customer ${customerId}`);
    }
  }

  async invalidateStore(storeId: string): Promise<void> {
    try {
      await this.redis.delPattern(`${this.prefix}:*:${storeId}:*`);
    } catch {
      this.logger.warn(`Cache invalidation failed for store ${storeId}`);
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      await this.redis.delPattern(`${this.prefix}:*`);
    } catch {
      this.logger.warn('Full cache invalidation failed');
    }
  }
}
