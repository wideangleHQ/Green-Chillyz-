import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinRuleStatus, CoinRuleType, Prisma } from '@prisma/client';
import { CoinRuleRecord, CoinRuleRepository } from '../repositories';
import { CoinEconomyCacheService } from '../cache';
import {
  CoinRuleQueryDto,
  CreateCoinRuleDto,
  DuplicateCoinRuleDto,
  ReplacePurchaseSlabsDto,
  UpdateCoinRuleDto,
} from '../dto';
import {
  COIN_ECONOMY_DEFAULTS,
  COIN_ECONOMY_ERRORS,
  COIN_ECONOMY_EVENTS,
  COIN_GAME_RULE_TYPES,
  COIN_RULE_HISTORY_ACTIONS,
} from '../constants';
import {
  CoinRuleArchivedEvent,
  CoinRuleCreatedEvent,
  CoinRuleDisabledEvent,
  CoinRuleDuplicatedEvent,
  CoinRuleEnabledEvent,
  CoinRuleRestoredEvent,
  CoinRuleUpdatedEvent,
} from '../events';
import { CoinRuleResponse, PagedResult } from '../interfaces';
import {
  CoinRuleShape,
  resolveOptional,
  toDate,
  validateCoinRuleShape,
} from '../validators';

@Injectable()
export class CoinRuleService {
  private readonly logger = new Logger(CoinRuleService.name);

  constructor(
    private readonly repo: CoinRuleRepository,
    private readonly cache: CoinEconomyCacheService,
    private readonly events: EventEmitter2,
  ) {}

  // ─── Reads ────────────────────────────────────────

  async findAll(query: CoinRuleQueryDto): Promise<PagedResult<CoinRuleResponse>> {
    const where: Prisma.CoinRuleWhereInput = {};
    if (!query.includeArchived) where.deletedAt = null;
    if (query.ruleType) where.ruleType = query.ruleType;
    if (query.status) where.status = query.status;
    if (query.enabled !== undefined) where.enabled = query.enabled;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

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
      items: items.map(toResponse),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<CoinRuleResponse> {
    const cached = await this.cache.getRule<CoinRuleResponse>(id);
    if (cached) return cached;

    const rule = await this.repo.findById(id);
    if (!rule) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    const response = toResponse(rule);
    await this.cache.setRule(id, response);
    return response;
  }

  /** Resolution entry point for the engine: one active rule per rule type. */
  async findActiveByType(ruleType: CoinRuleType): Promise<CoinRuleResponse | null> {
    const cached = await this.cache.getRuleByType<CoinRuleResponse>(ruleType);
    if (cached) return cached;

    const rule = await this.repo.findActiveByType(ruleType);
    if (!rule) return null;

    const response = toResponse(rule);
    await this.cache.setRuleByType(ruleType, response);
    return response;
  }

  async findAllActive(): Promise<CoinRuleResponse[]> {
    const cached = await this.cache.getRules<CoinRuleResponse[]>();
    if (cached) return cached;

    const rules = (await this.repo.findAllActive()).map(toResponse);
    await this.cache.setRules(rules);
    return rules;
  }

  async findActiveGameRules(): Promise<CoinRuleResponse[]> {
    const cached = await this.cache.getGameRules<CoinRuleResponse[]>();
    if (cached) return cached;

    const rules = (await this.repo.findActiveByTypes(COIN_GAME_RULE_TYPES)).map(
      toResponse,
    );
    await this.cache.setGameRules(rules);
    return rules;
  }

  async findHistory(id: string) {
    const rule = await this.repo.findByIdIncludingDeleted(id);
    if (!rule) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);
    return this.repo.findHistory(id);
  }

