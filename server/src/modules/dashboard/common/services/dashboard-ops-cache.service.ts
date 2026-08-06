import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../providers/redis/redis.service';
import { DASHBOARD_OPS_CACHE } from '../constants';

/**
 * Store-scoped Redis cache for dashboard operational reads.
 *
 * Every key carries the store id, so `invalidateStore` can wipe one store's
 * operational view (after a redemption, a wallet movement, …) without
 * disturbing any other store or the customer-facing caches.
 */
@Injectable()
export class DashboardOpsCacheService {
  constructor(private readonly redis: RedisService) {}

  private key(storeId: string, section: string, suffix = ''): string {
    return `${DASHBOARD_OPS_CACHE.PREFIX}:${storeId}:${section}${suffix ? `:${suffix}` : ''}`;
  }

  async get<T>(storeId: string, section: string, suffix = ''): Promise<T | null> {
    return this.redis.get<T>(this.key(storeId, section, suffix));
  }

  async set(
    storeId: string,
    section: string,
    data: unknown,
    ttlSeconds: number,
    suffix = '',
  ): Promise<void> {
    await this.redis.set(this.key(storeId, section, suffix), data, ttlSeconds);
  }

  /** Wipes every cached operational read for one store. */
  async invalidateStore(storeId: string): Promise<void> {
    await this.redis.delPattern(`${DASHBOARD_OPS_CACHE.PREFIX}:${storeId}:*`);
  }

  /** Wipes one section (e.g. analytics after a movement) for one store. */
  async invalidateSection(storeId: string, section: string): Promise<void> {
    await this.redis.delPattern(
      `${DASHBOARD_OPS_CACHE.PREFIX}:${storeId}:${section}*`,
    );
  }
}
