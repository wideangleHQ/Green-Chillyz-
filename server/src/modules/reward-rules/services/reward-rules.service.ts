import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { RewardRulesRepository } from '../repositories';
import { RewardRulesCacheService } from '../cache';
import { RewardProfileRepository } from '../../reward-profile/repositories';
import {
  CreateRewardRuleDto,
  UpdateRewardRuleDto,
  DuplicateRewardRuleDto,
  RewardRuleQueryDto,
} from '../dto';
import {
  REWARD_RULE_ERRORS,
  REWARD_RULE_DEFAULTS,
  REWARD_RULE_EVENTS,
} from '../constants';
import {
  RewardRuleCreatedEvent,
  RewardRuleUpdatedEvent,
  RewardRuleArchivedEvent,
  RewardRuleDeletedEvent,
  RewardRuleDuplicatedEvent,
} from '../events';

@Injectable()
export class RewardRulesService {
  private readonly logger = new Logger(RewardRulesService.name);

  constructor(
    private readonly repo: RewardRulesRepository,
    private readonly cache: RewardRulesCacheService,
    private readonly profileRepo: RewardProfileRepository,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: RewardRuleQueryDto) {
    const where: Prisma.ProfileRewardRuleWhereInput = {};
    if (query.profileId) where.profileId = query.profileId;
    if (query.status) where.status = query.status;
    if (query.ruleType) where.ruleType = query.ruleType;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? REWARD_RULE_DEFAULTS.PAGE_SIZE,
      REWARD_RULE_DEFAULTS.MAX_PAGE_SIZE,
    );
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.repo.findMany(where, undefined, skip, pageSize);

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

    const rule = await this.repo.findById(id);
    if (!rule) throw new NotFoundException(REWARD_RULE_ERRORS.NOT_FOUND);

