import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinLimitScope, Prisma } from '@prisma/client';
import {
  CoinLimitRecord,
  CoinLimitRepository,
  CoinRuleRepository,
  CoinUsageRepository,
  UsageWindow,
} from '../repositories';
import { CoinEconomyCacheService } from '../cache';
import { CoinLimitQueryDto, CreateCoinLimitDto, UpdateCoinLimitDto } from '../dto';
import {
  COIN_ECONOMY_DEFAULTS,
  COIN_ECONOMY_ERRORS,
  COIN_ECONOMY_EVENTS,
  COIN_ECONOMY_REJECTIONS,
} from '../constants';
import { CoinLimitChangedEvent } from '../events';
import {
  CoinEarnContext,
  CoinLimitResponse,
  CoinRuleResponse,
  LimitEvaluation,
  PagedResult,
} from '../interfaces';
import {
  CoinLimitShape,
  resolveOptional,
  toDate,
  validateCoinLimitShape,
} from '../validators';

/** Outcome of evaluating every limit that binds one prospective grant. */
export interface LimitCheckResult {
  blocked: boolean;
  reason: string | null;
  /** Tightest remaining coin headroom; null when nothing caps coins. */
  remainingCoins: number | null;
  evaluations: LimitEvaluation[];
  /** The evaluation that blocked, for the CoinLimitReached event. */
  blockingEvaluation: LimitEvaluation | null;
}

const SCOPE_REJECTION: Record<string, string> = {
  DAILY: COIN_ECONOMY_REJECTIONS.DAILY_LIMIT,
  WEEKLY: COIN_ECONOMY_REJECTIONS.WEEKLY_LIMIT,
  MONTHLY: COIN_ECONOMY_REJECTIONS.MONTHLY_LIMIT,
  LIFETIME: COIN_ECONOMY_REJECTIONS.LIFETIME_LIMIT,
};

@Injectable()
export class CoinLimitService {
  private readonly logger = new Logger(CoinLimitService.name);

  constructor(
    private readonly repo: CoinLimitRepository,
    private readonly ruleRepo: CoinRuleRepository,
    private readonly usageRepo: CoinUsageRepository,
    private readonly cache: CoinEconomyCacheService,
    private readonly events: EventEmitter2,
  ) {}

  // ─── Limit engine ─────────────────────────────────

  /**
   * Evaluates the rule's own ladder plus every configured CoinLimit in one
   * pass. All windows are counted by a single usage lookup, so adding scopes
   * never adds queries per scope.
   */
  async check(
    rule: CoinRuleResponse,
    context: CoinEarnContext,
    now: Date,
  ): Promise<LimitCheckResult> {
    const configured = await this.getApplicableLimits(rule.id);
    const activeLimits = configured.filter((limit) =>
      isEffective(limit.effectiveFrom, limit.effectiveUntil, now),
    );

    const windows = this.buildWindows(rule, activeLimits, context, now);
    const usage =
      windows.length > 0
        ? await this.usageRepo.getUsage(context.userId, rule.id, windows)
        : new Map();

    const evaluations: LimitEvaluation[] = [];

    for (const ladder of this.ruleLadder(rule)) {
      const used = usage.get(ladder.key) ?? { coins: 0, claims: 0 };
      evaluations.push({
        scope: ladder.scope,
        limitId: null,
        maxCoins: ladder.maxCoins,
        maxClaims: null,
        usedCoins: used.coins,
        usedClaims: used.claims,
        remainingCoins: Math.max(0, ladder.maxCoins - used.coins),
        blocked: used.coins >= ladder.maxCoins,
        reason: used.coins >= ladder.maxCoins ? SCOPE_REJECTION[ladder.scope] : null,
      });
    }

    for (const limit of activeLimits) {
      const used = usage.get(limitKey(limit)) ?? { coins: 0, claims: 0 };
      const coinsBlocked = limit.maxCoins !== null && used.coins >= limit.maxCoins;
      const claimsBlocked = limit.maxClaims !== null && used.claims >= limit.maxClaims;

      evaluations.push({
        scope: limit.scope,
        limitId: limit.id,
        maxCoins: limit.maxCoins,
        maxClaims: limit.maxClaims,
        usedCoins: used.coins,
        usedClaims: used.claims,
        remainingCoins:
          limit.maxCoins === null ? null : Math.max(0, limit.maxCoins - used.coins),
        blocked: coinsBlocked || claimsBlocked,
        reason:
          coinsBlocked || claimsBlocked ? COIN_ECONOMY_REJECTIONS.CUSTOM_LIMIT : null,
      });
    }

    const blocking = evaluations.find((evaluation) => evaluation.blocked) ?? null;
    const remainingCoins = evaluations.reduce<number | null>((tightest, item) => {
      if (item.remainingCoins === null) return tightest;
      return tightest === null
        ? item.remainingCoins
        : Math.min(tightest, item.remainingCoins);
    }, null);

    return {
      blocked: blocking !== null,
      reason: blocking?.reason ?? null,
      remainingCoins,
      evaluations,
      blockingEvaluation: blocking,
    };
  }

