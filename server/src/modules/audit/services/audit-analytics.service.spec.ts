import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditSeverity } from '@prisma/client';
import { AuditAnalyticsService } from './audit-analytics.service';
import { AuditCacheService } from './audit-cache.service';
import { AuditRepository } from '../repositories';
import { AUDIT_EVENTS } from '../constants';

describe('AuditAnalyticsService', () => {
  let service: AuditAnalyticsService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      countBy: vi.fn().mockResolvedValue(0),
      groupByAction: vi.fn().mockResolvedValue([]),
      groupByEventType: vi.fn().mockResolvedValue([]),
      groupByUser: vi.fn().mockResolvedValue([]),
      groupByStore: vi.fn().mockResolvedValue([]),
      groupBySeverity: vi.fn().mockResolvedValue([]),
      groupByActorType: vi.fn().mockResolvedValue([]),
      findPage: vi.fn().mockResolvedValue({ items: [], nextCursor: null, hasMore: false }),
    };
    cache = {
      getAnalytics: vi.fn().mockResolvedValue(null),
      setAnalytics: vi.fn(),
    };

    service = new AuditAnalyticsService(
      repository as unknown as AuditRepository,
      cache as unknown as AuditCacheService,
    );
  });

  describe('getAnalytics', () => {
    it('should assemble the full report', async () => {
      repository.countBy.mockResolvedValue(42);
      repository.groupByAction.mockResolvedValue([{ action: 'CREDIT', count: 10 }]);

      const result = await service.getAnalytics({});

      expect(result.totalEvents).toBe(42);
      expect(result.mostFrequentActions).toEqual([{ action: 'CREDIT', count: 10 }]);
    });

    it('should count manual adjustments by event type', async () => {
      await service.getAnalytics({});

      const calls = repository.countBy.mock.calls.map((c) => c[0]);
      expect(calls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: AUDIT_EVENTS.MANUAL_WALLET_ADJUSTMENT,
          }),
        ]),
      );
    });

    it('should count high and critical severities separately', async () => {
      await service.getAnalytics({});

      const calls = repository.countBy.mock.calls.map((c) => c[0]);
      expect(calls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ severity: AuditSeverity.HIGH }),
          expect.objectContaining({ severity: AuditSeverity.CRITICAL }),
        ]),
      );
    });

    it('should restrict employee activity to staff actor types', async () => {
      await service.getAnalytics({});

      const where = repository.groupByUser.mock.calls[0][0];
      expect(where.actorType).toEqual({ in: ['EMPLOYEE', 'STORE_MANAGER'] });
    });

    it('should scope to a store when requested', async () => {
      await service.getAnalytics({ storeId: 'store-1' });

      expect(repository.countBy.mock.calls[0][0].storeId).toBe('store-1');
    });

    it('should apply a date range', async () => {
      await service.getAnalytics({ fromDate: '2026-07-01', toDate: '2026-07-31' });

      const where = repository.countBy.mock.calls[0][0];
      expect(where.createdAt.gte).toBeInstanceOf(Date);
    });

    it('should serve from cache without querying', async () => {
      cache.getAnalytics.mockResolvedValue({ totalEvents: 7 });

      const result = await service.getAnalytics({});

      expect(result.totalEvents).toBe(7);
      expect(repository.countBy).not.toHaveBeenCalled();
    });

    it('should cache the computed report', async () => {
      await service.getAnalytics({});

      expect(cache.setAnalytics).toHaveBeenCalled();
    });

    it('should key the cache by filter combination', async () => {
      await service.getAnalytics({ storeId: 'store-1', fromDate: '2026-07-01' });

      expect(cache.getAnalytics).toHaveBeenCalledWith('2026-07-01:-:store-1');
    });
  });

  describe('getFraudIndicators', () => {
    it('should surface manual adjustments and lookups by actor', async () => {
      repository.groupByUser
        .mockResolvedValueOnce([{ userId: 'staff-1', count: 9 }])
        .mockResolvedValueOnce([{ userId: 'staff-2', count: 40 }]);

      const result = await service.getFraudIndicators({});

      expect(result.manualAdjustmentsByActor).toEqual([
        { userId: 'staff-1', count: 9 },
      ]);
      expect(result.customerLookupsByActor).toEqual([
        { userId: 'staff-2', count: 40 },
      ]);
    });

    it('should include critical events for review', async () => {
      repository.findPage.mockResolvedValue({
        items: [{ id: 'audit-1', severity: AuditSeverity.CRITICAL }],
        nextCursor: null,
        hasMore: false,
      });

      const result = await service.getFraudIndicators({});

      expect(result.criticalEvents).toHaveLength(1);
    });

    it('should query adjustments and lookups by their event types', async () => {
      await service.getFraudIndicators({});

      const wheres = repository.groupByUser.mock.calls.map((c) => c[0].eventType);
      expect(wheres).toContain(AUDIT_EVENTS.MANUAL_WALLET_ADJUSTMENT);
      expect(wheres).toContain(AUDIT_EVENTS.CUSTOMER_LOOKUP);
    });
  });
});
