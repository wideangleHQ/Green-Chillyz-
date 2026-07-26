import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../../providers/redis/redis.service';
import { AUDIT_CACHE } from '../constants';

@Injectable()
export class AuditCacheService {
  constructor(private readonly redis: RedisService) {}

  /** Filter sets vary widely; hash them into a compact stable key. */
  buildTimelineKey(filters: Record<string, unknown>): string {
    const normalized = Object.keys(filters)
      .filter((k) => filters[k] !== undefined && filters[k] !== null)
      .sort()
      .map((k) => `${k}=${String(filters[k])}`)
      .join('&');
    const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 16);
    return `${AUDIT_CACHE.TIMELINE}${hash}`;
  }

  async getRecent<T>(): Promise<T | null> {
    return this.redis.get<T>(AUDIT_CACHE.RECENT);
  }

  async setRecent(data: unknown): Promise<void> {
    await this.redis.set(AUDIT_CACHE.RECENT, data, AUDIT_CACHE.TTL_RECENT);
  }

  async getTimeline<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  async setTimeline(key: string, data: unknown): Promise<void> {
    await this.redis.set(key, data, AUDIT_CACHE.TTL_TIMELINE);
  }

  async getEntityTimeline<T>(
    entityType: string,
    entityId: string,
  ): Promise<T | null> {
    return this.redis.get<T>(`${AUDIT_CACHE.ENTITY}${entityType}:${entityId}`);
  }

  async setEntityTimeline(
    entityType: string,
    entityId: string,
    data: unknown,
  ): Promise<void> {
    await this.redis.set(
      `${AUDIT_CACHE.ENTITY}${entityType}:${entityId}`,
      data,
      AUDIT_CACHE.TTL_ENTITY,
    );
  }

  async getAnalytics<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(`${AUDIT_CACHE.ANALYTICS}:${key}`);
  }

  async setAnalytics(key: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${AUDIT_CACHE.ANALYTICS}:${key}`,
      data,
      AUDIT_CACHE.TTL_ANALYTICS,
    );
  }

  /**
   * Called after an append. Only the surfaces that a new row can change are
   * dropped: the recent feed, the filtered timelines, and that entity's trail.
   * Deep history pages are immutable, so their cache entries are left alone
   * and simply age out.
   */
  async invalidateOnAppend(
    entityType?: string | null,
    entityId?: string | null,
  ): Promise<void> {
    await this.redis.del(AUDIT_CACHE.RECENT);
    await this.redis.delPattern(`${AUDIT_CACHE.TIMELINE}*`);

    if (entityType && entityId) {
      await this.redis.del(`${AUDIT_CACHE.ENTITY}${entityType}:${entityId}`);
    }
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${AUDIT_CACHE.PREFIX}*`);
  }
}