  async findMetadata(id: string) {
    const rule = await this.repo.findByIdIncludingDeleted(id);
    if (!rule) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);
    return this.repo.findMetadata(id);
  }

  async getPurchaseSlabs(): Promise<PurchaseSlab[]> {
    const rule = await this.findActiveByType(CoinRuleType.PURCHASE_BONUS);
    if (!rule) return [];
    return this.getPurchaseSlabsForRule(rule.id);
  }

  async getPurchaseSlabsForRule(id: string): Promise<PurchaseSlab[]> {
    const metadata = await this.findMetadata(id);
    const entry = metadata.find((item) => item.key === PURCHASE_SLABS_METADATA_KEY);
    return normalizePurchaseSlabs(entry?.value);
  }

  async replacePurchaseSlabs(
    dto: ReplacePurchaseSlabsDto,
    actorId?: string,
  ): Promise<PurchaseSlab[]> {
    const rule = await this.repo.findActiveByType(CoinRuleType.PURCHASE_BONUS);
    if (!rule) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    const slabs = normalizePurchaseSlabs(dto.slabs);
    validatePurchaseSlabs(slabs);

    const before = await this.getPurchaseSlabsForRule(rule.id);
    await this.repo.replaceMetadata(rule.id, {
      [PURCHASE_SLABS_METADATA_KEY]: slabs,
    });
    await this.repo.recordHistory({
      ruleId: rule.id,
      action: 'PURCHASE_SLAB_UPDATED',
      status: rule.status,
      reason: dto.reason ?? null,
      changedBy: actorId ?? null,
      snapshot: { previousValue: before, newValue: slabs } as unknown as Prisma.InputJsonValue,
    });
    await this.cache.invalidateRule(rule.id, rule.ruleType);
    this.events.emit(COIN_ECONOMY_EVENTS.PURCHASE_SLAB_CHANGED, {
      ruleId: rule.id,
      changedBy: actorId ?? null,
      previousValue: before,
      newValue: slabs,
    });
    return slabs;
  }

  async resolvePurchaseCoins(amount: number): Promise<number | null> {
    if (amount < 0) throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_PURCHASE_SLAB);
    const slabs = await this.getPurchaseSlabs();
    const match = slabs
      .filter((slab) => slab.enabled)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find((slab) => amount >= slab.minAmount && amount <= slab.maxAmount);
    return match?.coins ?? null;
  }

  // ─── Writes ───────────────────────────────────────

  async create(
    dto: CreateCoinRuleDto,
    createdBy?: string,
  ): Promise<CoinRuleResponse> {
    const shape: CoinRuleShape = {
      coinAmount: dto.coinAmount,
      minCoins: dto.minCoins ?? null,
      maxCoins: dto.maxCoins ?? null,
      dailyLimit: dto.dailyLimit ?? null,
      weeklyLimit: dto.weeklyLimit ?? null,
      monthlyLimit: dto.monthlyLimit ?? null,
      lifetimeLimit: dto.lifetimeLimit ?? null,
      cooldownSeconds: dto.cooldownSeconds ?? 0,
      effectiveFrom: toDate(dto.effectiveFrom),
      effectiveUntil: toDate(dto.effectiveUntil),
    };
    validateCoinRuleShape(shape);

    const duplicateName = await this.repo.findDuplicateName(dto.name);
    if (duplicateName) {
      throw new ConflictException(COIN_ECONOMY_ERRORS.DUPLICATE_RULE_NAME);
    }

    const status = dto.status ?? CoinRuleStatus.DRAFT;
    if (status === CoinRuleStatus.ACTIVE) {
      await this.assertNoActiveDuplicate(dto.ruleType);
    }

    const rule = await this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      ruleType: dto.ruleType,
      coinAmount: shape.coinAmount,
      minCoins: shape.minCoins,
      maxCoins: shape.maxCoins,
      dailyLimit: shape.dailyLimit,
      weeklyLimit: shape.weeklyLimit,
      monthlyLimit: shape.monthlyLimit,
      lifetimeLimit: shape.lifetimeLimit,
      cooldownSeconds: shape.cooldownSeconds,
      enabled: dto.enabled ?? true,
      priority: dto.priority ?? 0,
      status,
      effectiveFrom: shape.effectiveFrom,
      effectiveUntil: shape.effectiveUntil,
      createdBy: createdBy ?? null,
    });

    if (dto.metadata) {
      const slabs = metadataPurchaseSlabs(dto.metadata);
      if (slabs) validatePurchaseSlabs(slabs);
      await this.repo.replaceMetadata(rule.id, dto.metadata);
    }

    await this.repo.recordHistory({
      ruleId: rule.id,
      action: COIN_RULE_HISTORY_ACTIONS.CREATED,
      status: rule.status,
      changedBy: createdBy ?? null,
      snapshot: toSnapshot(rule) as Prisma.InputJsonValue,
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.RULE_CREATED,
      new CoinRuleCreatedEvent(
        rule.id,
        rule.name,
        rule.ruleType,
        rule.coinAmount,
        createdBy ?? null,
      ),
    );

    await this.cache.invalidateRule(rule.id, rule.ruleType);
    this.logger.log(`Coin rule created: ${rule.name} (${rule.ruleType})`);
    return toResponse(rule);
  }

  async update(
    id: string,
    dto: UpdateCoinRuleDto,
    updatedBy?: string,
  ): Promise<CoinRuleResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    const shape: CoinRuleShape = {
      coinAmount: dto.coinAmount ?? existing.coinAmount,
      minCoins: resolveOptional(dto.minCoins, existing.minCoins),
      maxCoins: resolveOptional(dto.maxCoins, existing.maxCoins),
      dailyLimit: resolveOptional(dto.dailyLimit, existing.dailyLimit),
      weeklyLimit: resolveOptional(dto.weeklyLimit, existing.weeklyLimit),
      monthlyLimit: resolveOptional(dto.monthlyLimit, existing.monthlyLimit),
      lifetimeLimit: resolveOptional(dto.lifetimeLimit, existing.lifetimeLimit),
      cooldownSeconds: dto.cooldownSeconds ?? existing.cooldownSeconds,
      effectiveFrom:
        dto.effectiveFrom === undefined
          ? existing.effectiveFrom
          : toDate(dto.effectiveFrom),
      effectiveUntil:
        dto.effectiveUntil === undefined
          ? existing.effectiveUntil
          : toDate(dto.effectiveUntil),
    };
    validateCoinRuleShape(shape);

    if (dto.name && dto.name !== existing.name) {
      const duplicateName = await this.repo.findDuplicateName(dto.name, existing.id);
      if (duplicateName) {
        throw new ConflictException(COIN_ECONOMY_ERRORS.DUPLICATE_RULE_NAME);
      }
    }

    const targetType = dto.ruleType ?? existing.ruleType;
    const targetStatus = dto.status ?? existing.status;
    const activating =
      targetStatus === CoinRuleStatus.ACTIVE &&
      (existing.status !== CoinRuleStatus.ACTIVE || targetType !== existing.ruleType);

    if (activating) {
      await this.assertNoActiveDuplicate(targetType, existing.id);
    }

    const changedFields = Object.keys(dto).filter((key) => key !== 'metadata');
    const before = toSnapshot(existing);

    const rule = await this.repo.update(existing.id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.ruleType !== undefined && { ruleType: dto.ruleType }),
      coinAmount: shape.coinAmount,
      minCoins: shape.minCoins,
      maxCoins: shape.maxCoins,
      dailyLimit: shape.dailyLimit,
      weeklyLimit: shape.weeklyLimit,
      monthlyLimit: shape.monthlyLimit,
      lifetimeLimit: shape.lifetimeLimit,
      cooldownSeconds: shape.cooldownSeconds,
      ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      effectiveFrom: shape.effectiveFrom,
      effectiveUntil: shape.effectiveUntil,
      updatedBy: updatedBy ?? null,
    });

    if (dto.metadata) {
      const slabs = metadataPurchaseSlabs(dto.metadata);
      if (slabs) validatePurchaseSlabs(slabs);
      await this.repo.replaceMetadata(rule.id, dto.metadata);
    }

    await this.repo.recordHistory({
      ruleId: rule.id,
      action: COIN_RULE_HISTORY_ACTIONS.UPDATED,
      status: rule.status,
      changedBy: updatedBy ?? null,
      snapshot: { before, after: toSnapshot(rule) } as Prisma.InputJsonValue,
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.RULE_UPDATED,
      new CoinRuleUpdatedEvent(
        rule.id,
        rule.ruleType,
        changedFields,
        before,
        toSnapshot(rule),
        updatedBy ?? null,
      ),
    );

    await this.invalidateForTypes(rule.id, existing.ruleType, rule.ruleType);
    return toResponse(rule);
  }

  async setEnabled(
    id: string,
    enabled: boolean,
    actorId?: string,
  ): Promise<CoinRuleResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    // Enabling a DRAFT rule promotes it to ACTIVE, which is the point where
    // the one-active-rule-per-type invariant has to hold.
    const targetStatus =
      enabled && existing.status === CoinRuleStatus.DRAFT
        ? CoinRuleStatus.ACTIVE
        : enabled
          ? existing.status
          : CoinRuleStatus.DISABLED;

    if (enabled && targetStatus === CoinRuleStatus.ACTIVE) {
      await this.assertNoActiveDuplicate(existing.ruleType, existing.id);
    }

    const rule = await this.repo.update(existing.id, {
      enabled,
      status: targetStatus,
      updatedBy: actorId ?? null,
    });

    const action = enabled
      ? COIN_RULE_HISTORY_ACTIONS.ENABLED
      : COIN_RULE_HISTORY_ACTIONS.DISABLED;

    await this.repo.recordHistory({
      ruleId: rule.id,
      action,
      status: rule.status,
      changedBy: actorId ?? null,
      snapshot: toSnapshot(rule) as Prisma.InputJsonValue,
    });

    this.events.emit(
      enabled ? COIN_ECONOMY_EVENTS.RULE_ENABLED : COIN_ECONOMY_EVENTS.RULE_DISABLED,
      enabled
        ? new CoinRuleEnabledEvent(
            rule.id,
            rule.name,
            rule.ruleType,
            actorId ?? null,
          )
        : new CoinRuleDisabledEvent(
            rule.id,
            rule.name,
            rule.ruleType,
            actorId ?? null,
          ),
    );

    await this.cache.invalidateRule(rule.id, rule.ruleType);
    return toResponse(rule);
  }

  async archive(
    id: string,
    actorId?: string,
    reason?: string,
  ): Promise<CoinRuleResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    if (existing.enabled && existing.status === CoinRuleStatus.ACTIVE) {
      throw new BadRequestException(COIN_ECONOMY_ERRORS.CANNOT_ARCHIVE_ENABLED);
    }

    const rule = await this.repo.archiveWithHistory(
      existing.id,
      toSnapshot(existing) as Prisma.InputJsonValue,
      actorId ?? null,
      reason ?? null,
    );

    this.events.emit(
      COIN_ECONOMY_EVENTS.RULE_ARCHIVED,
      new CoinRuleArchivedEvent(rule.id, rule.name, rule.ruleType, actorId ?? null),
    );

    await this.cache.invalidateRule(rule.id, rule.ruleType);
    this.logger.log(`Coin rule archived: ${rule.name}`);
    return toResponse(rule);
  }

  async restore(id: string, actorId?: string): Promise<CoinRuleResponse> {
    const existing = await this.repo.findByIdIncludingDeleted(id);
    if (!existing) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    const rule = await this.repo.restoreWithHistory(
      existing.id,
      toSnapshot(existing) as Prisma.InputJsonValue,
      actorId ?? null,
    );

    this.events.emit(
      COIN_ECONOMY_EVENTS.RULE_RESTORED,
      new CoinRuleRestoredEvent(rule.id, rule.name, rule.ruleType, actorId ?? null),
    );

    await this.cache.invalidateRule(rule.id, rule.ruleType);
    return toResponse(rule);
  }

  async duplicate(
    id: string,
    dto: DuplicateCoinRuleDto,
    actorId?: string,
  ): Promise<CoinRuleResponse> {
    const source = await this.repo.findByIdIncludingDeleted(id);
    if (!source) throw new NotFoundException(COIN_ECONOMY_ERRORS.RULE_NOT_FOUND);

    const name = dto.name?.trim() || `${source.name} (Copy)`;
    const duplicateName = await this.repo.findDuplicateName(name);
    if (duplicateName) {
      throw new ConflictException(COIN_ECONOMY_ERRORS.DUPLICATE_RULE_NAME);
    }

    // Copies start as DRAFT so duplicating never activates a second rule for
    // a type that already has one.
    const copy = await this.repo.create({
      name,
      description: source.description,
      ruleType: dto.ruleType ?? source.ruleType,
      coinAmount: source.coinAmount,
      minCoins: source.minCoins,
      maxCoins: source.maxCoins,
      dailyLimit: source.dailyLimit,
      weeklyLimit: source.weeklyLimit,
      monthlyLimit: source.monthlyLimit,
      lifetimeLimit: source.lifetimeLimit,
      cooldownSeconds: source.cooldownSeconds,
      enabled: false,
      priority: source.priority,
      status: CoinRuleStatus.DRAFT,
      effectiveFrom: source.effectiveFrom,
      effectiveUntil: source.effectiveUntil,
      createdBy: actorId ?? null,
    });

    const sourceMetadata = await this.repo.findMetadata(source.id);
    if (sourceMetadata.length > 0) {
      await this.repo.replaceMetadata(
        copy.id,
        Object.fromEntries(sourceMetadata.map((m) => [m.key, m.value])),
      );
    }

    await this.repo.recordHistory({
      ruleId: copy.id,
      action: COIN_RULE_HISTORY_ACTIONS.DUPLICATED,
      status: copy.status,
      changedBy: actorId ?? null,
      snapshot: { sourceRuleId: source.id, ...toSnapshot(copy) },
    });

    this.events.emit(
      COIN_ECONOMY_EVENTS.RULE_DUPLICATED,
      new CoinRuleDuplicatedEvent(
        source.id,
        copy.id,
        copy.ruleType,
        actorId ?? null,
      ),
    );

    await this.cache.invalidateRule(copy.id, copy.ruleType);
    return toResponse(copy);
  }

  // ─── Internals ────────────────────────────────────

  private async assertNoActiveDuplicate(
    ruleType: CoinRuleType,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.repo.findDuplicateActiveType(ruleType, excludeId);
    if (duplicate) {
      throw new ConflictException(COIN_ECONOMY_ERRORS.DUPLICATE_RULE_TYPE);
    }
  }

  private async invalidateForTypes(
    ruleId: string,
    previousType: CoinRuleType,
    nextType: CoinRuleType,
  ): Promise<void> {
    await this.cache.invalidateRule(ruleId, nextType);
    if (previousType !== nextType) {
      await this.cache.invalidateRule(ruleId, previousType);
    }
  }
}

