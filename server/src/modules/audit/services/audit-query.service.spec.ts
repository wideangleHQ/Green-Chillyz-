import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditActorType, AuditSeverity } from '@prisma/client';
import { AuditQueryService } from './audit-query.service';
import { AuditCacheService } from './audit-cache.service';
import { AuditRepository } from '../repositories';
import { AUDIT_ERRORS, AUDIT_ENTITY_TYPES } from '../constants';

const emptyPage = { items: [], nextCursor: null, hasMore: false };

const query = (extra: Record<string, unknown> = {}) =>
  ({ limit: 50, ...extra }) as never;

describe('AuditQueryService', () => {
  let service: AuditQueryService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      findPage: vi.fn().mockResolvedValue(emptyPage),
      findById: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    };
    cache = {
      buildTimelineKey: vi.fn().mockReturnValue('audit:timeline:abc'),
      getTimeline: vi.fn().mockResolvedValue(null),
      setTimeline: vi.fn(),
      getRecent: vi.fn().mockResolvedValue(null),
      setRecent: vi.fn(),
      getEntityTimeline: vi.fn().mockResolvedValue(null),
      setEntityTimeline: vi.fn(),
    };

    service = new AuditQueryService(
      repository as unknown as AuditRepository,
      cache as unknown as AuditCacheService,
    );
  });

  describe('read-only surface', () => {
    it('should expose no mutation methods', () => {
      const surface = service as unknown as Record<string, unknown>;

      expect(surface.create).toBeUndefined();
      expect(surface.update).toBeUndefined();
      expect(surface.delete).toBeUndefined();
    });
  });

  describe('query', () => {
    it('should return a cursor page', async () => {
      const result = await service.query(query());

      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by store', async () => {
      await service.query(query({ storeId: 'store-1' }));

      expect(repository.findPage.mock.calls[0][0].storeId).toBe('store-1');
    });

    it('should filter by actor type and severity', async () => {
      await service.query(
        query({ actorType: AuditActorType.EMPLOYEE, severity: AuditSeverity.HIGH }),
      );

      const where = repository.findPage.mock.calls[0][0];
      expect(where.actorType).toBe(AuditActorType.EMPLOYEE);
      expect(where.severity).toBe(AuditSeverity.HIGH);
    });

    it('should filter by entity', async () => {
      await service.query(
        query({ entityType: AUDIT_ENTITY_TYPES.VOUCHER, entityId: 'v1' }),
      );

      const where = repository.findPage.mock.calls[0][0];
      expect(where.entityType).toBe(AUDIT_ENTITY_TYPES.VOUCHER);
      expect(where.entityId).toBe('v1');
    });

    it('should apply a date range', async () => {
      await service.query(
        query({ fromDate: '2026-07-01', toDate: '2026-07-31' }),
      );

      const where = repository.findPage.mock.calls[0][0];
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      expect(where.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should reject an inverted date range', async () => {
      await expect(
        service.query(query({ fromDate: '2026-12-01', toDate: '2026-01-01' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('should cache the first page only', async () => {
      await service.query(query());

      expect(cache.setTimeline).toHaveBeenCalled();
    });

    it('should not cache a deep page', async () => {
      await service.query(query({ cursor: 'abc' }));

      expect(cache.setTimeline).not.toHaveBeenCalled();
    });

    it('should serve a cached first page without querying', async () => {
      cache.getTimeline.mockResolvedValue(emptyPage);

      await service.query(query());

      expect(repository.findPage).not.toHaveBeenCalled();
    });

    it('should surface a malformed cursor as a 400', async () => {
      repository.findPage.mockRejectedValue(new Error(AUDIT_ERRORS.INVALID_CURSOR));

      await expect(service.query(query({ cursor: 'bad' }))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should rethrow unexpected repository errors', async () => {
      repository.findPage.mockRejectedValue(new Error('db down'));

      await expect(service.query(query())).rejects.toThrow('db down');
    });
  });

  describe('recent', () => {
    it('should serve from cache when warm', async () => {
      cache.getRecent.mockResolvedValue([{ id: 'audit-1' }]);

      const result = await service.recent();

      expect(result).toHaveLength(1);
      expect(repository.findPage).not.toHaveBeenCalled();
    });

    it('should populate the cache on a miss', async () => {
      await service.recent();

      expect(cache.setRecent).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return the record', async () => {
      const result = await service.getById('audit-1');

      expect(result.id).toBe('audit-1');
    });

    it('should throw when missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('timelines', () => {
    it('should scope an entity timeline', async () => {
      await service.entityTimeline(
        query({ entityType: 'VOUCHER', entityId: 'v1' }),
      );

      expect(repository.findPage.mock.calls[0][0]).toEqual({
        entityType: 'VOUCHER',
        entityId: 'v1',
      });
    });

    it('should cache the first page of an entity timeline', async () => {
      await service.entityTimeline(
        query({ entityType: 'VOUCHER', entityId: 'v1' }),
      );

      expect(cache.setEntityTimeline).toHaveBeenCalled();
    });

    it('should scope a user timeline', async () => {
      await service.userTimeline('user-1', query());

      expect(repository.findPage.mock.calls[0][0]).toEqual({ userId: 'user-1' });
    });

    it('should match an employee as either actor or subject', async () => {
      await service.employeeTimeline('emp-1', query());

      expect(repository.findPage.mock.calls[0][0].OR).toEqual([
        { employeeId: 'emp-1' },
        { userId: 'emp-1' },
      ]);
    });

    it('should scope a store timeline', async () => {
      await service.storeTimeline('store-1', query());

      expect(repository.findPage.mock.calls[0][0]).toEqual({ storeId: 'store-1' });
    });
  });

  describe('search', () => {
    it('should match identifiers and metadata', async () => {
      await service.search(query({ q: 'ABCD1234' }));

      const where = repository.findPage.mock.calls[0][0];
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { entityId: 'ABCD1234' },
          { correlationId: 'ABCD1234' },
          { requestId: 'ABCD1234' },
        ]),
      );
    });

    it('should trim the search term', async () => {
      await service.search(query({ q: '  ABCD  ' }));

      expect(repository.findPage.mock.calls[0][0].OR[0]).toEqual({
        entityId: 'ABCD',
      });
    });

    it('should narrow by entity type when given', async () => {
      await service.search(query({ q: 'x', entityType: 'VOUCHER' }));

      expect(repository.findPage.mock.calls[0][0].entityType).toBe('VOUCHER');
    });
  });
});
