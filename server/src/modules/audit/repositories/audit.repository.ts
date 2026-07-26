import { Injectable, Logger } from '@nestjs/common';
import { Prisma, AuditActorType, AuditSeverity } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  AuditRecordInput,
  AuditLogResponse,
  AuditCursorPage,
} from '../interfaces';
import { encodeCursor, decodeCursor, redactSensitive } from '../utils';
import { AUDIT_DEFAULTS } from '../constants';

const AUDIT_SELECT = {
  id: true,
  eventType: true,
  entityType: true,
  entityId: true,
  action: true,
  actorType: true,
  actorRole: true,
  userId: true,
  employeeId: true,
  storeId: true,
  severity: true,
  oldValue: true,
  newValue: true,
  metadata: true,
  ipAddress: true,
  device: true,
  requestId: true,
  correlationId: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

/**
 * The only component that touches the audit table.
 *
 * Exposes append and read operations exclusively — there is deliberately no
 * update or delete method anywhere in this class, so immutability is enforced
 * by the absence of a code path rather than by convention.
 */
@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append one row. Returns null when a duplicate dedupeKey means this
   * logical event was already recorded.
   */
  async append(input: AuditRecordInput): Promise<AuditLogResponse | null> {
    // Cheap pre-check keeps the ordinary replay path from raising a
    // constraint violation; the unique index remains the race-safe guard.
    if (input.dedupeKey) {
      const existing = await this.prisma.auditLog.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: { id: true },
      });
      if (existing) return null;
    }

    try {
      const row = await this.prisma.auditLog.create({
        data: {
          eventType: input.eventType,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          action: input.action,
          actorType: input.actorType ?? AuditActorType.SYSTEM,
          actorRole: input.actorRole ?? null,
          userId: input.userId ?? null,
          employeeId: input.employeeId ?? null,
          storeId: input.storeId ?? null,
          severity: input.severity ?? AuditSeverity.INFO,
          oldValue: this.toJson(redactSensitive(input.oldValue)),
          newValue: this.toJson(redactSensitive(input.newValue)),
          metadata: this.toJson(redactSensitive(input.metadata)),
          ipAddress: input.ipAddress ?? null,
          device: input.device ?? null,
          userAgent: input.userAgent ?? null,
          requestId: input.requestId ?? null,
          correlationId: input.correlationId ?? null,
          dedupeKey: input.dedupeKey ?? null,
        },
        select: AUDIT_SELECT,
      });

      return this.toResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // A concurrent writer won the race on dedupeKey.
        this.logger.debug(
          `Duplicate audit suppressed (dedupeKey=${input.dedupeKey})`,
        );
        return null;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<AuditLogResponse | null> {
    const row = await this.prisma.auditLog.findUnique({
      where: { id },
      select: AUDIT_SELECT,
    });
    return row ? this.toResponse(row) : null;
  }

  /**
   * Cursor page over the timeline index. Fetches one extra row to determine
   * hasMore without a second count query.
   */
  async findPage(
    where: Prisma.AuditLogWhereInput,
    limit: number = AUDIT_DEFAULTS.PAGE_SIZE,
    cursor?: string,
  ): Promise<AuditCursorPage<AuditLogResponse>> {
    const effectiveWhere = cursor
      ? { AND: [where, this.cursorPredicate(cursor)] }
      : where;

    const rows = await this.prisma.auditLog.findMany({
      where: effectiveWhere,
      select: AUDIT_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => this.toResponse(row)),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
      hasMore,
    };
  }

  async countBy(where: Prisma.AuditLogWhereInput): Promise<number> {
    return this.prisma.auditLog.count({ where });
  }

  async groupByAction(
    where: Prisma.AuditLogWhereInput,
    take: number,
  ): Promise<Array<{ action: string; count: number }>> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { _all: true },
      orderBy: { _count: { action: 'desc' } },
      take,
    });
    return groups.map((g) => ({ action: g.action, count: g._count._all }));
  }

  async groupByEventType(
    where: Prisma.AuditLogWhereInput,
    take: number,
  ): Promise<Array<{ eventType: string; count: number }>> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['eventType'],
      where,
      _count: { _all: true },
      orderBy: { _count: { eventType: 'desc' } },
      take,
    });
    return groups.map((g) => ({ eventType: g.eventType, count: g._count._all }));
  }

  async groupByUser(
    where: Prisma.AuditLogWhereInput,
    take: number,
  ): Promise<Array<{ userId: string; count: number }>> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take,
    });
    return groups
      .filter((g) => g.userId !== null)
      .map((g) => ({ userId: g.userId as string, count: g._count._all }));
  }

  async groupByStore(
    where: Prisma.AuditLogWhereInput,
    take: number,
  ): Promise<Array<{ storeId: string; count: number }>> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['storeId'],
      where: { ...where, storeId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { storeId: 'desc' } },
      take,
    });
    return groups
      .filter((g) => g.storeId !== null)
      .map((g) => ({ storeId: g.storeId as string, count: g._count._all }));
  }

  async groupBySeverity(
    where: Prisma.AuditLogWhereInput,
  ): Promise<Array<{ severity: AuditSeverity; count: number }>> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: { _all: true },
    });
    return groups.map((g) => ({ severity: g.severity, count: g._count._all }));
  }

  async groupByActorType(
    where: Prisma.AuditLogWhereInput,
  ): Promise<Array<{ actorType: AuditActorType; count: number }>> {
    const groups = await this.prisma.auditLog.groupBy({
      by: ['actorType'],
      where,
      _count: { _all: true },
    });
    return groups.map((g) => ({ actorType: g.actorType, count: g._count._all }));
  }

  /**
   * Keyset predicate: rows strictly older than the cursor position.
   * Ties on createdAt are broken by id so no row is skipped or repeated.
   */
  private cursorPredicate(cursor: string): Prisma.AuditLogWhereInput {
    const { createdAt, id } = decodeCursor(cursor);
    const at = new Date(createdAt);

    return {
      OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }],
    };
  }

  private toJson(
    value: Record<string, unknown> | null,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;
  }

  private toResponse(
    row: Prisma.AuditLogGetPayload<{ select: typeof AUDIT_SELECT }>,
  ): AuditLogResponse {
    return {
      id: row.id,
      eventType: row.eventType,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      actorType: row.actorType,
      actorRole: row.actorRole,
      userId: row.userId,
      employeeId: row.employeeId,
      storeId: row.storeId,
      severity: row.severity,
      oldValue: (row.oldValue as Record<string, unknown> | null) ?? null,
      newValue: (row.newValue as Record<string, unknown> | null) ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      ipAddress: row.ipAddress,
      device: row.device,
      requestId: row.requestId,
      correlationId: row.correlationId,
      createdAt: row.createdAt,
    };
  }
}
