import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinMultiplierStatus, CoinRuleType, Prisma } from '@prisma/client';
import { CoinMultiplierRecord, CoinMultiplierRepository } from '../repositories';
import { CoinEconomyCacheService } from '../cache';
import {
  CoinMultiplierQueryDto,
  CreateCoinMultiplierDto,
  UpdateCoinMultiplierDto,
} from '../dto';
import {
  COIN_ECONOMY_DEFAULTS,
  COIN_ECONOMY_ERRORS,
  COIN_ECONOMY_EVENTS,
} from '../constants';
import { CoinMultiplierChangedEvent } from '../events';
import {
  AppliedMultiplier,
  CoinMultiplierResponse,
  PagedResult,
} from '../interfaces';
import {
  resolveOptional,
  toDate,
  validateDateRange,
  validateDaysOfWeek,
  validateMultiplierValue,
} from '../validators';
import { isEffective } from './coin-limit.service';

@Injectable()
export class CoinMultiplierService {
  private readonly logger = new Logger(CoinMultiplierService.name);

  constructor(
    private readonly repo: CoinMultiplierRepository,
    private readonly cache: CoinEconomyCacheService,
    private readonly events: EventEmitter2,
  ) {}

  // ─── Multiplier engine ────────────────────────────

  /**
   * The multipliers that actually apply to one grant, after date and
   * day-of-week filtering. The Campaign Engine will contribute here later;
   * campaignReference rows are deliberately skipped until it lands.
   */
  async resolve(
    ruleId: string,
    ruleType: CoinRuleType,
    storeId: string | null,
    now: Date,
  ): Promise<Array<AppliedMultiplier & { stackable: boolean; priority: number }>> {
    const candidates = await this.getCandidates(ruleId, ruleType, storeId);
    const dayOfWeek = now.getDay();

    return candidates
      .filter((candidate) => candidate.campaignReference === null)
      .filter((candidate) =>
        isEffective(candidate.effectiveFrom, candidate.effectiveUntil, now),
      )
      .filter(
        (candidate) =>
          candidate.daysOfWeek.length === 0 ||
          candidate.daysOfWeek.includes(dayOfWeek),
      )
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        type: candidate.type,
        multiplier: Number(candidate.multiplier),
        stackable: candidate.stackable,
        priority: candidate.priority,
      }))
      .sort((a, b) => b.priority - a.priority || b.multiplier - a.multiplier);
  }

  private async getCandidates(
    ruleId: string,
    ruleType: CoinRuleType,
    storeId: string | null,
  ): Promise<CoinMultiplierRecord[]> {
    const scopeKey = `${ruleId}:${ruleType}:${storeId ?? 'any'}`;
    const cached = await this.cache.getMultipliers<CoinMultiplierRecord[]>(scopeKey);
    if (cached) return cached.map(reviveDates);

    const candidates = await this.repo.findCandidates(ruleId, ruleType, storeId);
    await this.cache.setMultipliers(scopeKey, candidates);
    return candidates;
  }

  // ─── CRUD ─────────────────────────────────────────

  async findAll(
    query: CoinMultiplierQueryDto,
  ): Promise<PagedResult<CoinMultiplierResponse>> {
    const where: Prisma.CoinMultiplierWhereInput = {};
    if (query.ruleId) where.ruleId = query.ruleId;
    if (query.ruleType) where.ruleType = query.ruleType;
    if (query.storeId) where.storeId = query.storeId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.enabled !== undefined) where.enabled = query.enabled;

    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? COIN_ECONOMY_DEFAULTS.PAGE_SIZE,
      COIN_ECONOMY_DEFAULTS.MAX_PAGE_SIZE,
    );

    const [items, total] = await this.repo.findMany(
      where,
      (page - 1) * pageSize,
      pageSize,
    );

    return {
      items: items.map(toMultiplierResponse),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<CoinMultiplierResponse> {
    const multiplier = await this.repo.findById(id);
    if (!multiplier) {
      throw new NotFoundException(COIN_ECONOMY_ERRORS.MULTIPLIER_NOT_FOUND);
    }
    return toMultiplierResponse(multiplier);
  }

  async create(
    dto: CreateCoinMultiplierDto,
    createdBy?: string,
  ): Promise<CoinMultiplierResponse> {
    validateMultiplierValue(dto.multiplier);
    validateDaysOfWeek(dto.daysOfWeek);

    const effectiveFrom = toDate(dto.effectiveFrom);
    const effectiveUntil = toDate(dto.effectiveUntil);
    validateDateRange(effectiveFrom, effectiveUntil);

    const multiplier = await this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type ?? 'FLAT',
      multiplier: new Prisma.Decimal(dto.multiplier),
      ...(dto.ruleId ? { rule: { connect: { id: dto.ruleId } } } : {}),
      ruleType: dto.ruleType ?? null,
      storeId: dto.storeId ?? null,
      campaignReference: dto.campaignReference ?? null,
      daysOfWeek: dto.daysOfWeek ?? [],
      stackable: dto.stackable ?? false,
      priority: dto.priority ?? 0,
      enabled: dto.enabled ?? true,
      status: dto.status ?? CoinMultiplierStatus.DRAFT,
      effectiveFrom,
      effectiveUntil,
      createdBy: createdBy ?? null,
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
      new CoinMultiplierChangedEvent(
        multiplier.id,
        multiplier.name,
        'CREATED',
        null,
        Number(multiplier.multiplier),
        createdBy ?? null,
      ),
    );

    await this.cache.invalidateMultipliers();
    this.logger.log(
      `Coin multiplier created: ${multiplier.name} x${Number(multiplier.multiplier)}`,
    );
    return toMultiplierResponse(multiplier);
  }

  async update(
    id: string,
    dto: UpdateCoinMultiplierDto,
    updatedBy?: string,
  ): Promise<CoinMultiplierResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(COIN_ECONOMY_ERRORS.MULTIPLIER_NOT_FOUND);
    }

    if (dto.multiplier !== undefined) validateMultiplierValue(dto.multiplier);
    validateDaysOfWeek(dto.daysOfWeek);

    const effectiveFrom =
      dto.effectiveFrom === undefined
        ? existing.effectiveFrom
        : toDate(dto.effectiveFrom);
    const effectiveUntil =
      dto.effectiveUntil === undefined
        ? existing.effectiveUntil
        : toDate(dto.effectiveUntil);
    validateDateRange(effectiveFrom, effectiveUntil);

    const multiplier = await this.repo.update(existing.id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.multiplier !== undefined && {
        multiplier: new Prisma.Decimal(dto.multiplier),
      }),
      ...(dto.ruleId !== undefined && { rule: { connect: { id: dto.ruleId } } }),
      ruleType: resolveOptional(dto.ruleType, existing.ruleType),
      storeId: resolveOptional(dto.storeId, existing.storeId),
      campaignReference: resolveOptional(
        dto.campaignReference,
        existing.campaignReference,
      ),
      ...(dto.daysOfWeek !== undefined && { daysOfWeek: dto.daysOfWeek }),
      ...(dto.stackable !== undefined && { stackable: dto.stackable }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      ...(dto.status !== undefined && { status: dto.status }),
      effectiveFrom,
      effectiveUntil,
      updatedBy: updatedBy ?? null,
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
      new CoinMultiplierChangedEvent(
        multiplier.id,
        multiplier.name,
        'UPDATED',
        Number(existing.multiplier),
        Number(multiplier.multiplier),
        updatedBy ?? null,
      ),
    );

    await this.cache.invalidateMultipliers();
    return toMultiplierResponse(multiplier);
  }

  async archive(id: string, actorId?: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(COIN_ECONOMY_ERRORS.MULTIPLIER_NOT_FOUND);
    }

    await this.repo.softDelete(existing.id, actorId ?? null);

    this.events.emit(
      COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
      new CoinMultiplierChangedEvent(
        existing.id,
        existing.name,
        'ARCHIVED',
        Number(existing.multiplier),
        null,
        actorId ?? null,
      ),
    );

    await this.cache.invalidateMultipliers();
  }

  async restore(id: string, actorId?: string): Promise<CoinMultiplierResponse> {
    const multiplier = await this.repo.restore(id, actorId ?? null);

    this.events.emit(
      COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
      new CoinMultiplierChangedEvent(
        multiplier.id,
        multiplier.name,
        'RESTORED',
        null,
        Number(multiplier.multiplier),
        actorId ?? null,
      ),
    );

    await this.cache.invalidateMultipliers();
    return toMultiplierResponse(multiplier);
  }
}

export function toMultiplierResponse(
  multiplier: CoinMultiplierRecord,
): CoinMultiplierResponse {
  return {
    id: multiplier.id,
    name: multiplier.name,
    description: multiplier.description,
    type: multiplier.type,
    multiplier: Number(multiplier.multiplier),
    ruleId: multiplier.ruleId,
    ruleType: multiplier.ruleType,
    storeId: multiplier.storeId,
    campaignReference: multiplier.campaignReference,
    daysOfWeek: multiplier.daysOfWeek,
    stackable: multiplier.stackable,
    priority: multiplier.priority,
    enabled: multiplier.enabled,
    status: multiplier.status,
    effectiveFrom: multiplier.effectiveFrom,
    effectiveUntil: multiplier.effectiveUntil,
    createdAt: multiplier.createdAt,
    updatedAt: multiplier.updatedAt,
  };
}

/** Cached rows come back as ISO strings; effectiveness compares Dates. */
function reviveDates(record: CoinMultiplierRecord): CoinMultiplierRecord {
  return {
    ...record,
    effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
    effectiveUntil: record.effectiveUntil ? new Date(record.effectiveUntil) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}
