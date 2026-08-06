import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { RewardProfileRepository } from '../repositories';
import { RewardProfileCacheService } from '../cache';
import {
  CreateRewardProfileDto,
  UpdateRewardProfileDto,
  DuplicateRewardProfileDto,
  RewardProfileQueryDto,
} from '../dto';
import {
  REWARD_PROFILE_DEFAULTS,
  REWARD_PROFILE_ERRORS,
  REWARD_PROFILE_EVENTS,
} from '../constants';
import {
  RewardProfileCreatedEvent,
  RewardProfileUpdatedEvent,
  RewardProfileArchivedEvent,
  RewardProfileRestoredEvent,
  RewardProfileDuplicatedEvent,
  RewardProfileActivatedEvent,
  RewardProfileDefaultChangedEvent,
} from '../events';

@Injectable()
export class RewardProfileService {
  private readonly logger = new Logger(RewardProfileService.name);

  constructor(
    private readonly repo: RewardProfileRepository,
    private readonly cache: RewardProfileCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: RewardProfileQueryDto) {
    const where: Prisma.RewardProfileWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? REWARD_PROFILE_DEFAULTS.PAGE_SIZE,
      REWARD_PROFILE_DEFAULTS.MAX_PAGE_SIZE,
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

  async findByIdOrSlug(idOrSlug: string) {
    const cached = await this.cache.getItem(idOrSlug);
    if (cached) return cached;

    const profile = await this.repo.findByIdOrSlug(idOrSlug);
    if (!profile) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);

    await this.cache.setItem(idOrSlug, profile);
    return profile;
  }

  async findDefault() {
    const cached = await this.cache.getDefault();
    if (cached) return cached;

    const profile = await this.repo.findDefault();
    if (!profile) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);

