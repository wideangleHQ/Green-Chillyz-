import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { RewardOverridesRepository } from '../repositories';
import { RewardOverridesCacheService } from '../cache';
import { RewardAssignmentRepository } from '../../reward-assignment/repositories';
import { RewardRulesRepository } from '../../reward-rules/repositories';
import {
  CreateRewardOverrideDto,
  UpdateRewardOverrideDto,
  RewardOverrideQueryDto,
} from '../dto';
import {
  REWARD_OVERRIDE_ERRORS,
  REWARD_OVERRIDE_DEFAULTS,
  REWARD_OVERRIDE_EVENTS,
} from '../constants';
import {
  RewardOverrideCreatedEvent,
  RewardOverrideUpdatedEvent,
  RewardOverrideArchivedEvent,
  RewardOverrideDeletedEvent,
  RewardOverrideRestoredEvent,
} from '../events';
import { ResolvedReward } from '../interfaces';

@Injectable()
export class RewardOverridesService {
  private readonly logger = new Logger(RewardOverridesService.name);

  constructor(
    private readonly repo: RewardOverridesRepository,
    private readonly cache: RewardOverridesCacheService,
    private readonly assignmentRepo: RewardAssignmentRepository,
    private readonly rulesRepo: RewardRulesRepository,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: RewardOverrideQueryDto) {
    const where: Prisma.RewardOverrideWhereInput = {};
    if (query.storeId) where.storeId = query.storeId;
    if (query.ruleId) where.ruleId = query.ruleId;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? REWARD_OVERRIDE_DEFAULTS.PAGE_SIZE,
      REWARD_OVERRIDE_DEFAULTS.MAX_PAGE_SIZE,
    );
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.repo.findMany(where, skip, pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    const cached = await this.cache.getItem(id);
    if (cached) return cached;

    const override = await this.repo.findById(id);
    if (!override) throw new NotFoundException(REWARD_OVERRIDE_ERRORS.NOT_FOUND);

    await this.cache.setItem(id, override);
    return override;
  }

  async findByStore(storeId: string) {
    const cached = await this.cache.getStoreOverrides(storeId);
    if (cached) return cached;

    const overrides = await this.repo.findActiveByStore(storeId);

    await this.cache.setStoreOverrides(storeId, overrides);
    return overrides;
  }