    await this.cache.setItem(id, rule);
    return rule;
  }

  async findByProfile(profileId: string) {
    const cached = await this.cache.getProfileRules(profileId);
    if (cached) return cached;

    const profile = await this.profileRepo.findByIdOrSlug(profileId);
    if (!profile) throw new NotFoundException(REWARD_RULE_ERRORS.PROFILE_NOT_FOUND);

    const rules = await this.repo.findByProfile(profile.id);
    await this.cache.setProfileRules(profile.id, rules);
    return rules;
  }

  async findMilestones(profileId?: string) {
    if (!profileId) {
      const cached = await this.cache.getMilestones();
      if (cached) return cached;
    }

    if (profileId) {
      const profile = await this.profileRepo.findByIdOrSlug(profileId);
      if (!profile) throw new NotFoundException(REWARD_RULE_ERRORS.PROFILE_NOT_FOUND);
      profileId = profile.id;
    }

    const milestones = await this.repo.findActiveMilestones(profileId);
    if (!profileId) {
      await this.cache.setMilestones(milestones);
    }
    return milestones;
  }

  async create(dto: CreateRewardRuleDto, createdBy?: string) {
    const profile = await this.profileRepo.findByIdOrSlug(dto.profileId);
    if (!profile) throw new NotFoundException(REWARD_RULE_ERRORS.PROFILE_NOT_FOUND);

    if (dto.coinRequirement < 0) {
      throw new BadRequestException(REWARD_RULE_ERRORS.NEGATIVE_COINS);
    }

    if (dto.validFrom && dto.expiryDate && new Date(dto.validFrom) >= new Date(dto.expiryDate)) {
      throw new BadRequestException(REWARD_RULE_ERRORS.INVALID_DATE_RANGE);
    }

    const status = dto.status ?? 'DRAFT';

    if (status === 'ACTIVE') {
      const dupCoin = await this.repo.findDuplicateCoinMilestone(
        profile.id,
        dto.coinRequirement,
      );
      if (dupCoin) throw new ConflictException(REWARD_RULE_ERRORS.DUPLICATE_COIN_MILESTONE);
    }

    const displayOrder = dto.displayOrder ?? (await this.repo.getMaxDisplayOrder(profile.id)) + 1;

    const dupOrder = await this.repo.findDuplicateDisplayOrder(profile.id, displayOrder);
    if (dupOrder) throw new ConflictException(REWARD_RULE_ERRORS.DUPLICATE_DISPLAY_ORDER);

    const rule = await this.repo.create({
      profile: { connect: { id: profile.id } },
      name: dto.name,
      description: dto.description,
      ruleType: dto.ruleType ?? 'COIN_MILESTONE',
      coinRequirement: dto.coinRequirement,
      rewardType: dto.rewardType,
      rewardReference: dto.rewardReference,
      priority: dto.priority ?? 0,
      displayOrder,
      status,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      createdBy: createdBy ?? null,
    });

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(rule.id, key, value);
      }
    }

    this.events.emit(
      REWARD_RULE_EVENTS.CREATED,
      new RewardRuleCreatedEvent(
        rule.id,
        profile.id,
        rule.name,
        rule.ruleType,
        createdBy ?? null,
      ),
    );

    await this.cache.invalidateRule(rule.id, profile.id);
    return rule;
  }

  async update(id: string, dto: UpdateRewardRuleDto, updatedBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_RULE_ERRORS.NOT_FOUND);

    if (dto.coinRequirement !== undefined && dto.coinRequirement < 0) {
      throw new BadRequestException(REWARD_RULE_ERRORS.NEGATIVE_COINS);
    }

    const effectiveValidFrom = dto.validFrom ? new Date(dto.validFrom) : existing.validFrom;
    const effectiveExpiry = dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate;
    if (effectiveValidFrom && effectiveExpiry && effectiveValidFrom >= effectiveExpiry) {
      throw new BadRequestException(REWARD_RULE_ERRORS.INVALID_DATE_RANGE);
    }

    const targetStatus = dto.status ?? existing.status;
    const targetCoin = dto.coinRequirement ?? existing.coinRequirement;

    if (targetStatus === 'ACTIVE' && (dto.coinRequirement !== undefined || dto.status !== undefined)) {
      const dupCoin = await this.repo.findDuplicateCoinMilestone(
        existing.profileId,
        targetCoin,
        existing.id,
      );
      if (dupCoin) throw new ConflictException(REWARD_RULE_ERRORS.DUPLICATE_COIN_MILESTONE);
    }

    if (dto.displayOrder !== undefined) {
      const dupOrder = await this.repo.findDuplicateDisplayOrder(
        existing.profileId,
        dto.displayOrder,
        existing.id,
      );
      if (dupOrder) throw new ConflictException(REWARD_RULE_ERRORS.DUPLICATE_DISPLAY_ORDER);
    }

    const changedFields = Object.keys(dto).filter((k) => k !== 'metadata');

    const updateData: Prisma.ProfileRewardRuleUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.ruleType && { ruleType: dto.ruleType }),
      ...(dto.coinRequirement !== undefined && { coinRequirement: dto.coinRequirement }),
      ...(dto.rewardType && { rewardType: dto.rewardType }),
      ...(dto.rewardReference !== undefined && { rewardReference: dto.rewardReference }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      ...(dto.status && { status: dto.status }),
      ...(dto.validFrom !== undefined && { validFrom: dto.validFrom ? new Date(dto.validFrom) : null }),
      ...(dto.expiryDate !== undefined && { expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null }),
      updatedBy: updatedBy ?? null,
    };

    const rule = await this.repo.update(existing.id, updateData);

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(existing.id, key, value);
      }
    }

    this.events.emit(
      REWARD_RULE_EVENTS.UPDATED,
      new RewardRuleUpdatedEvent(
        existing.id,
        existing.profileId,
        changedFields,
        updatedBy ?? null,
      ),
    );

    await this.cache.invalidateRule(existing.id, existing.profileId);
    return rule;
  }

  async archive(id: string, archivedBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_RULE_ERRORS.NOT_FOUND);

    await this.repo.softDelete(existing.id, archivedBy);

    this.events.emit(
      REWARD_RULE_EVENTS.ARCHIVED,
      new RewardRuleArchivedEvent(
        existing.id,
        existing.profileId,
        existing.name,
        archivedBy ?? null,
      ),
    );

    await this.cache.invalidateRule(existing.id, existing.profileId);
  }

  async restore(id: string, restoredBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_RULE_ERRORS.NOT_FOUND);

    const rule = await this.repo.restore(existing.id, restoredBy);

    this.events.emit(
      REWARD_RULE_EVENTS.DELETED,
      new RewardRuleDeletedEvent(
        existing.id,
        existing.profileId,
        existing.name,
        restoredBy ?? null,
      ),
    );

    await this.cache.invalidateRule(existing.id, existing.profileId);
    return rule;
  }

  async duplicate(id: string, dto: DuplicateRewardRuleDto, duplicatedBy?: string) {
    const source = await this.repo.findById(id);
    if (!source) throw new NotFoundException(REWARD_RULE_ERRORS.NOT_FOUND);

    const name = dto.name || `${source.name} (Copy)`;
    const displayOrder = dto.displayOrder ?? (await this.repo.getMaxDisplayOrder(source.profileId)) + 1;

    const dupOrder = await this.repo.findDuplicateDisplayOrder(source.profileId, displayOrder);
    if (dupOrder) throw new ConflictException(REWARD_RULE_ERRORS.DUPLICATE_DISPLAY_ORDER);

    const newRule = await this.repo.create({
      profile: { connect: { id: source.profileId } },
      name,
      description: source.description,
      ruleType: source.ruleType,
      coinRequirement: source.coinRequirement,
      rewardType: source.rewardType,
      rewardReference: source.rewardReference,
      priority: source.priority,
      displayOrder,
      status: 'DRAFT',
      validFrom: source.validFrom,
      expiryDate: source.expiryDate,
      createdBy: duplicatedBy ?? null,
    });

    const sourceMetadata = await this.repo.findMetadata(source.id);
    for (const meta of sourceMetadata) {
      await this.repo.upsertMetadata(newRule.id, meta.key, meta.value);
    }

    const sourceRewards = await this.repo.findRewards(source.id);
    for (const reward of sourceRewards) {
      await this.repo.createReward({
        rule: { connect: { id: newRule.id } },
        rewardType: reward.rewardType,
        rewardReference: reward.rewardReference,
        quantity: reward.quantity,
        metadata: reward.metadata as Prisma.InputJsonValue ?? undefined,
      });
    }

    this.events.emit(
      REWARD_RULE_EVENTS.DUPLICATED,
      new RewardRuleDuplicatedEvent(
        source.id,
        newRule.id,
        source.profileId,
        duplicatedBy ?? null,
      ),
    );

    await this.cache.invalidateRule(newRule.id, source.profileId);
    return newRule;
  }
}