  /** Per-window usage for the customer-facing "daily limits" endpoint. */
  async describeUsage(rule: CoinRuleResponse, userId: string, now: Date) {
    const windows: UsageWindow[] = [
      { key: 'DAILY', since: startOfDay(now) },
      { key: 'WEEKLY', since: startOfWeek(now) },
      { key: 'MONTHLY', since: startOfMonth(now) },
      { key: 'LIFETIME', since: null },
    ];
    const usage = await this.usageRepo.getUsage(userId, rule.id, windows);
    return {
      usedToday: usage.get('DAILY')?.coins ?? 0,
      usedThisWeek: usage.get('WEEKLY')?.coins ?? 0,
      usedThisMonth: usage.get('MONTHLY')?.coins ?? 0,
      usedLifetime: usage.get('LIFETIME')?.coins ?? 0,
    };
  }

  private ruleLadder(rule: CoinRuleResponse) {
    const ladder: Array<{
      key: string;
      scope: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'LIFETIME';
      maxCoins: number;
    }> = [];
    if (rule.dailyLimit !== null) {
      ladder.push({ key: 'DAILY', scope: 'DAILY', maxCoins: rule.dailyLimit });
    }
    if (rule.weeklyLimit !== null) {
      ladder.push({ key: 'WEEKLY', scope: 'WEEKLY', maxCoins: rule.weeklyLimit });
    }
    if (rule.monthlyLimit !== null) {
      ladder.push({ key: 'MONTHLY', scope: 'MONTHLY', maxCoins: rule.monthlyLimit });
    }
    if (rule.lifetimeLimit !== null) {
      ladder.push({ key: 'LIFETIME', scope: 'LIFETIME', maxCoins: rule.lifetimeLimit });
    }
    return ladder;
  }

  private buildWindows(
    rule: CoinRuleResponse,
    limits: CoinLimitRecord[],
    context: CoinEarnContext,
    now: Date,
  ): UsageWindow[] {
    const windows: UsageWindow[] = [];

    for (const ladder of this.ruleLadder(rule)) {
      windows.push({ key: ladder.key, since: windowStart(ladder.scope, now, null) });
    }

    for (const limit of limits) {
      windows.push({
        key: limitKey(limit),
        since: windowStart(limit.scope, now, limit.windowSeconds),
        storeId:
          limit.scope === CoinLimitScope.PER_STORE
            ? (limit.storeId ?? context.storeId ?? null)
            : null,
        deviceId:
          limit.scope === CoinLimitScope.PER_DEVICE ? (context.deviceId ?? null) : null,
      });
    }

    return windows;
  }

  private async getApplicableLimits(ruleId: string): Promise<CoinLimitRecord[]> {
    const cached = await this.cache.getLimits<CoinLimitRecord[]>(ruleId);
    if (cached) return cached.map(reviveDates);

    const limits = await this.repo.findApplicable(ruleId);
    await this.cache.setLimits(ruleId, limits);
    return limits;
  }

  // ─── CRUD ─────────────────────────────────────────

