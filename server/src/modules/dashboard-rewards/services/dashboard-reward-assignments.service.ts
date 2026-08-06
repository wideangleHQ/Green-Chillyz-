import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardAssignmentService } from '../../reward-assignment/services';
import { DashboardOpsCacheService } from '../../dashboard/common/services/dashboard-ops-cache.service';
import {
  DashboardAssignProfileDto,
  DashboardChangeAssignmentDto,
  DashboardBulkAssignDto,
} from '../dto';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

@Injectable()
export class DashboardRewardAssignmentsService {
  private readonly logger = new Logger(DashboardRewardAssignmentsService.name);

  constructor(
    private readonly assignmentService: RewardAssignmentService,
    private readonly opsCache: DashboardOpsCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async list(query: { storeId?: string; profileId?: string; page?: number; pageSize?: number }) {
    return this.assignmentService.findAll(query);
  }

  async getById(id: string) {
    return this.assignmentService.findById(id);
  }

  async getByStore(storeId: string) {
    return this.assignmentService.findByStore(storeId);
  }

  async getHistory(storeId: string) {
    return this.assignmentService.findHistory(storeId);
  }

  async assign(dto: DashboardAssignProfileDto, assignedBy: string) {
    const assignment = await this.assignmentService.assign(dto, assignedBy);
    this.events.emit(DASHBOARD_REWARDS_EVENTS.ASSIGNMENT_CHANGED, {
      storeId: dto.storeId,
      profileId: dto.profileId,
      action: 'ASSIGNED',
      changedBy: assignedBy,
    });
    await this.invalidateCache(dto.storeId);
    return assignment;
  }

  async changeProfile(storeId: string, dto: DashboardChangeAssignmentDto, changedBy: string) {
    const assignment = await this.assignmentService.changeProfile(
      storeId,
      { profileId: dto.profileId, reason: dto.reason },
      changedBy,
    );
    this.events.emit(DASHBOARD_REWARDS_EVENTS.ASSIGNMENT_CHANGED, {
      storeId,
      profileId: dto.profileId,
      action: 'CHANGED',
      changedBy,
    });
    await this.invalidateCache(storeId);
    return assignment;
  }

  async archive(id: string, storeId: string, archivedBy: string) {
    await this.assignmentService.archive(id, archivedBy);
    this.events.emit(DASHBOARD_REWARDS_EVENTS.ASSIGNMENT_CHANGED, {
      storeId,
      action: 'ARCHIVED',
      changedBy: archivedBy,
    });
    await this.invalidateCache(storeId);
  }

  async restore(id: string, storeId: string, restoredBy: string) {
    const assignment = await this.assignmentService.restore(id, restoredBy);
    await this.invalidateCache(storeId);
    return assignment;
  }

  async bulkAssign(dto: DashboardBulkAssignDto, assignedBy: string) {
    const results = [];
    for (const storeId of dto.storeIds) {
      try {
        const existing = await this.assignmentService.findByStore(storeId).catch(() => null);
        let assignment;
        if (existing) {
          assignment = await this.assignmentService.changeProfile(
            storeId,
            { profileId: dto.profileId, reason: dto.reason },
            assignedBy,
          );
        } else {
          assignment = await this.assignmentService.assign(
            { storeId, profileId: dto.profileId, reason: dto.reason },
            assignedBy,
          );
        }
        results.push({ storeId, success: true, assignment });
        await this.invalidateCache(storeId);
      } catch (error) {
        results.push({ storeId, success: false, error: (error as Error).message });
      }
    }
    return results;
  }

  async resolveStoreProfile(storeId: string) {
    return this.assignmentService.resolveStoreProfile(storeId);
  }

  private async invalidateCache(storeId: string): Promise<void> {
    try {
      await this.opsCache.invalidateSection(storeId, 'rewards');
    } catch {
      this.logger.warn(`Cache invalidation skipped for store ${storeId}`);
    }
  }
}
