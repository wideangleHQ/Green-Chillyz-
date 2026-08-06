import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { RewardAssignmentRepository } from '../repositories';
import { RewardAssignmentCacheService } from '../cache';
import { RewardProfileRepository } from '../../reward-profile/repositories';
import {
  CreateRewardAssignmentDto,
  UpdateRewardAssignmentDto,
  ChangeAssignmentDto,
  RewardAssignmentQueryDto,
} from '../dto';
import {
  REWARD_ASSIGNMENT_ERRORS,
  REWARD_ASSIGNMENT_DEFAULTS,
  REWARD_ASSIGNMENT_EVENTS,
} from '../constants';
import {
  RewardProfileAssignedEvent,
  RewardProfileChangedEvent,
  RewardProfileRemovedEvent,
  RewardProfileExpiredEvent,
} from '../events';

@Injectable()
export class RewardAssignmentService {
  private readonly logger = new Logger(RewardAssignmentService.name);

  constructor(
    private readonly repo: RewardAssignmentRepository,
    private readonly cache: RewardAssignmentCacheService,
    private readonly profileRepo: RewardProfileRepository,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: RewardAssignmentQueryDto) {
    const where: Prisma.RewardAssignmentWhereInput = {};
    if (query.storeId) where.storeId = query.storeId;
    if (query.profileId) where.profileId = query.profileId;
    if (query.status) where.status = query.status;
    if (query.assignmentType) where.assignmentType = query.assignmentType;

    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? REWARD_ASSIGNMENT_DEFAULTS.PAGE_SIZE,
      REWARD_ASSIGNMENT_DEFAULTS.MAX_PAGE_SIZE,
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

    const assignment = await this.repo.findById(id);
    if (!assignment) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.NOT_FOUND);