export function toResponse(rule: CoinRuleRecord): CoinRuleResponse {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    ruleType: rule.ruleType,
    coinAmount: rule.coinAmount,
    minCoins: rule.minCoins,
    maxCoins: rule.maxCoins,
    dailyLimit: rule.dailyLimit,
    weeklyLimit: rule.weeklyLimit,
    monthlyLimit: rule.monthlyLimit,
    lifetimeLimit: rule.lifetimeLimit,
    cooldownSeconds: rule.cooldownSeconds,
    enabled: rule.enabled,
    priority: rule.priority,
    status: rule.status,
    effectiveFrom: rule.effectiveFrom,
    effectiveUntil: rule.effectiveUntil,
    createdBy: rule.createdBy,
    updatedBy: rule.updatedBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    archivedAt: rule.archivedAt,
  };
}

function toSnapshot(rule: CoinRuleRecord): Record<string, unknown> {
  return {
    name: rule.name,
    ruleType: rule.ruleType,
    coinAmount: rule.coinAmount,
    minCoins: rule.minCoins,
    maxCoins: rule.maxCoins,
    dailyLimit: rule.dailyLimit,
    weeklyLimit: rule.weeklyLimit,
    monthlyLimit: rule.monthlyLimit,
    lifetimeLimit: rule.lifetimeLimit,
    cooldownSeconds: rule.cooldownSeconds,
    enabled: rule.enabled,
    priority: rule.priority,
    status: rule.status,
    effectiveFrom: rule.effectiveFrom?.toISOString() ?? null,
    effectiveUntil: rule.effectiveUntil?.toISOString() ?? null,
  };
}