  async findAll(query: CoinLimitQueryDto): Promise<PagedResult<CoinLimitResponse>> {
    const where: Prisma.CoinLimitWhereInput = {};
    if (query.ruleId) where.ruleId = query.ruleId;
    if (query.scope) where.scope = query.scope;
    if (query.storeId) where.storeId = query.storeId;
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
      items: items.map(toLimitResponse),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<CoinLimitResponse> {
    const limit = await this.repo.findById(id);
    if (!limit) throw new NotFoundException(COIN_ECONOMY_ERRORS.LIMIT_NOT_FOUND);
    return toLimitResponse(limit);
  }

  async create(
    dto: CreateCoinLimitDto,
    createdBy?: string,
  ): Promise<CoinLimitResponse> {
    const shape: CoinLimitShape = {
      scope: dto.scope,
      maxCoins: dto.maxCoins ?? null,
      maxClaims: dto.maxClaims ?? null,
      windowSeconds: dto.windowSeconds ?? null,
      effectiveFrom: toDate(dto.effectiveFrom),
      effectiveUntil: toDate(dto.effectiveUntil),
    };
    validateCoinLimitShape(shape);

    if (dto.ruleId) {
      const rule = await this.ruleRepo.findById(dto.ruleId);
      if (!rule) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);
      await this.assertLimitFitsRule(rule.dailyLimit, dto.scope, shape.maxCoins);
    }

    const duplicate = await this.repo.findDuplicateScope(
      dto.ruleId ?? null,
      dto.scope,
      dto.storeId ?? null,
    );
    if (duplicate) {
      throw new ConflictException(COIN_ECONOMY_ERRORS.DUPLICATE_LIMIT_SCOPE);
    }

    const limit = await this.repo.create({
      ...(dto.ruleId ? { rule: { connect: { id: dto.ruleId } } } : {}),
      name: dto.name,
      description: dto.description ?? null,
      scope: dto.scope,
      maxCoins: shape.maxCoins,
      maxClaims: shape.maxClaims,
      windowSeconds: shape.windowSeconds,
      storeId: dto.storeId ?? null,
      enabled: dto.enabled ?? true,
      priority: dto.priority ?? 0,
      effectiveFrom: shape.effectiveFrom,
      effectiveUntil: shape.effectiveUntil,
      createdBy: createdBy ?? null,
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
      new CoinLimitChangedEvent(
        limit.id,
        limit.name,
        limit.scope,
        'CREATED',
        limit.ruleId,
        createdBy ?? null,
      ),
    );

    await this.cache.invalidateLimits(limit.ruleId);
    this.logger.log(`Coin limit created: ${limit.name} (${limit.scope})`);
    return toLimitResponse(limit);
  }

  async update(
    id: string,
    dto: UpdateCoinLimitDto,
    updatedBy?: string,
  ): Promise<CoinLimitResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(COIN_ECONOMY_ERRORS.LIMIT_NOT_FOUND);

    const shape: CoinLimitShape = {
      scope: dto.scope ?? existing.scope,
      maxCoins: resolveOptional(dto.maxCoins, existing.maxCoins),
      maxClaims: resolveOptional(dto.maxClaims, existing.maxClaims),
      windowSeconds: resolveOptional(dto.windowSeconds, existing.windowSeconds),
      effectiveFrom:
        dto.effectiveFrom === undefined
          ? existing.effectiveFrom
          : toDate(dto.effectiveFrom),
      effectiveUntil:
        dto.effectiveUntil === undefined
          ? existing.effectiveUntil
          : toDate(dto.effectiveUntil),
    };
    validateCoinLimitShape(shape);

    if (existing.ruleId) {
      const rule = await this.ruleRepo.findById(existing.ruleId);
      if (rule) {
        await this.assertLimitFitsRule(rule.dailyLimit, shape.scope, shape.maxCoins);
      }
    }

    const storeId = resolveOptional(dto.storeId, existing.storeId);
    if (shape.scope !== existing.scope || storeId !== existing.storeId) {
      const duplicate = await this.repo.findDuplicateScope(
        existing.ruleId,
        shape.scope,
        storeId,
        existing.id,
      );
      if (duplicate) {
        throw new ConflictException(COIN_ECONOMY_ERRORS.DUPLICATE_LIMIT_SCOPE);
      }
    }

    const limit = await this.repo.update(existing.id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      scope: shape.scope,
      maxCoins: shape.maxCoins,
      maxClaims: shape.maxClaims,
      windowSeconds: shape.windowSeconds,
      storeId,
      ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      effectiveFrom: shape.effectiveFrom,
      effectiveUntil: shape.effectiveUntil,
      updatedBy: updatedBy ?? null,
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
      new CoinLimitChangedEvent(
        limit.id,
        limit.name,
        limit.scope,
        'UPDATED',
        limit.ruleId,
        updatedBy ?? null,
      ),
    );

    await this.cache.invalidateLimits(limit.ruleId);
    return toLimitResponse(limit);
  }

