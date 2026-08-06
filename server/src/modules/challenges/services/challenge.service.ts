import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChallengeStatus, ChallengeType, Prisma } from '@prisma/client';
import { ChallengeRepository } from '../repositories';
import { ChallengeRuleRepository } from '../repositories';
import { ChallengeRewardRepository } from '../repositories';
import { ChallengeCacheService } from '../cache';
import {
  CHALLENGE_ERRORS,
  CHALLENGE_EVENTS,
  CHALLENGE_HISTORY_ACTIONS,
  CHALLENGE_DEFAULTS,
} from '../constants';
import {
  ChallengeCreatedEvent,
  ChallengeUpdatedEvent,
  ChallengePublishedEvent,
  ChallengePausedEvent,
  ChallengeEndedEvent,
  ChallengeArchivedEvent,
  ChallengeRestoredEvent,
} from '../events';
import {
  validateChallengeShape,
  validateChallengeRuleShape,
  validateChallengeRewardShape,
  toDate,
  resolveOptional,
} from '../validators';
import {
  CreateChallengeDto,
  UpdateChallengeDto,
  DuplicateChallengeDto,
  ChallengeQueryDto,
} from '../dto';
import { CreateChallengeRuleDto, UpdateChallengeRuleDto } from '../dto';
import { CreateChallengeRewardDto, UpdateChallengeRewardDto } from '../dto';
import { ChallengeResponse, PagedResult } from '../interfaces';
import { ChallengeWithDetailsRecord } from '../repositories/challenge.repository';
import { slugify } from '../../menu/utils/slug.util';

/**
 * Convert a Record to Prisma InputJsonValue
 */
function toInputJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class ChallengeService {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(
    private readonly repo: ChallengeRepository,
    private readonly ruleRepo: ChallengeRuleRepository,
    private readonly rewardRepo: ChallengeRewardRepository,
    private readonly cache: ChallengeCacheService,
    private readonly events: EventEmitter2,
  ) {}

  // ─── CRUD ─────────────────────────────────────────

  async list(
    query: ChallengeQueryDto,
    actorId: string | null,
  ): Promise<PagedResult<ChallengeResponse>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? CHALLENGE_DEFAULTS.PAGE_SIZE,
      CHALLENGE_DEFAULTS.MAX_PAGE_SIZE,
    );
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (!query.includeArchived) where.deletedAt = null;

    const [items, total] = await this.repo.findMany(where, skip, pageSize);
    return {
      items: items as unknown as ChallengeResponse[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<ChallengeResponse> {
    const cached = await this.cache.getChallenge<ChallengeResponse>(id);
    if (cached) return cached;

    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    const response = this.toResponse(record);
    await this.cache.setChallenge(id, response);
    return response;
  }

  async create(
    dto: CreateChallengeDto,
    actorId: string | null,
  ): Promise<ChallengeResponse> {
    const slug = dto.slug || slugify(dto.name);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    validateChallengeShape({
      startsAt,
      endsAt,
      maxParticipants: dto.maxParticipants ?? null,
      repeatableAfterDays: dto.repeatableAfterDays ?? null,
    });

    const existingSlug = await this.repo.findBySlug(slug);
    if (existingSlug) throw new BadRequestException(CHALLENGE_ERRORS.DUPLICATE_SLUG);

    const existingName = await this.repo.findDuplicateName(dto.name);
    if (existingName) throw new BadRequestException(CHALLENGE_ERRORS.DUPLICATE_NAME);

    const record = await this.repo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      shortDescription: dto.shortDescription ?? null,
      image: dto.image ?? null,
      icon: dto.icon ?? null,
      type: dto.type ?? ChallengeType.CUSTOM,
      status: dto.status ?? ChallengeStatus.DRAFT,
      priority: dto.priority ?? 0,
      isFeatured: dto.isFeatured ?? false,
      maxParticipants: dto.maxParticipants ?? null,
      startsAt,
      endsAt,
      storeIds: dto.storeIds ?? [],
      brandIds: dto.brandIds ?? [],
      campaignRef: dto.campaignRef ?? null,
      autoEnroll: dto.autoEnroll ?? false,
      repeatableAfterDays: dto.repeatableAfterDays ?? null,
      createdBy: actorId,
      updatedBy: actorId,
    });

    if (dto.metadata) {
      await this.repo.replaceMetadata(record.id, dto.metadata);
    }

    await this.repo.recordHistory({
      challengeId: record.id,
      action: CHALLENGE_HISTORY_ACTIONS.CREATED,
      status: record.status,
      changedBy: actorId,
      snapshot: record,
    });

    await this.cache.invalidateAll();

    this.events.emit(
      CHALLENGE_EVENTS.CREATED,
      new ChallengeCreatedEvent(record.id, record.name, record.type, actorId),
    );

    return this.toResponse(record);
  }

  async update(
    id: string,
    dto: UpdateChallengeDto,
    actorId: string | null,
  ): Promise<ChallengeResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    if (dto.name && dto.name !== existing.name) {
      const dup = await this.repo.findDuplicateName(dto.name, id);
      if (dup) throw new BadRequestException(CHALLENGE_ERRORS.DUPLICATE_NAME);
    }

    const startsAt = toDate(dto.startsAt) ?? existing.startsAt;
    const endsAt = toDate(dto.endsAt) ?? existing.endsAt;

    validateChallengeShape({
      startsAt,
      endsAt,
      maxParticipants: resolveOptional(dto.maxParticipants, existing.maxParticipants),
      repeatableAfterDays: resolveOptional(
        dto.repeatableAfterDays,
        existing.repeatableAfterDays,
      ),
    });

    const changedFields: string[] = [];
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};

    for (const key of Object.keys(dto) as (keyof UpdateChallengeDto)[]) {
      if (key === 'metadata') continue;
      const v = dto[key];
      if (v !== undefined && v !== (existing as Record<string, unknown>)[key]) {
        changedFields.push(key);
        oldValue[key] = (existing as Record<string, unknown>)[key];
        newValue[key] = v;
      }
    }

    const record = await this.repo.update(id, {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      shortDescription: dto.shortDescription ?? undefined,
      image: dto.image ?? undefined,
      icon: dto.icon ?? undefined,
      type: dto.type ?? undefined,
      priority: dto.priority ?? undefined,
      isFeatured: dto.isFeatured ?? undefined,
      maxParticipants: dto.maxParticipants ?? undefined,
      startsAt: toDate(dto.startsAt) ?? undefined,
      endsAt: toDate(dto.endsAt) ?? undefined,
      storeIds: dto.storeIds ?? undefined,
      brandIds: dto.brandIds ?? undefined,
      campaignRef: dto.campaignRef ?? undefined,
      autoEnroll: dto.autoEnroll ?? undefined,
      repeatableAfterDays: dto.repeatableAfterDays ?? undefined,
      updatedBy: actorId,
    });

    if (dto.metadata) {
      await this.repo.replaceMetadata(id, dto.metadata);
    }

    await this.repo.recordHistory({
      challengeId: id,
      action: CHALLENGE_HISTORY_ACTIONS.UPDATED,
      status: record.status,
      changedBy: actorId,
      snapshot: record,
    });

    await this.cache.invalidateChallenge(id);

    if (changedFields.length > 0) {
      this.events.emit(
        CHALLENGE_EVENTS.UPDATED,
        new ChallengeUpdatedEvent(
          id,
          record.name,
          changedFields,
          oldValue,
          newValue,
          actorId,
        ),
      );
    }

    return this.toResponse(record);
  }

  async archive(id: string, actorId: string | null): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    if (existing.status === ChallengeStatus.ACTIVE) {
      throw new BadRequestException(CHALLENGE_ERRORS.CANNOT_ARCHIVE_ACTIVE);
    }

    await this.repo.softDelete(id, actorId);

    await this.repo.recordHistory({
      challengeId: id,
      action: CHALLENGE_HISTORY_ACTIONS.ARCHIVED,
      status: ChallengeStatus.ARCHIVED,
      changedBy: actorId,
    });

    await this.cache.invalidateChallenge(id);

    this.events.emit(
      CHALLENGE_EVENTS.ARCHIVED,
      new ChallengeArchivedEvent(id, existing.name, actorId),
    );
  }

  async restore(id: string, actorId: string | null): Promise<ChallengeResponse> {
    const existing = await this.repo.findByIdIncludingDeleted(id);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    const record = await this.repo.restore(id, actorId);

    await this.repo.recordHistory({
      challengeId: id,
      action: CHALLENGE_HISTORY_ACTIONS.RESTORED,
      status: ChallengeStatus.DRAFT,
      changedBy: actorId,
    });

    await this.cache.invalidateAll();

    this.events.emit(
      CHALLENGE_EVENTS.RESTORED,
      new ChallengeRestoredEvent(id, record.name, actorId),
    );

    return this.toResponse(record);
  }

  // ─── Lifecycle ────────────────────────────────────

  async publish(id: string, actorId: string | null): Promise<ChallengeResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    if (
      existing.status === ChallengeStatus.PUBLISHED ||
      existing.status === ChallengeStatus.ACTIVE
    ) {
      throw new BadRequestException(CHALLENGE_ERRORS.ALREADY_PUBLISHED);
    }

    if (existing.rules.length === 0) {
      throw new BadRequestException(CHALLENGE_ERRORS.CANNOT_PUBLISH_NO_RULES);
    }

    if (existing.rewards.length === 0) {
      throw new BadRequestException(CHALLENGE_ERRORS.CANNOT_PUBLISH_NO_REWARDS);
    }

    const record = await this.repo.update(id, {
      status: ChallengeStatus.PUBLISHED,
      publishedAt: new Date(),
      updatedBy: actorId,
    });

    await this.repo.recordHistory({
      challengeId: id,
      action: CHALLENGE_HISTORY_ACTIONS.PUBLISHED,
      status: ChallengeStatus.PUBLISHED,
      changedBy: actorId,
    });

    await this.cache.invalidateAll();

    this.events.emit(
      CHALLENGE_EVENTS.PUBLISHED,
      new ChallengePublishedEvent(id, record.name, record.type, actorId),
    );

    return this.toResponse(record);
  }

  async pause(id: string, actorId: string | null): Promise<ChallengeResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    const record = await this.repo.update(id, {
      status: ChallengeStatus.PAUSED,
      updatedBy: actorId,
    });

    await this.repo.recordHistory({
      challengeId: id,
      action: CHALLENGE_HISTORY_ACTIONS.PAUSED,
      status: ChallengeStatus.PAUSED,
      changedBy: actorId,
    });

    await this.cache.invalidateAll();

    this.events.emit(
      CHALLENGE_EVENTS.PAUSED,
      new ChallengePausedEvent(id, record.name, actorId),
    );

    return this.toResponse(record);
  }

  async end(id: string, actorId: string | null): Promise<ChallengeResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    const record = await this.repo.update(id, {
      status: ChallengeStatus.ENDED,
      updatedBy: actorId,
    });

    await this.repo.recordHistory({
      challengeId: id,
      action: CHALLENGE_HISTORY_ACTIONS.ENDED,
      status: ChallengeStatus.ENDED,
      changedBy: actorId,
    });

    await this.cache.invalidateAll();

    this.events.emit(
      CHALLENGE_EVENTS.ENDED,
      new ChallengeEndedEvent(id, record.name, actorId),
    );

    return this.toResponse(record);
  }

  // ─── Duplicate ────────────────────────────────────

  async duplicate(
    sourceId: string,
    dto: DuplicateChallengeDto,
    actorId: string | null,
  ): Promise<ChallengeResponse> {
    const source = await this.repo.findById(sourceId);
    if (!source) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    const name = dto.name || `${source.name} (copy)`;
    const slug = slugify(name);

    const existingSlug = await this.repo.findBySlug(slug);
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const startsAt = toDate(dto.startsAt) ?? source.startsAt;
    const endsAt = toDate(dto.endsAt) ?? source.endsAt;

    validateChallengeShape({
      startsAt,
      endsAt,
      maxParticipants: source.maxParticipants,
      repeatableAfterDays: source.repeatableAfterDays,
    });

    const record = await this.repo.create({
      name,
      slug: finalSlug,
      description: source.description,
      shortDescription: source.shortDescription,
      image: source.image,
      icon: source.icon,
      type: source.type,
      status: ChallengeStatus.DRAFT,
      priority: source.priority,
      isFeatured: source.isFeatured,
      maxParticipants: source.maxParticipants,
      startsAt,
      endsAt,
      storeIds: source.storeIds,
      brandIds: source.brandIds,
      campaignRef: source.campaignRef,
      autoEnroll: source.autoEnroll,
      repeatableAfterDays: source.repeatableAfterDays,
      createdBy: actorId,
      updatedBy: actorId,
    });

    for (const rule of source.rules) {
      await this.ruleRepo.create({
        challenge: { connect: { id: record.id } },
        ruleType: rule.ruleType,
        targetCount: rule.targetCount,
        targetAmount: rule.targetAmount,
        gameSlug: rule.gameSlug,
        storeId: rule.storeId,
        sortOrder: rule.sortOrder,
        description: rule.description,
        metadata: (rule.metadata as Prisma.InputJsonValue) ?? undefined,
      });
    }

    for (const reward of source.rewards) {
      await this.rewardRepo.create({
        challenge: { connect: { id: record.id } },
        rewardType: reward.rewardType,
        coinAmount: reward.coinAmount,
        rewardReference: reward.rewardReference,
        quantity: reward.quantity,
        sortOrder: reward.sortOrder,
        description: reward.description,
        metadata: (reward.metadata as Prisma.InputJsonValue) ?? undefined,
      });
    }

    await this.repo.recordHistory({
      challengeId: record.id,
      action: CHALLENGE_HISTORY_ACTIONS.DUPLICATED,
      status: ChallengeStatus.DRAFT,
      changedBy: actorId,
      snapshot: { sourceId },
    });

    await this.cache.invalidateAll();

    const full = await this.repo.findById(record.id);
    return this.toResponse(full!);
  }

  // ─── Rules sub-CRUD ───────────────────────────────

  async createRule(dto: CreateChallengeRuleDto, actorId: string | null) {
    const challenge = await this.repo.findById(dto.challengeId);
    if (!challenge) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    validateChallengeRuleShape({
      targetCount: dto.targetCount ?? 1,
      targetAmount: dto.targetAmount ?? null,
    });

    const rule = await this.ruleRepo.create({
      challenge: { connect: { id: dto.challengeId } },
      ruleType: dto.ruleType,
      targetCount: dto.targetCount ?? 1,
      targetAmount: dto.targetAmount ?? null,
      gameSlug: dto.gameSlug ?? null,
      storeId: dto.storeId ?? null,
      sortOrder: dto.sortOrder ?? 0,
      description: dto.description ?? null,
      metadata: toInputJson(dto.metadata),
    });

    await this.cache.invalidateChallenge(dto.challengeId);
    return rule;
  }

  async updateRule(ruleId: string, dto: UpdateChallengeRuleDto) {
    const existing = await this.ruleRepo.findById(ruleId);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.RULE_NOT_FOUND);

    if (dto.targetCount !== undefined || dto.targetAmount !== undefined) {
      validateChallengeRuleShape({
        targetCount: dto.targetCount ?? existing.targetCount,
        targetAmount: dto.targetAmount ?? (existing.targetAmount !== null ? Number(existing.targetAmount) : null),
      });
    }

    const rule = await this.ruleRepo.update(ruleId, {
      ruleType: dto.ruleType ?? undefined,
      targetCount: dto.targetCount ?? undefined,
      targetAmount: dto.targetAmount ?? undefined,
      gameSlug: dto.gameSlug ?? undefined,
      storeId: dto.storeId ?? undefined,
      sortOrder: dto.sortOrder ?? undefined,
      description: dto.description ?? undefined,
      metadata: toInputJson(dto.metadata),
    });

    await this.cache.invalidateChallenge(existing.challengeId);
    return rule;
  }

  async deleteRule(ruleId: string): Promise<void> {
    const existing = await this.ruleRepo.findById(ruleId);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.RULE_NOT_FOUND);

    await this.ruleRepo.delete(ruleId);
    await this.cache.invalidateChallenge(existing.challengeId);
  }

  // ─── Rewards sub-CRUD ─────────────────────────────

  async createReward(dto: CreateChallengeRewardDto, actorId: string | null) {
    const challenge = await this.repo.findById(dto.challengeId);
    if (!challenge) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    validateChallengeRewardShape({
      rewardType: dto.rewardType,
      coinAmount: dto.coinAmount ?? null,
      quantity: dto.quantity ?? 1,
    });

    const reward = await this.rewardRepo.create({
      challenge: { connect: { id: dto.challengeId } },
      rewardType: dto.rewardType,
      coinAmount: dto.coinAmount ?? null,
      rewardReference: dto.rewardReference ?? null,
      quantity: dto.quantity ?? 1,
      sortOrder: dto.sortOrder ?? 0,
      description: dto.description ?? null,
      metadata: toInputJson(dto.metadata),
    });

    await this.cache.invalidateChallenge(dto.challengeId);
    return reward;
  }

  async updateReward(rewardId: string, dto: UpdateChallengeRewardDto) {
    const existing = await this.rewardRepo.findById(rewardId);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.REWARD_NOT_FOUND);

    if (dto.rewardType !== undefined || dto.coinAmount !== undefined || dto.quantity !== undefined) {
      validateChallengeRewardShape({
        rewardType: dto.rewardType ?? existing.rewardType,
        coinAmount: dto.coinAmount ?? existing.coinAmount,
        quantity: dto.quantity ?? existing.quantity,
      });
    }

    const reward = await this.rewardRepo.update(rewardId, {
      rewardType: dto.rewardType ?? undefined,
      coinAmount: dto.coinAmount ?? undefined,
      rewardReference: dto.rewardReference ?? undefined,
      quantity: dto.quantity ?? undefined,
      sortOrder: dto.sortOrder ?? undefined,
      description: dto.description ?? undefined,
      metadata: toInputJson(dto.metadata),
    });

    await this.cache.invalidateChallenge(existing.challengeId);
    return reward;
  }

  async deleteReward(rewardId: string): Promise<void> {
    const existing = await this.rewardRepo.findById(rewardId);
    if (!existing) throw new NotFoundException(CHALLENGE_ERRORS.REWARD_NOT_FOUND);

    await this.rewardRepo.delete(rewardId);
    await this.cache.invalidateChallenge(existing.challengeId);
  }

  // ─── History & Metadata ───────────────────────────

  async getHistory(challengeId: string) {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);
    return this.repo.findHistory(challengeId);
  }

  async getMetadata(challengeId: string) {
    const challenge = await this.repo.findById(challengeId);
    if (!challenge) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);
    return this.repo.findMetadata(challengeId);
  }

  // ─── Helpers ──────────────────────────────────────

  private toResponse(record: ChallengeWithDetailsRecord): ChallengeResponse {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      description: record.description,
      shortDescription: record.shortDescription,
      image: record.image,
      icon: record.icon,
      type: record.type,
      status: record.status,
      priority: record.priority,
      isFeatured: record.isFeatured,
      maxParticipants: record.maxParticipants,
      currentParticipants: record.currentParticipants,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      storeIds: record.storeIds,
      brandIds: record.brandIds,
      campaignRef: record.campaignRef,
      autoEnroll: record.autoEnroll,
      repeatableAfterDays: record.repeatableAfterDays,
      publishedAt: record.publishedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      rules: record.rules,
      rewards: record.rewards,
    };
  }
}