  async create(dto: CreateRewardOverrideDto, createdBy?: string) {
    const storeExists = await this.repo.storeExists(dto.storeId);
    if (!storeExists) throw new NotFoundException(REWARD_OVERRIDE_ERRORS.STORE_NOT_FOUND);

    const rule = await this.repo.ruleExists(dto.ruleId);
    if (!rule) throw new NotFoundException(REWARD_OVERRIDE_ERRORS.RULE_NOT_FOUND);

    if (rule.status === 'ARCHIVED') {
      throw new BadRequestException(REWARD_OVERRIDE_ERRORS.RULE_ARCHIVED);
    }

    const assignment = await this.assignmentRepo.findActiveByStore(dto.storeId);
    if (!assignment) {
      throw new BadRequestException(REWARD_OVERRIDE_ERRORS.NO_ASSIGNMENT);
    }

    if (rule.profileId !== assignment.profileId) {
      throw new BadRequestException(
        'Cannot override a rule that does not belong to the assigned reward profile',
      );
    }

    const existing = await this.repo.findActiveByStoreAndRule(dto.storeId, dto.ruleId);
    if (existing) {
      throw new ConflictException(REWARD_OVERRIDE_ERRORS.DUPLICATE_OVERRIDE);
    }

    if (dto.effectiveFrom && dto.effectiveUntil &&
        new Date(dto.effectiveFrom) >= new Date(dto.effectiveUntil)) {
      throw new BadRequestException(REWARD_OVERRIDE_ERRORS.INVALID_DATE_RANGE);
    }

    if (dto.overrideCoinReq !== undefined) {
      const dupCoin = await this.repo.findDuplicateCoinMilestone(
        dto.storeId,
        dto.overrideCoinReq,
      );
      if (dupCoin) {
        throw new ConflictException(REWARD_OVERRIDE_ERRORS.DUPLICATE_COIN_MILESTONE);
      }
    }

    const override = await this.repo.create({
      store: { connect: { id: dto.storeId } },
      rule: { connect: { id: dto.ruleId } },
      overrideRewardType: dto.overrideRewardType,
      overrideRewardRef: dto.overrideRewardRef ?? null,
      overrideCoinReq: dto.overrideCoinReq ?? null,
      overrideDisplayOrder: dto.overrideDisplayOrder ?? null,
      overridePriority: dto.overridePriority ?? null,
      status: 'ACTIVE',
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      reason: dto.reason,
      createdBy: createdBy ?? null,
    });

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(override.id, key, value);
      }
    }

    await this.repo.createHistory({
      overrideId: override.id,
      storeId: dto.storeId,
      ruleId: dto.ruleId,
      status: 'ACTIVE',
      action: 'CREATED',
      reason: dto.reason,
      changedBy: createdBy ?? null,
      snapshot: {
        overrideRewardType: dto.overrideRewardType,
        overrideRewardRef: dto.overrideRewardRef,
        overrideCoinReq: dto.overrideCoinReq,
        originalRuleName: rule.name,
      },
    });

    this.events.emit(
      REWARD_OVERRIDE_EVENTS.CREATED,
      new RewardOverrideCreatedEvent(override.id, dto.storeId, dto.ruleId, createdBy ?? null),
    );

    await this.cache.invalidateOverride(override.id, dto.storeId);
    return override;
  }

  async update(id: string, dto: UpdateRewardOverrideDto, updatedBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_OVERRIDE_ERRORS.NOT_FOUND);

    if (dto.overrideCoinReq !== undefined && dto.overrideCoinReq !== existing.overrideCoinReq) {
      const dupCoin = await this.repo.findDuplicateCoinMilestone(
        existing.storeId,
        dto.overrideCoinReq,
        existing.id,
      );
      if (dupCoin) {
        throw new ConflictException(REWARD_OVERRIDE_ERRORS.DUPLICATE_COIN_MILESTONE);
      }
    }

    const changedFields: string[] = [];
    const updateData: Prisma.RewardOverrideUpdateInput = { updatedBy: updatedBy ?? null };

    if (dto.overrideRewardType !== undefined) {
      updateData.overrideRewardType = dto.overrideRewardType;
      changedFields.push('overrideRewardType');
    }
    if (dto.overrideRewardRef !== undefined) {
      updateData.overrideRewardRef = dto.overrideRewardRef;
      changedFields.push('overrideRewardRef');
    }
    if (dto.overrideCoinReq !== undefined) {
      updateData.overrideCoinReq = dto.overrideCoinReq;
      changedFields.push('overrideCoinReq');
    }
    if (dto.overrideDisplayOrder !== undefined) {
      updateData.overrideDisplayOrder = dto.overrideDisplayOrder;
      changedFields.push('overrideDisplayOrder');
    }
    if (dto.overridePriority !== undefined) {
      updateData.overridePriority = dto.overridePriority;
      changedFields.push('overridePriority');
    }
    if (dto.effectiveUntil !== undefined) {
      updateData.effectiveUntil = dto.effectiveUntil ? new Date(dto.effectiveUntil) : null;
      changedFields.push('effectiveUntil');
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      changedFields.push('status');
      if (dto.status === 'ARCHIVED') {
        updateData.archivedAt = new Date();
      }
    }
    if (dto.reason !== undefined) {
      updateData.reason = dto.reason;
      changedFields.push('reason');
    }

    const override = await this.repo.update(existing.id, updateData);

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(existing.id, key, value);
      }
    }

    this.events.emit(
      REWARD_OVERRIDE_EVENTS.UPDATED,
      new RewardOverrideUpdatedEvent(
        existing.id,
        existing.storeId,
        existing.ruleId,
        changedFields,
        updatedBy ?? null,
      ),
    );

    await this.cache.invalidateOverride(existing.id, existing.storeId);
    return override;
  }

  async archive(id: string, archivedBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_OVERRIDE_ERRORS.NOT_FOUND);

    await this.repo.softDelete(existing.id, archivedBy);

    await this.repo.createHistory({
      overrideId: existing.id,
      storeId: existing.storeId,
      ruleId: existing.ruleId,
      status: 'ARCHIVED',
      action: 'ARCHIVED',
      reason: 'Archived',
      changedBy: archivedBy ?? null,
      snapshot: { archivedAt: new Date().toISOString() },
    });

    this.events.emit(
      REWARD_OVERRIDE_EVENTS.ARCHIVED,
      new RewardOverrideArchivedEvent(
        existing.id,
        existing.storeId,
        existing.ruleId,
        archivedBy ?? null,
      ),
    );

    await this.cache.invalidateOverride(existing.id, existing.storeId);
  }

  async restore(id: string, restoredBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_OVERRIDE_ERRORS.NOT_FOUND);

    const duplicate = await this.repo.findActiveByStoreAndRule(
      existing.storeId,
      existing.ruleId,
    );
    if (duplicate) {
      throw new ConflictException(REWARD_OVERRIDE_ERRORS.DUPLICATE_OVERRIDE);
    }

    const override = await this.repo.restore(existing.id, restoredBy);

    await this.repo.createHistory({
      overrideId: existing.id,
      storeId: existing.storeId,
      ruleId: existing.ruleId,
      status: 'ACTIVE',
      action: 'RESTORED',
      reason: 'Restored from archive',
      changedBy: restoredBy ?? null,
    });

    this.events.emit(
      REWARD_OVERRIDE_EVENTS.RESTORED,
      new RewardOverrideRestoredEvent(
        existing.id,
        existing.storeId,
        existing.ruleId,
        restoredBy ?? null,
      ),
    );

    await this.cache.invalidateOverride(existing.id, existing.storeId);
    return override;
  }

  async findHistory(storeId: string) {
    return this.repo.findHistory(storeId);
  }

  // ── Reward Resolution Engine ─────────────────────────────

  async previewEffectiveRewards(storeId: string): Promise<ResolvedReward[]> {
    const cached = await this.cache.getPreview<ResolvedReward[]>(storeId);
    if (cached) return cached;

    const assignment = await this.assignmentRepo.findActiveByStore(storeId);
    if (!assignment) return [];

    const [profileRules] = await this.rulesRepo.findMany(
      { profileId: assignment.profileId, status: 'ACTIVE', deletedAt: null },
      [{ displayOrder: 'asc' }, { coinRequirement: 'asc' }],
      0,
      500,
    );

    const overrides = await this.repo.findActiveByStore(storeId);

    const overrideMap = new Map<string, (typeof overrides)[number]>();
    for (const o of overrides) {
      if (o.effectiveUntil && new Date(o.effectiveUntil) < new Date()) continue;
      overrideMap.set(o.ruleId, o);
    }

    const resolved: ResolvedReward[] = profileRules.map((rule) => {
      const override = overrideMap.get(rule.id);

      if (override) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.ruleType,
          coinRequirement: override.overrideCoinReq ?? rule.coinRequirement,
          rewardType: override.overrideRewardType,
          rewardReference: override.overrideRewardRef ?? rule.rewardReference,
          displayOrder: override.overrideDisplayOrder ?? rule.displayOrder,
          priority: override.overridePriority ?? rule.priority,
          source: 'OVERRIDE' as const,
          overrideId: override.id,
          validFrom: rule.validFrom,
          expiryDate: rule.expiryDate,
        };
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        coinRequirement: rule.coinRequirement,
        rewardType: rule.rewardType,
        rewardReference: rule.rewardReference,
        displayOrder: rule.displayOrder,
        priority: rule.priority,
        source: 'PROFILE' as const,
        overrideId: null,
        validFrom: rule.validFrom,
        expiryDate: rule.expiryDate,
      };
    });

    resolved.sort((a, b) => a.displayOrder - b.displayOrder || a.priority - b.priority);

    await this.cache.setPreview(storeId, resolved);
    return resolved;
  }
}
