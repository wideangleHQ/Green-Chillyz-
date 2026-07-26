import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from '../repositories';
import { AuditCacheService } from './audit-cache.service';
import {
  AuditQueryDto,
  AuditSearchDto,
  EntityTimelineDto,
  AuditCursorDto,
} from '../dto';
import { AuditLogResponse, AuditCursorPage } from '../interfaces';
import { AUDIT_ERRORS, AUDIT_DEFAULTS } from '../constants';

/**
 * Read side. Every method is non-mutating by construction — the repository
 * exposes no write path other than append, which lives on AuditService.
 */
@Injectable()
export class AuditQueryService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly cache: AuditCacheService,
  ) {}

  /** Filtered timeline — the dashboard's main view. */
  async query(dto: AuditQueryDto): Promise<AuditCursorPage<AuditLogResponse>> {
    const where = this.buildWhere(dto);

    // Only the first page is cached; deeper pages are rarely re-requested.
    const cacheable = !dto.cursor;
    const cacheKey = cacheable
      ? this.cache.buildTimelineKey({ ...dto, cursor: undefined })
      : null;

    if (cacheKey) {
      const cached =
        await this.cache.getTimeline<AuditCursorPage<AuditLogResponse>>(cacheKey);
      if (cached) return cached;
    }

    const page = await this.safePage(where, dto.limit, dto.cursor);

    if (cacheKey) {
      await this.cache.setTimeline(cacheKey, page);
    }
    return page;
  }

  /** Small hot payload for a dashboard "recent activity" widget. */
  async recent(): Promise<AuditLogResponse[]> {
    const cached = await this.cache.getRecent<AuditLogResponse[]>();
    if (cached) return cached;

    const page = await this.repository.findPage(
      {},
      AUDIT_DEFAULTS.RECENT_LIMIT,
    );

    await this.cache.setRecent(page.items);
    return page.items;
  }

  async getById(id: string): Promise<AuditLogResponse> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException(AUDIT_ERRORS.NOT_FOUND);
    }
    return row;
  }

  /** Full trail for one entity, e.g. every action on a voucher. */
  async entityTimeline(
    dto: EntityTimelineDto,
  ): Promise<AuditCursorPage<AuditLogResponse>> {
    const where: Prisma.AuditLogWhereInput = {
      entityType: dto.entityType,
      entityId: dto.entityId,
    };

    if (!dto.cursor) {
      const cached = await this.cache.getEntityTimeline<
        AuditCursorPage<AuditLogResponse>
      >(dto.entityType, dto.entityId);
      if (cached) return cached;
    }

    const page = await this.safePage(where, dto.limit, dto.cursor);

    if (!dto.cursor) {
      await this.cache.setEntityTimeline(dto.entityType, dto.entityId, page);
    }
    return page;
  }

  async userTimeline(
    userId: string,
    dto: AuditCursorDto,
  ): Promise<AuditCursorPage<AuditLogResponse>> {
    return this.safePage({ userId }, dto.limit, dto.cursor);
  }

  async employeeTimeline(
    employeeId: string,
    dto: AuditCursorDto,
  ): Promise<AuditCursorPage<AuditLogResponse>> {
    return this.safePage(
      { OR: [{ employeeId }, { userId: employeeId }] },
      dto.limit,
      dto.cursor,
    );
  }

  async storeTimeline(
    storeId: string,
    dto: AuditCursorDto,
  ): Promise<AuditCursorPage<AuditLogResponse>> {
    return this.safePage({ storeId }, dto.limit, dto.cursor);
  }

  /**
   * Investigator search. The term is matched against the identifiers someone
   * actually holds — entity id, correlation id, request id — plus a string
   * containment scan of metadata for things like voucher codes.
   */
  async search(dto: AuditSearchDto): Promise<AuditCursorPage<AuditLogResponse>> {
    const term = dto.q.trim();

    const where: Prisma.AuditLogWhereInput = {
      ...(dto.entityType && { entityType: dto.entityType }),
      OR: [
        { entityId: term },
        { correlationId: term },
        { requestId: term },
        { metadata: { path: ['voucherCode'], equals: term } },
        { metadata: { path: ['rewardTitle'], string_contains: term } },
        { metadata: { path: ['storeName'], string_contains: term } },
        { metadata: { path: ['email'], string_contains: term } },
      ],
    };

    return this.safePage(where, dto.limit, dto.cursor);
  }

  private buildWhere(dto: AuditQueryDto): Prisma.AuditLogWhereInput {
    if (dto.fromDate && dto.toDate) {
      if (new Date(dto.toDate) <= new Date(dto.fromDate)) {
        throw new BadRequestException(AUDIT_ERRORS.INVALID_DATE_RANGE);
      }
    }

    return {
      ...(dto.userId && { userId: dto.userId }),
      ...(dto.employeeId && { employeeId: dto.employeeId }),
      ...(dto.storeId && { storeId: dto.storeId }),
      ...(dto.actorType && { actorType: dto.actorType }),
      ...(dto.actorRole && { actorRole: { contains: dto.actorRole } }),
      ...(dto.severity && { severity: dto.severity }),
      ...(dto.entityType && { entityType: dto.entityType }),
      ...(dto.entityId && { entityId: dto.entityId }),
      ...(dto.action && { action: dto.action }),
      ...(dto.eventType && { eventType: dto.eventType }),
      ...((dto.fromDate || dto.toDate) && {
        createdAt: {
          ...(dto.fromDate && { gte: new Date(dto.fromDate) }),
          ...(dto.toDate && { lte: new Date(dto.toDate) }),
        },
      }),
    };
  }

  /** Surfaces a malformed cursor as a 400 rather than a 500. */
  private async safePage(
    where: Prisma.AuditLogWhereInput,
    limit: number,
    cursor?: string,
  ): Promise<AuditCursorPage<AuditLogResponse>> {
    try {
      return await this.repository.findPage(where, limit, cursor);
    } catch (error) {
      if (error instanceof Error && error.message === AUDIT_ERRORS.INVALID_CURSOR) {
        throw new BadRequestException(AUDIT_ERRORS.INVALID_CURSOR);
      }
      throw error;
    }
  }
}