const PURCHASE_SLABS_METADATA_KEY = 'purchaseSlabs';

export interface PurchaseSlab {
  minAmount: number;
  maxAmount: number;
  coins: number;
  enabled: boolean;
  sortOrder: number;
}

function normalizePurchaseSlabs(value: unknown): PurchaseSlab[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw, index) => {
    const slab = raw as Record<string, unknown>;
    return {
      minAmount: Number(slab.minAmount),
      maxAmount:
        slab.maxAmount === null || slab.maxAmount === undefined
          ? Number.MAX_SAFE_INTEGER
          : Number(slab.maxAmount),
      coins: Number(slab.coins),
      enabled: slab.enabled === undefined ? true : Boolean(slab.enabled),
      sortOrder:
        slab.sortOrder === undefined || slab.sortOrder === null
          ? index
          : Number(slab.sortOrder),
    };
  });
}

function metadataPurchaseSlabs(
  metadata: Record<string, unknown>,
): PurchaseSlab[] | null {
  if (!(PURCHASE_SLABS_METADATA_KEY in metadata)) return null;
  return normalizePurchaseSlabs(metadata[PURCHASE_SLABS_METADATA_KEY]);
}

function validatePurchaseSlabs(slabs: PurchaseSlab[]): void {
  const normalized = slabs
    .filter((slab) => slab.enabled)
    .sort((a, b) => a.minAmount - b.minAmount || a.sortOrder - b.sortOrder);

  for (const slab of normalized) {
    const numbers = [slab.minAmount, slab.maxAmount, slab.coins, slab.sortOrder];
    if (
      numbers.some((value) => !Number.isFinite(value) || value < 0) ||
      slab.maxAmount < slab.minAmount
    ) {
      throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_PURCHASE_SLAB);
    }
  }

  for (let index = 1; index < normalized.length; index++) {
    if (normalized[index].minAmount <= normalized[index - 1].maxAmount) {
      throw new BadRequestException(COIN_ECONOMY_ERRORS.OVERLAPPING_PURCHASE_SLABS);
    }
  }
}
