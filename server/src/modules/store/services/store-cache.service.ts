import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { STORE_CACHE } from '../constants';

@Injectable()
export class StoreCacheService {
  constructor(private readonly redis: RedisService) {}

  async getStoreDetail<T>(storeId: string): Promise<T | null> {
    return this.redis.get<T>(`${STORE_CACHE.DETAIL}${storeId}`);
  }

  async setStoreDetail(storeId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${STORE_CACHE.DETAIL}${storeId}`,
      data,
      STORE_CACHE.TTL_DETAIL,
    );
  }

  async getStoreBySlug<T>(slug: string): Promise<T | null> {
    return this.redis.get<T>(`${STORE_CACHE.SLUG}${slug}`);
  }

  async setStoreBySlug(slug: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${STORE_CACHE.SLUG}${slug}`,
      data,
      STORE_CACHE.TTL_DETAIL,
    );
  }

  async getList<T>(cacheKey: string): Promise<T | null> {
    return this.redis.get<T>(`${STORE_CACHE.LIST}${cacheKey}`);
  }

  async setList(cacheKey: string, data: unknown, ttl?: number): Promise<void> {
    await this.redis.set(
      `${STORE_CACHE.LIST}${cacheKey}`,
      data,
      ttl ?? STORE_CACHE.TTL_LIST,
    );
  }

  async getFeatured<T>(): Promise<T | null> {
    return this.redis.get<T>(STORE_CACHE.FEATURED);
  }

  async setFeatured(data: unknown): Promise<void> {
    await this.redis.set(STORE_CACHE.FEATURED, data, STORE_CACHE.TTL_FEATURED);
  }

  async getNearby<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(`${STORE_CACHE.NEARBY}${key}`);
  }

  async setNearby(key: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${STORE_CACHE.NEARBY}${key}`,
      data,
      STORE_CACHE.TTL_NEARBY,
    );
  }

  async getSearch<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(`${STORE_CACHE.SEARCH}${key}`);
  }

  async setSearch(key: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${STORE_CACHE.SEARCH}${key}`,
      data,
      STORE_CACHE.TTL_SEARCH,
    );
  }

  async invalidateStore(storeId: string, slug?: string): Promise<void> {
    await this.redis.del(`${STORE_CACHE.DETAIL}${storeId}`);
    if (slug) {
      await this.redis.del(`${STORE_CACHE.SLUG}${slug}`);
    }
    await this.redis.delPattern(`${STORE_CACHE.LIST}*`);
    await this.redis.del(STORE_CACHE.FEATURED);
    await this.redis.delPattern(`${STORE_CACHE.NEARBY}*`);
    await this.redis.delPattern(`${STORE_CACHE.SEARCH}*`);
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${STORE_CACHE.PREFIX}*`);
  }
}
