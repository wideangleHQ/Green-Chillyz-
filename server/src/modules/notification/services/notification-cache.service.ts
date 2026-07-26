import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { NOTIFICATION_CACHE } from '../constants';

@Injectable()
export class NotificationCacheService {
  constructor(private readonly redis: RedisService) {}

  async getUnreadCount(userId: string): Promise<number | null> {
    return this.redis.get<number>(`${NOTIFICATION_CACHE.UNREAD_COUNT}${userId}`);
  }

  async setUnreadCount(userId: string, count: number): Promise<void> {
    await this.redis.set(
      `${NOTIFICATION_CACHE.UNREAD_COUNT}${userId}`,
      count,
      NOTIFICATION_CACHE.TTL_UNREAD,
    );
  }

  async getLatest<T>(userId: string): Promise<T | null> {
    return this.redis.get<T>(`${NOTIFICATION_CACHE.LATEST}${userId}`);
  }

  async setLatest(userId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${NOTIFICATION_CACHE.LATEST}${userId}`,
      data,
      NOTIFICATION_CACHE.TTL_LATEST,
    );
  }

  async getTemplate<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(`${NOTIFICATION_CACHE.TEMPLATE}${key}`);
  }

  async setTemplate(key: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${NOTIFICATION_CACHE.TEMPLATE}${key}`,
      data,
      NOTIFICATION_CACHE.TTL_TEMPLATE,
    );
  }

  async invalidateTemplate(key: string): Promise<void> {
    await this.redis.del(`${NOTIFICATION_CACHE.TEMPLATE}${key}`);
  }

  async getPreferences<T>(userId: string): Promise<T | null> {
    return this.redis.get<T>(`${NOTIFICATION_CACHE.PREFERENCES}${userId}`);
  }

  async setPreferences(userId: string, data: unknown): Promise<void> {
    await this.redis.set(
      `${NOTIFICATION_CACHE.PREFERENCES}${userId}`,
      data,
      NOTIFICATION_CACHE.TTL_PREFERENCES,
    );
  }

  async invalidatePreferences(userId: string): Promise<void> {
    await this.redis.del(`${NOTIFICATION_CACHE.PREFERENCES}${userId}`);
  }

  /** Drops the badge count and drawer list so both reflect the change at once. */
  async invalidateUser(userId: string): Promise<void> {
    await this.redis.del(`${NOTIFICATION_CACHE.UNREAD_COUNT}${userId}`);
    await this.redis.del(`${NOTIFICATION_CACHE.LATEST}${userId}`);
  }

  async invalidateAll(): Promise<void> {
    await this.redis.delPattern(`${NOTIFICATION_CACHE.PREFIX}*`);
  }
}