  async archive(id: string, actorId?: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(COIN_ECONOMY_ERRORS.LIMIT_NOT_FOUND);

    await this.repo.softDelete(existing.id, actorId ?? null);

    this.events.emit(
      COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
      new CoinLimitChangedEvent(
        existing.id,
        existing.name,
        existing.scope,
        'ARCHIVED',
        existing.ruleId,
        actorId ?? null,
      ),
    );

    await this.cache.invalidateLimits(existing.ruleId);
  }

  async restore(id: string, actorId?: string): Promise<CoinLimitResponse> {
    const limit = await this.repo.restore(id, actorId ?? null);

    this.events.emit(
      COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
      new CoinLimitChangedEvent(
        limit.id,
        limit.name,
        limit.scope,
        'RESTORED',
        limit.ruleId,
        actorId ?? null,
      ),
    );

    await this.cache.invalidateLimits(limit.ruleId);
    return toLimitResponse(limit);
  }

  /** A per-day limit above the rule's own daily cap can never bind. */
  private async assertLimitFitsRule(
    ruleDailyLimit: number | null,
    scope: CoinLimitScope,
    maxCoins: number | null,
  ): Promise<void> {
    if (
      scope === CoinLimitScope.PER_DAY &&
      ruleDailyLimit !== null &&
      maxCoins !== null &&
      maxCoins > ruleDailyLimit
    ) {
      throw new ConflictException(COIN_ECONOMY_ERRORS.LIMIT_OVERFLOW);
    }
  }
}

export function toLimitResponse(limit: CoinLimitRecord): CoinLimitResponse {
  return {
    id: limit.id,
    ruleId: limit.ruleId,
    name: limit.name,
    description: limit.description,
    scope: limit.scope,
    maxCoins: limit.maxCoins,
    maxClaims: limit.maxClaims,
    windowSeconds: limit.windowSeconds,
    storeId: limit.storeId,
    enabled: limit.enabled,
    priority: limit.priority,
    effectiveFrom: limit.effectiveFrom,
    effectiveUntil: limit.effectiveUntil,
    createdAt: limit.createdAt,
    updatedAt: limit.updatedAt,
  };
}

function limitKey(limit: CoinLimitRecord): string {
  return `limit:${limit.id}`;
}

/** Cached rows come back as ISO strings; the engine compares Dates. */
function reviveDates(limit: CoinLimitRecord): CoinLimitRecord {
  return {
    ...limit,
    effectiveFrom: limit.effectiveFrom ? new Date(limit.effectiveFrom) : null,
    effectiveUntil: limit.effectiveUntil ? new Date(limit.effectiveUntil) : null,
    createdAt: new Date(limit.createdAt),
    updatedAt: new Date(limit.updatedAt),
  };
}

export function isEffective(
  from: Date | null,
  until: Date | null,
  now: Date,
): boolean {
  if (from && now < from) return false;
  if (until && now > until) return false;
  return true;
}

export function windowStart(
  scope: CoinLimitScope | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'LIFETIME',
  now: Date,
  windowSeconds: number | null,
): Date | null {
  if (windowSeconds) {
    return new Date(now.getTime() - windowSeconds * 1000);
  }

  switch (scope) {
    case 'DAILY':
    case CoinLimitScope.PER_DAY:
      return startOfDay(now);
    case 'WEEKLY':
    case CoinLimitScope.PER_WEEK:
      return startOfWeek(now);
    case 'MONTHLY':
    case CoinLimitScope.PER_MONTH:
      return startOfMonth(now);
    case CoinLimitScope.PER_YEAR:
      return startOfYear(now);
    case 'LIFETIME':
    case CoinLimitScope.LIFETIME:
    case CoinLimitScope.PER_STORE:
    case CoinLimitScope.PER_DEVICE:
    case CoinLimitScope.PER_CUSTOMER:
    default:
      return null;
  }
}

export function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function startOfWeek(now: Date): Date {
  const day = startOfDay(now);
  day.setDate(day.getDate() - day.getDay());
  return day;
}

export function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function startOfYear(now: Date): Date {
  return new Date(now.getFullYear(), 0, 1);
}