    await this.cache.setDefault(profile);
    return profile;
  }

  async create(dto: CreateRewardProfileDto, createdBy?: string) {
    const slug = dto.slug || this.slugify(dto.name);

    const existingSlug = await this.repo.findBySlug(slug);
    if (existingSlug) throw new ConflictException(REWARD_PROFILE_ERRORS.SLUG_EXISTS);

    if (dto.isDefault) {
      await this.repo.clearDefault();
    }

    const profile = await this.repo.create({
      name: dto.name,
      slug,
      description: dto.description,
      status: dto.status ?? 'DRAFT',
      type: dto.type ?? 'STANDARD',
      isDefault: dto.isDefault ?? false,
      version: 1,
      createdBy: createdBy ?? null,
    });

    await this.repo.createVersion({
      profile: { connect: { id: profile.id } },
      versionNumber: 1,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      status: profile.status,
      type: profile.type,
      isDefault: profile.isDefault,
      changeReason: 'Initial creation',
      createdBy: createdBy ?? null,
    });

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(profile.id, key, value);
      }
    }

    this.events.emit(
      REWARD_PROFILE_EVENTS.CREATED,
      new RewardProfileCreatedEvent(
        profile.id,
        profile.name,
        profile.slug,
        profile.type,
        createdBy ?? null,
      ),
    );

    await this.cache.invalidateProfile(profile.id);
    return profile;
  }

  async update(id: string, dto: UpdateRewardProfileDto, updatedBy?: string) {
    const existing = await this.repo.findByIdOrSlug(id);
    if (!existing) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);

    if (dto.status === 'ARCHIVED' && existing.isDefault) {
      throw new BadRequestException(REWARD_PROFILE_ERRORS.CANNOT_ARCHIVE_DEFAULT);
    }
    if (dto.status === 'DISABLED' && existing.isDefault) {
      throw new BadRequestException(REWARD_PROFILE_ERRORS.CANNOT_DISABLE_DEFAULT);
    }

    if (dto.isDefault === true && !existing.isDefault) {
      const previousDefault = await this.repo.findDefault();
      await this.repo.clearDefault(existing.id);

      this.events.emit(
        REWARD_PROFILE_EVENTS.DEFAULT_CHANGED,
        new RewardProfileDefaultChangedEvent(
          previousDefault?.id ?? null,
          existing.id,
          updatedBy ?? null,
        ),
      );
    }

    const changedFields = Object.keys(dto).filter((k) => k !== 'changeReason' && k !== 'metadata');
    const newVersion = existing.version + 1;

    const updateData: Prisma.RewardProfileUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type && { type: dto.type }),
      ...(dto.status && { status: dto.status }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      version: newVersion,
      updatedBy: updatedBy ?? null,
    };

    const profile = await this.repo.update(existing.id, updateData);

    await this.repo.createVersion({
      profile: { connect: { id: existing.id } },
      versionNumber: newVersion,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      status: profile.status,
      type: profile.type,
      isDefault: profile.isDefault,
      changeReason: dto.changeReason ?? null,
      createdBy: updatedBy ?? null,
    });

    if (dto.metadata) {
      for (const [key, value] of Object.entries(dto.metadata)) {
        await this.repo.upsertMetadata(existing.id, key, value);
      }
    }

    if (dto.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      this.events.emit(
        REWARD_PROFILE_EVENTS.ACTIVATED,
        new RewardProfileActivatedEvent(existing.id, existing.slug, updatedBy ?? null),
      );
    }

    this.events.emit(
      REWARD_PROFILE_EVENTS.UPDATED,
      new RewardProfileUpdatedEvent(
        existing.id,
        changedFields,
        existing.status,
        profile.status,
        updatedBy ?? null,
      ),
    );

    await this.cache.invalidateProfile(existing.id);
    return profile;
  }

  async archive(id: string, archivedBy?: string) {
    const existing = await this.repo.findByIdOrSlug(id);
    if (!existing) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);
    if (existing.isDefault) {
      throw new BadRequestException(REWARD_PROFILE_ERRORS.CANNOT_ARCHIVE_DEFAULT);
    }

    await this.repo.softDelete(existing.id, archivedBy);

    const newVersion = existing.version + 1;
    await this.repo.update(existing.id, { version: newVersion });
    await this.repo.createVersion({
      profile: { connect: { id: existing.id } },
      versionNumber: newVersion,
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      status: 'ARCHIVED',
      type: existing.type,
      isDefault: false,
      changeReason: 'Archived',
      createdBy: archivedBy ?? null,
    });

    this.events.emit(
      REWARD_PROFILE_EVENTS.ARCHIVED,
      new RewardProfileArchivedEvent(existing.id, existing.slug, archivedBy ?? null),
    );

    await this.cache.invalidateProfile(existing.id);
  }

  async restore(id: string, restoredBy?: string) {
    const existing = await this.repo.findByIdOrSlug(id);
    if (!existing) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);

    const profile = await this.repo.restore(existing.id, restoredBy);

    const newVersion = existing.version + 1;
    await this.repo.update(existing.id, { version: newVersion });
    await this.repo.createVersion({
      profile: { connect: { id: existing.id } },
      versionNumber: newVersion,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      status: 'DRAFT',
      type: profile.type,
      isDefault: false,
      changeReason: 'Restored from archive',
      createdBy: restoredBy ?? null,
    });

    this.events.emit(
      REWARD_PROFILE_EVENTS.RESTORED,
      new RewardProfileRestoredEvent(existing.id, existing.slug, restoredBy ?? null),
    );

    await this.cache.invalidateProfile(existing.id);
    return profile;
  }

  async duplicate(id: string, dto: DuplicateRewardProfileDto, duplicatedBy?: string) {
    const source = await this.repo.findByIdOrSlug(id);
    if (!source) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);

    const baseName = dto.name || `${source.name} (Copy)`;
    let slug = this.slugify(baseName);

    const existingSlug = await this.repo.findBySlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const newProfile = await this.repo.create({
      name: baseName,
      slug,
      description: source.description,
      status: 'DRAFT',
      type: source.type,
      isDefault: false,
      version: 1,
      createdBy: duplicatedBy ?? null,
    });

    await this.repo.createVersion({
      profile: { connect: { id: newProfile.id } },
      versionNumber: 1,
      name: newProfile.name,
      slug: newProfile.slug,
      description: newProfile.description,
      status: newProfile.status,
      type: newProfile.type,
      isDefault: false,
      snapshot: { sourceProfileId: source.id, sourceVersion: source.version },
      changeReason: dto.changeReason ?? `Duplicated from "${source.name}"`,
      createdBy: duplicatedBy ?? null,
    });

    const sourceMetadata = await this.repo.findMetadata(source.id);
    for (const meta of sourceMetadata) {
      await this.repo.upsertMetadata(newProfile.id, meta.key, meta.value);
    }

    this.events.emit(
      REWARD_PROFILE_EVENTS.DUPLICATED,
      new RewardProfileDuplicatedEvent(
        source.id,
        newProfile.id,
        newProfile.slug,
        duplicatedBy ?? null,
      ),
    );

    await this.cache.invalidateProfile(newProfile.id);
    return newProfile;
  }

  async findVersions(profileId: string) {
    const profile = await this.repo.findByIdOrSlug(profileId);
    if (!profile) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);
    return this.repo.findVersions(profile.id);
  }

  async findMetadata(profileId: string) {
    const profile = await this.repo.findByIdOrSlug(profileId);
    if (!profile) throw new NotFoundException(REWARD_PROFILE_ERRORS.NOT_FOUND);
    return this.repo.findMetadata(profile.id);
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