    await this.cache.setItem(id, assignment);
    return assignment;
  }

  async findByStore(storeId: string) {
    const cached = await this.cache.getStoreAssignment(storeId);
    if (cached) return cached;

    const assignment = await this.repo.findActiveByStore(storeId);
    if (!assignment) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.NOT_FOUND);

    await this.cache.setStoreAssignment(storeId, assignment);
    return assignment;
  }

  async resolveStoreProfile(storeId: string) {
    const cached = await this.cache.getStoreProfile(storeId);
    if (cached) return cached;

    const assignment = await this.repo.findActiveByStore(storeId);
    if (!assignment) return null;

    const profile = await this.profileRepo.findByIdOrSlug(assignment.profileId);
    if (profile) {
      await this.cache.setStoreProfile(storeId, profile);
    }
    return profile;
  }

  async findHistory(storeId: string) {
    return this.repo.findHistory(storeId);
  }

  async assign(dto: CreateRewardAssignmentDto, assignedBy?: string) {
    const storeExists = await this.repo.storeExists(dto.storeId);
    if (!storeExists) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.STORE_NOT_FOUND);

    const profile = await this.profileRepo.findByIdOrSlug(dto.profileId);
    if (!profile) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.PROFILE_NOT_FOUND);

    if (profile.status === 'ARCHIVED') {
      throw new BadRequestException(REWARD_ASSIGNMENT_ERRORS.PROFILE_ARCHIVED);
    }

    if (dto.effectiveFrom && dto.effectiveUntil &&
        new Date(dto.effectiveFrom) >= new Date(dto.effectiveUntil)) {
      throw new BadRequestException(REWARD_ASSIGNMENT_ERRORS.INVALID_DATE_RANGE);
    }

    const existing = await this.repo.findActiveByStore(dto.storeId);
    if (existing) {
      throw new ConflictException(REWARD_ASSIGNMENT_ERRORS.DUPLICATE_ACTIVE);
    }

    const assignment = await this.repo.create({
      store: { connect: { id: dto.storeId } },
      profile: { connect: { id: profile.id } },
      status: 'ACTIVE',
      assignmentType: dto.assignmentType ?? 'STORE',
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      assignedBy: assignedBy ?? null,
      reason: dto.reason,
    });

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(assignment.id, key, value);
      }
    }

    await this.repo.createHistory({
      assignmentId: assignment.id,
      storeId: dto.storeId,
      profileId: profile.id,
      status: 'ACTIVE',
      assignmentType: dto.assignmentType ?? 'STORE',
      action: 'ASSIGNED',
      reason: dto.reason,
      changedBy: assignedBy ?? null,
      snapshot: { profileName: profile.name, profileSlug: profile.slug },
    });

    this.events.emit(
      REWARD_ASSIGNMENT_EVENTS.ASSIGNED,
      new RewardProfileAssignedEvent(
        assignment.id,
        dto.storeId,
        profile.id,
        assignedBy ?? null,
      ),
    );

    await this.cache.invalidateAssignment(assignment.id, dto.storeId);
    return assignment;
  }

  async changeProfile(storeId: string, dto: ChangeAssignmentDto, changedBy?: string) {
    const storeExists = await this.repo.storeExists(storeId);
    if (!storeExists) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.STORE_NOT_FOUND);

    const newProfile = await this.profileRepo.findByIdOrSlug(dto.profileId);
    if (!newProfile) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.PROFILE_NOT_FOUND);

    if (newProfile.status === 'ARCHIVED') {
      throw new BadRequestException(REWARD_ASSIGNMENT_ERRORS.PROFILE_ARCHIVED);
    }

    if (dto.effectiveFrom && dto.effectiveUntil &&
        new Date(dto.effectiveFrom) >= new Date(dto.effectiveUntil)) {
      throw new BadRequestException(REWARD_ASSIGNMENT_ERRORS.INVALID_DATE_RANGE);
    }

    const previous = await this.repo.findActiveByStore(storeId);
    const previousProfileId = previous?.profileId ?? null;

    if (previous) {
      await this.repo.archiveActiveForStore(storeId, changedBy);

      await this.repo.createHistory({
        assignmentId: previous.id,
        storeId,
        profileId: previous.profileId,
        status: 'ARCHIVED',
        assignmentType: previous.assignmentType,
        action: 'CHANGED',
        reason: dto.reason ?? 'Profile changed',
        changedBy: changedBy ?? null,
        snapshot: {
          profileName: previous.profile?.name,
          archivedAt: new Date().toISOString(),
        },
      });
    }

    const assignment = await this.repo.create({
      store: { connect: { id: storeId } },
      profile: { connect: { id: newProfile.id } },
      status: 'ACTIVE',
      assignmentType: dto.assignmentType ?? 'STORE',
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      assignedBy: changedBy ?? null,
      reason: dto.reason,
    });

    await this.repo.createHistory({
      assignmentId: assignment.id,
      storeId,
      profileId: newProfile.id,
      status: 'ACTIVE',
      assignmentType: dto.assignmentType ?? 'STORE',
      action: 'ASSIGNED',
      reason: dto.reason,
      changedBy: changedBy ?? null,
      snapshot: { profileName: newProfile.name, profileSlug: newProfile.slug },
    });

    this.events.emit(
      REWARD_ASSIGNMENT_EVENTS.CHANGED,
      new RewardProfileChangedEvent(
        storeId,
        previousProfileId ?? '',
        newProfile.id,
        changedBy ?? null,
      ),
    );

    await this.cache.invalidateAssignment(assignment.id, storeId);
    if (previous) {
      await this.cache.invalidateAssignment(previous.id, storeId);
    }
    return assignment;
  }

  async update(id: string, dto: UpdateRewardAssignmentDto, updatedBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.NOT_FOUND);

    const updateData: Prisma.RewardAssignmentUpdateInput = {
      ...(dto.effectiveUntil !== undefined && {
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      }),
      ...(dto.assignmentType && { assignmentType: dto.assignmentType }),
      ...(dto.reason !== undefined && { reason: dto.reason }),
      updatedBy: updatedBy ?? null,
    };

    const assignment = await this.repo.update(existing.id, updateData);

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(existing.id, key, value);
      }
    }

    await this.cache.invalidateAssignment(existing.id, existing.storeId);
    return assignment;
  }

  async archive(id: string, archivedBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.NOT_FOUND);

    await this.repo.softDelete(existing.id, archivedBy);

    await this.repo.createHistory({
      assignmentId: existing.id,
      storeId: existing.storeId,
      profileId: existing.profileId,
      status: 'ARCHIVED',
      assignmentType: existing.assignmentType,
      action: 'ARCHIVED',
      reason: 'Archived',
      changedBy: archivedBy ?? null,
      snapshot: {
        profileName: existing.profile?.name,
        archivedAt: new Date().toISOString(),
      },
    });

    this.events.emit(
      REWARD_ASSIGNMENT_EVENTS.ARCHIVED,
      new RewardProfileRemovedEvent(
        existing.id,
        existing.storeId,
        existing.profileId,
        archivedBy ?? null,
      ),
    );

    await this.cache.invalidateAssignment(existing.id, existing.storeId);
  }

  async restore(id: string, restoredBy?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(REWARD_ASSIGNMENT_ERRORS.NOT_FOUND);

    const currentActive = await this.repo.findActiveByStore(existing.storeId);
    if (currentActive) {
      throw new ConflictException(REWARD_ASSIGNMENT_ERRORS.DUPLICATE_ACTIVE);
    }

    const assignment = await this.repo.restore(existing.id, restoredBy);

    await this.repo.createHistory({
      assignmentId: existing.id,
      storeId: existing.storeId,
      profileId: existing.profileId,
      status: 'ACTIVE',
      assignmentType: existing.assignmentType,
      action: 'RESTORED',
      reason: 'Restored from archive',
      changedBy: restoredBy ?? null,
    });

    this.events.emit(
      REWARD_ASSIGNMENT_EVENTS.RESTORED,
      new RewardProfileAssignedEvent(
        existing.id,
        existing.storeId,
        existing.profileId,
        restoredBy ?? null,
      ),
    );

    await this.cache.invalidateAssignment(existing.id, existing.storeId);
    return assignment;
  }
}
