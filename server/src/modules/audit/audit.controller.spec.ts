import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditController } from './audit.controller';
import { AuditQueryService, AuditAnalyticsService } from './services';

const page = { items: [], nextCursor: null, hasMore: false };
const cursorQuery = { limit: 50 } as never;

describe('AuditController', () => {
  let controller: AuditController;
  let queryService: Record<string, ReturnType<typeof vi.fn>>;
  let analyticsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    queryService = {
      query: vi.fn().mockResolvedValue(page),
      recent: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue(page),
      getById: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      entityTimeline: vi.fn().mockResolvedValue(page),
      userTimeline: vi.fn().mockResolvedValue(page),
      employeeTimeline: vi.fn().mockResolvedValue(page),
      storeTimeline: vi.fn().mockResolvedValue(page),
    };
    analyticsService = {
      getAnalytics: vi.fn().mockResolvedValue({ totalEvents: 5 }),
      getFraudIndicators: vi.fn().mockResolvedValue({ highSeverityCount: 2 }),
    };

    controller = new AuditController(
      queryService as unknown as AuditQueryService,
      analyticsService as unknown as AuditAnalyticsService,
    );
  });

  describe('immutability of the HTTP surface', () => {
    it('should expose no create, update or delete handler', () => {
      const surface = controller as unknown as Record<string, unknown>;

      expect(surface.create).toBeUndefined();
      expect(surface.update).toBeUndefined();
      expect(surface.delete).toBeUndefined();
      expect(surface.remove).toBeUndefined();
    });

    it('should only expose read handlers', () => {
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(controller),
      ).filter((m) => m !== 'constructor');

      // Every handler is a read; nothing writes.
      expect(methods.sort()).toEqual(
        [
          'analytics',
          'entityTimeline',
          'employeeTimeline',
          'fraudIndicators',
          'getById',
          'query',
          'recent',
          'search',
          'storeTimeline',
          'userTimeline',
        ].sort(),
      );
    });
  });

  it('should delegate a timeline query', async () => {
    const result = await controller.query(cursorQuery);

    expect(result).toEqual(page);
    expect(queryService.query).toHaveBeenCalledWith(cursorQuery);
  });

  it('should return the recent feed', async () => {
    await controller.recent();

    expect(queryService.recent).toHaveBeenCalled();
  });

  it('should delegate a search', async () => {
    await controller.search({ q: 'ABCD', limit: 50 } as never);

    expect(queryService.search).toHaveBeenCalled();
  });

  it('should return analytics', async () => {
    const result = await controller.analytics({});

    expect(result.totalEvents).toBe(5);
  });

  it('should return fraud indicators', async () => {
    const result = await controller.fraudIndicators({});

    expect(result.highSeverityCount).toBe(2);
  });

  it('should return an entity timeline', async () => {
    await controller.entityTimeline({
      entityType: 'VOUCHER', entityId: 'v1', limit: 50,
    } as never);

    expect(queryService.entityTimeline).toHaveBeenCalled();
  });

  it('should return a user timeline', async () => {
    await controller.userTimeline('user-1', cursorQuery);

    expect(queryService.userTimeline).toHaveBeenCalledWith('user-1', cursorQuery);
  });

  it('should return an employee timeline', async () => {
    await controller.employeeTimeline('emp-1', cursorQuery);

    expect(queryService.employeeTimeline).toHaveBeenCalledWith('emp-1', cursorQuery);
  });

  it('should return a store timeline', async () => {
    await controller.storeTimeline('store-1', cursorQuery);

    expect(queryService.storeTimeline).toHaveBeenCalledWith('store-1', cursorQuery);
  });

  it('should return a single record', async () => {
    const result = await controller.getById('audit-1');

    expect(result.id).toBe('audit-1');
  });
});
