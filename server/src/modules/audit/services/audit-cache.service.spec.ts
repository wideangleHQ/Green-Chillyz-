import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditCacheService } from './audit-cache.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { AUDIT_CACHE } from '../constants';

describe('AuditCacheService', () => {
  let service: AuditCacheService;
  let redis: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      del: vi.fn(),
      delPattern: vi.fn(),
    };
    service = new AuditCacheService(redis as unknown as RedisService);
  });

  describe('buildTimelineKey', () => {
    it('should be stable regardless of key order', () => {
      const a = service.buildTimelineKey({ storeId: 's1', severity: 'HIGH' });
      const b = service.buildTimelineKey({ severity: 'HIGH', storeId: 's1' });

      expect(a).toBe(b);
    });

    it('should differ for different filters', () => {
      expect(service.buildTimelineKey({ storeId: 's1' })).not.toBe(
        service.buildTimelineKey({ storeId: 's2' }),
      );
    });

    it('should ignore undefined values', () => {
      expect(service.buildTimelineKey({ storeId: 's1', cursor: undefined })).toBe(
        service.buildTimelineKey({ storeId: 's1' }),
      );
    });

    it('should namespace under the timeline prefix', () => {
      expect(service.buildTimelineKey({})).toContain(AUDIT_CACHE.TIMELINE);
    });
  });

  it('should write the recent feed with its TTL', async () => {
    await service.setRecent([]);

    expect(redis.set).toHaveBeenCalledWith(
      AUDIT_CACHE.RECENT, [], AUDIT_CACHE.TTL_RECENT,
    );
  });

  it('should key an entity timeline by type and id', async () => {
    await service.getEntityTimeline('VOUCHER', 'v1');

    expect(redis.get).toHaveBeenCalledWith(`${AUDIT_CACHE.ENTITY}VOUCHER:v1`);
  });

  it('should write analytics with its TTL', async () => {
    await service.setAnalytics('key', { totalEvents: 1 });

    expect(redis.set).toHaveBeenCalledWith(
      `${AUDIT_CACHE.ANALYTICS}:key`,
      { totalEvents: 1 },
      AUDIT_CACHE.TTL_ANALYTICS,
    );
  });

  describe('invalidateOnAppend', () => {
    it('should drop the recent feed and filtered timelines', async () => {
      await service.invalidateOnAppend();

      expect(redis.del).toHaveBeenCalledWith(AUDIT_CACHE.RECENT);
      expect(redis.delPattern).toHaveBeenCalledWith(`${AUDIT_CACHE.TIMELINE}*`);
    });

    it('should drop that entity trail when identified', async () => {
      await service.invalidateOnAppend('VOUCHER', 'v1');

      expect(redis.del).toHaveBeenCalledWith(`${AUDIT_CACHE.ENTITY}VOUCHER:v1`);
    });

    it('should leave analytics alone; it ages out on its own TTL', async () => {
      await service.invalidateOnAppend('VOUCHER', 'v1');

      expect(redis.del).not.toHaveBeenCalledWith(AUDIT_CACHE.ANALYTICS);
    });
  });

  it('should drop everything under the audit prefix', async () => {
    await service.invalidateAll();

    expect(redis.delPattern).toHaveBeenCalledWith(`${AUDIT_CACHE.PREFIX}*`);
  });
});
