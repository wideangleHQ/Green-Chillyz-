import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationCacheService } from './notification-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { NOTIFICATION_CACHE } from '../constants';

describe('NotificationCacheService', () => {
  let service: NotificationCacheService;
  let redis: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      del: vi.fn(),
      delPattern: vi.fn(),
    };
    service = new NotificationCacheService(redis as unknown as RedisService);
  });

  it('should key the unread count per user', async () => {
    await service.getUnreadCount('user-1');

    expect(redis.get).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.UNREAD_COUNT}user-1`,
    );
  });

  it('should write the unread count with its TTL', async () => {
    await service.setUnreadCount('user-1', 5);

    expect(redis.set).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.UNREAD_COUNT}user-1`,
      5,
      NOTIFICATION_CACHE.TTL_UNREAD,
    );
  });

  it('should key latest notifications per user', async () => {
    await service.getLatest('user-1');

    expect(redis.get).toHaveBeenCalledWith(`${NOTIFICATION_CACHE.LATEST}user-1`);
  });

  it('should write templates with the template TTL', async () => {
    await service.setTemplate('wallet.credited', { key: 'wallet.credited' });

    expect(redis.set).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.TEMPLATE}wallet.credited`,
      { key: 'wallet.credited' },
      NOTIFICATION_CACHE.TTL_TEMPLATE,
    );
  });

  it('should write preferences with the preference TTL', async () => {
    await service.setPreferences('user-1', { wallet: true });

    expect(redis.set).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.PREFERENCES}user-1`,
      { wallet: true },
      NOTIFICATION_CACHE.TTL_PREFERENCES,
    );
  });

  it('should drop both badge and drawer caches together', async () => {
    await service.invalidateUser('user-1');

    expect(redis.del).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.UNREAD_COUNT}user-1`,
    );
    expect(redis.del).toHaveBeenCalledWith(`${NOTIFICATION_CACHE.LATEST}user-1`);
  });

  it('should invalidate a single template', async () => {
    await service.invalidateTemplate('wallet.credited');

    expect(redis.del).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.TEMPLATE}wallet.credited`,
    );
  });

  it('should invalidate preferences for one user', async () => {
    await service.invalidatePreferences('user-1');

    expect(redis.del).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.PREFERENCES}user-1`,
    );
  });

  it('should drop everything under the notification prefix', async () => {
    await service.invalidateAll();

    expect(redis.delPattern).toHaveBeenCalledWith(
      `${NOTIFICATION_CACHE.PREFIX}*`,
    );
  });
});
