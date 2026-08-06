import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisService } from '../../../../providers/redis/redis.service';
import { DashboardOpsCacheService } from './dashboard-ops-cache.service';

describe('DashboardOpsCacheService', () => {
  let service: DashboardOpsCacheService;
  let redis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delPattern: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
    };
    service = new DashboardOpsCacheService(redis as unknown as RedisService);
  });

  it('should namespace keys by store and section', async () => {
    await service.get('store-1', 'stats');

    expect(redis.get).toHaveBeenCalledWith('dashboard:ops:store-1:stats');
  });

  it('should append the suffix when given', async () => {
    await service.get('store-1', 'analytics', 'daily');

    expect(redis.get).toHaveBeenCalledWith(
      'dashboard:ops:store-1:analytics:daily',
    );
  });

  it('should write with the requested TTL', async () => {
    await service.set('store-1', 'stats', { a: 1 }, 120);

    expect(redis.set).toHaveBeenCalledWith(
      'dashboard:ops:store-1:stats',
      { a: 1 },
      120,
    );
  });

  it('should invalidate only the given store', async () => {
    await service.invalidateStore('store-1');

    expect(redis.delPattern).toHaveBeenCalledWith('dashboard:ops:store-1:*');
  });

  it('should invalidate one section without touching others', async () => {
    await service.invalidateSection('store-1', 'analytics');

    expect(redis.delPattern).toHaveBeenCalledWith(
      'dashboard:ops:store-1:analytics*',
    );
  });
});
