import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardProfileService } from '../../reward-profile/services';
import { RewardProfileRepository } from '../../reward-profile/repositories';
import { DashboardOpsCacheService } from '../../dashboard/common/services/dashboard-ops-cache.service';
import {
  DashboardCreateProfileDto,
  DashboardUpdateProfileDto,
  DashboardDuplicateProfileDto,
  DashboardPublishProfileDto,
  DashboardProfileQueryDto,
} from '../dto';
import {
  DASHBOARD_REWARDS_CACHE,
  DASHBOARD_REWARDS_ERRORS,
  DASHBOARD_REWARDS_EVENTS,
} from '../constants';

@Injectable()
export class DashboardRewardProfilesService {
  private readonly logger = new Logger(DashboardRewardProfilesService.name);

  constructor(
    private readonly profileService: RewardProfileService,
    private readonly profileRepo: RewardProfileRepository,
    private readonly opsCache: DashboardOpsCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async list(query: DashboardProfileQueryDto) {
    return this.profileService.findAll({
      search: query.search,
      status: query.status,
      type: query.type,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async getById(idOrSlug: string) {
    return this.profileService.findByIdOrSlug(idOrSlug);
  }

  async getDefault() {
    return this.profileService.findDefault();
  }

  async create(dto: DashboardCreateProfileDto, storeId: string) {
    const profile = await this.profileService.create(
      {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        metadata: dto.metadata,
      },
      storeId,
    );
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  async update(id: string, dto: DashboardUpdateProfileDto, storeId: string) {
    const profile = await this.profileService.update(id, dto, storeId);
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  async archive(id: string, storeId: string) {
    await this.profileService.archive(id, storeId);
    await this.invalidateRewardsCache(storeId);
  }

  async restore(id: string, storeId: string) {
    const profile = await this.profileService.restore(id, storeId);
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  async duplicate(id: string, dto: DashboardDuplicateProfileDto, storeId: string) {
    const profile = await this.profileService.duplicate(id, { name: dto.name }, storeId);
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  async setDefault(id: string, storeId: string) {
    const profile = await this.profileService.update(
      id,
      { isDefault: true } as any,
      storeId,
    );
    this.events.emit(DASHBOARD_REWARDS_EVENTS.DEFAULT_PROFILE_CHANGED, {
      profileId: id,
      changedBy: storeId,
    });
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  async publish(id: string, dto: DashboardPublishProfileDto, storeId: string) {
    const profile = await this.profileService.update(
      id,
      { status: 'ACTIVE' as any, changeReason: dto.changeReason },
      storeId,
    );
    this.events.emit(DASHBOARD_REWARDS_EVENTS.PROFILE_PUBLISHED, {
      profileId: id,
      publishedBy: storeId,
    });
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  async getVersions(profileId: string) {
    return this.profileService.findVersions(profileId);
  }

  async rollbackVersion(profileId: string, versionNumber: number, storeId: string) {
    const versions = await this.profileService.findVersions(profileId);
    const targetVersion = versions.find((v: any) => v.versionNumber === versionNumber);
    if (!targetVersion) {
      throw new NotFoundException(DASHBOARD_REWARDS_ERRORS.VERSION_NOT_FOUND);
    }

    const snapshot = targetVersion.snapshot as any;
    if (!snapshot) {
      throw new NotFoundException(DASHBOARD_REWARDS_ERRORS.CANNOT_ROLLBACK);
    }

    const profile = await this.profileService.update(
      profileId,
      {
        name: snapshot.name ?? targetVersion.name,
        description: snapshot.description ?? targetVersion.description,
        type: snapshot.type ?? targetVersion.type,
        status: snapshot.status ?? targetVersion.status,
        changeReason: `Rollback to version ${versionNumber}`,
      },
      storeId,
    );
    await this.invalidateRewardsCache(storeId);
    return profile;
  }

  private async invalidateRewardsCache(storeId: string): Promise<void> {
    try {
      await this.opsCache.invalidateSection(storeId, 'rewards');
    } catch {
      this.logger.warn(`Cache invalidation skipped for store ${storeId}`);
    }
  }
}
