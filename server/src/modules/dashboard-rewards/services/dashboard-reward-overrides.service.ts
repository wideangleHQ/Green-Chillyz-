import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardOverridesService } from '../../reward-overrides/services';
import { DashboardOpsCacheService } from '../../dashboard/common/services/dashboard-ops-cache.service';
import {
  DashboardCreateOverrideDto,
  DashboardUpdateOverrideDto,
  DashboardBulkOverrideDto,
} from '../dto';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

@Injectable()
export class DashboardRewardOverridesService {
  private readonly logger = new Logger(DashboardRewardOverridesService.name);

  constructor(
    private readonly overridesService: RewardOverridesService,
    private readonly opsCache: DashboardOpsCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async listByStore(storeId: string) {
    return this.overridesService.findByStore(storeId);
  }

  async getById(id: string) {
    return this.overridesService.findById(id);
  }

  async create(storeId: string, dto: DashboardCreateOverrideDto, createdBy: string) {
    const override = await this.overridesService.create(
      { ...dto, storeId },
      createdBy,
    );
    this.events.emit(DASHBOARD_REWARDS_EVENTS.OVERRIDE_CHANGED, {
      storeId,
      overrideId: override.id,
      action: 'CREATED',
      changedBy: createdBy,
    });
    await this.invalidateCache(storeId);
    return override;
  }

  async update(id: string, storeId: string, dto: DashboardUpdateOverrideDto, updatedBy: string) {
    const override = await this.overridesService.update(id, dto, updatedBy);
    this.events.emit(DASHBOARD_REWARDS_EVENTS.OVERRIDE_CHANGED, {
      storeId,
      overrideId: id,
      action: 'UPDATED',
      changedBy: updatedBy,
    });
    await this.invalidateCache(storeId);
    return override;
  }

  async archive(id: string, storeId: string, archivedBy: string) {
    await this.overridesService.archive(id, archivedBy);
    this.events.emit(DASHBOARD_REWARDS_EVENTS.OVERRIDE_CHANGED, {
      storeId,
      overrideId: id,
      action: 'ARCHIVED',
      changedBy: archivedBy,
    });
    await this.invalidateCache(storeId);
  }

  async restore(id: string, storeId: string, restoredBy: string) {
    const override = await this.overridesService.restore(id, restoredBy);
    await this.invalidateCache(storeId);
    return override;
  }

  async preview(storeId: string) {
    return this.overridesService.previewEffectiveRewards(storeId);
  }

  async getHistory(storeId: string) {
    return this.overridesService.findHistory(storeId);
  }

  async bulkCreate(storeId: string, dto: DashboardBulkOverrideDto, createdBy: string) {
    const results = [];
    for (const overrideDto of dto.overrides) {
      try {
        const override = await this.overridesService.create(
          { ...overrideDto, storeId },
          createdBy,
        );
        results.push({ ruleId: overrideDto.ruleId, success: true, override });
      } catch (error) {
        results.push({
          ruleId: overrideDto.ruleId,
          success: false,
          error: (error as Error).message,
        });
      }
    }
    await this.invalidateCache(storeId);
    return results;
  }

  private async invalidateCache(storeId: string): Promise<void> {
    try {
      await this.opsCache.invalidateSection(storeId, 'rewards');
    } catch {
      this.logger.warn(`Cache invalidation skipped for store ${storeId}`);
    }
  }
}
