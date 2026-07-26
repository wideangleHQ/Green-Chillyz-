import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma, AuditActorType, AuditSeverity } from '@prisma/client';
import { AuditRepository } from './audit.repository';
import { PrismaService } from '../../../database/prisma.service';
import { AUDIT_ENTITY_TYPES, AUDIT_ACTIONS } from '../constants';
import { encodeCursor } from '../utils';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-1',
  eventType: 'wallet.credited',
  entityType: AUDIT_ENTITY_TYPES.WALLET,
  entityId: 'user-1',
  action: AUDIT_ACTIONS.CREDIT,
  actorType: AuditActorType.SYSTEM,
  actorRole: null,
  userId: 'user-1',
  employeeId: null,
  storeId: null,
  severity: AuditSeverity.INFO,
  oldValue: { balance: 100 },
  newValue: { balance: 150 },
  metadata: { amount: 50 },
  ipAddress: '127.0.0.1',
  device: 'Chrome',
  requestId: 'req-1',
  correlationId: 'corr-1',
  createdAt: new Date('2026-07-26T10:00:00Z'),
  ...overrides,
});

describe('AuditRepository', () => {
  let repository: AuditRepository;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    prisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue(makeRow()),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        groupBy: vi.fn().mockResolvedValue([]),
      },
    };
    repository = new AuditRepository(prisma as unknown as PrismaService);
  });

  describe('immutability', () => {
    it('should expose no update method', () => {
      expect(
        (repository as unknown as Record<string, unknown>).update,
      ).toBeUndefined();
    });

    it('should expose no delete method', () => {
      expect(
        (repository as unknown as Record<string, unknown>).delete,
      ).toBeUndefined();
      expect(
        (repository as unknown as Record<string, unknown>).remove,
      ).toBeUndefined();
    });

    it('should never call prisma update or delete when appending', async () => {
      await repository.append({
        eventType: 'wallet.credited',
        entityType: AUDIT_ENTITY_TYPES.WALLET,
        action: AUDIT_ACTIONS.CREDIT,
      });

      expect(prisma.auditLog.update).toBeUndefined();
      expect(prisma.auditLog.delete).toBeUndefined();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('append', () => {
    it('should write a row and return it', async () => {
      const result = await repository.append({
        eventType: 'wallet.credited',
        entityType: AUDIT_ENTITY_TYPES.WALLET,
        entityId: 'user-1',
        action: AUDIT_ACTIONS.CREDIT,
        userId: 'user-1',
      });

      expect(result?.id).toBe('audit-1');
      expect(result?.eventType).toBe('wallet.credited');
    });

    it('should default actor type and severity', async () => {
      await repository.append({
        eventType: 'x',
        entityType: AUDIT_ENTITY_TYPES.SYSTEM,
        action: AUDIT_ACTIONS.CREATE,
      });

      const data = prisma.auditLog.create.mock.calls[0][0].data;
      expect(data.actorType).toBe(AuditActorType.SYSTEM);
      expect(data.severity).toBe(AuditSeverity.INFO);
    });

    it('should redact credentials before persisting', async () => {
      await repository.append({
        eventType: 'x',
        entityType: AUDIT_ENTITY_TYPES.USER,
        action: AUDIT_ACTIONS.UPDATE,
        newValue: { email: 'a@b.com', password: 'hunter2', token: 'abc' },
      });

      const data = prisma.auditLog.create.mock.calls[0][0].data;
      expect(data.newValue.password).toBe('[REDACTED]');
      expect(data.newValue.token).toBe('[REDACTED]');
      expect(data.newValue.email).toBe('a@b.com');
    });

    it('should suppress a replay via the dedupe pre-check', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({ id: 'existing' });

      const result = await repository.append({
        eventType: 'wallet.credited',
        entityType: AUDIT_ENTITY_TYPES.WALLET,
        action: AUDIT_ACTIONS.CREDIT,
        dedupeKey: 'audit:wallet.credited:txn-1',
      });

      expect(result).toBeNull();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should suppress a concurrent duplicate without throwing', async () => {
      prisma.auditLog.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.19.3',
        }),
      );

      const result = await repository.append({
        eventType: 'x',
        entityType: AUDIT_ENTITY_TYPES.WALLET,
        action: AUDIT_ACTIONS.CREDIT,
        dedupeKey: 'dup',
      });

      expect(result).toBeNull();
    });

    it('should rethrow unexpected database errors', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('connection lost'));

      await expect(
        repository.append({
          eventType: 'x',
          entityType: AUDIT_ENTITY_TYPES.WALLET,
          action: AUDIT_ACTIONS.CREDIT,
        }),
      ).rejects.toThrow('connection lost');
    });

    it('should store JsonNull rather than undefined for absent values', async () => {
      await repository.append({
        eventType: 'x',
        entityType: AUDIT_ENTITY_TYPES.SYSTEM,
        action: AUDIT_ACTIONS.CREATE,
      });

      const data = prisma.auditLog.create.mock.calls[0][0].data;
      expect(data.metadata).toBe(Prisma.JsonNull);
      expect(data.oldValue).toBe(Prisma.JsonNull);
    });
  });

  describe('findPage', () => {
    it('should order newest first with a stable tiebreak', async () => {
      await repository.findPage({}, 10);

      const args = prisma.auditLog.findMany.mock.calls[0][0];
      expect(args.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    });

    it('should over-fetch by one to detect more pages', async () => {
      await repository.findPage({}, 10);

      expect(prisma.auditLog.findMany.mock.calls[0][0].take).toBe(11);
    });

    it('should report hasMore and a cursor when the page is full', async () => {
      const rows = Array.from({ length: 11 }, (_, i) =>
        makeRow({ id: `audit-${i}` }),
      );
      prisma.auditLog.findMany.mockResolvedValue(rows);

      const page = await repository.findPage({}, 10);

      expect(page.items).toHaveLength(10);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBeTruthy();
    });

    it('should end pagination when no extra row exists', async () => {
      prisma.auditLog.findMany.mockResolvedValue([makeRow()]);

      const page = await repository.findPage({}, 10);

      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it('should apply a keyset predicate for the cursor', async () => {
      const cursor = encodeCursor(new Date('2026-07-26T10:00:00Z'), 'audit-5');

      await repository.findPage({}, 10, cursor);

      const where = prisma.auditLog.findMany.mock.calls[0][0].where;
      const predicate = where.AND[1];
      expect(predicate.OR).toHaveLength(2);
      expect(predicate.OR[1].id).toEqual({ lt: 'audit-5' });
    });

    it('should reject a malformed cursor', async () => {
      await expect(repository.findPage({}, 10, 'not-a-cursor')).rejects.toThrow();
    });
  });

  describe('aggregations', () => {
    it('should group by action ordered by frequency', async () => {
      prisma.auditLog.groupBy.mockResolvedValue([
        { action: 'CREDIT', _count: { _all: 12 } },
      ]);

      const result = await repository.groupByAction({}, 10);

      expect(result).toEqual([{ action: 'CREDIT', count: 12 }]);
    });

    it('should exclude null users when grouping by user', async () => {
      prisma.auditLog.groupBy.mockResolvedValue([
        { userId: 'user-1', _count: { _all: 3 } },
        { userId: null, _count: { _all: 9 } },
      ]);

      const result = await repository.groupByUser({}, 10);

      expect(result).toEqual([{ userId: 'user-1', count: 3 }]);
    });

    it('should exclude null stores when grouping by store', async () => {
      prisma.auditLog.groupBy.mockResolvedValue([
        { storeId: null, _count: { _all: 4 } },
      ]);

      const result = await repository.groupByStore({}, 10);

      expect(result).toEqual([]);
    });

    it('should group by severity', async () => {
      prisma.auditLog.groupBy.mockResolvedValue([
        { severity: AuditSeverity.CRITICAL, _count: { _all: 2 } },
      ]);

      const result = await repository.groupBySeverity({});

      expect(result).toEqual([{ severity: AuditSeverity.CRITICAL, count: 2 }]);
    });
  });
});
