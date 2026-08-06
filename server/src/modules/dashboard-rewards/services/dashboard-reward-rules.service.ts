import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardRulesService } from '../../reward-rules/services';
import { DashboardOpsCacheService } from '../../dashboard/common/services/dashboard-ops-cache.service';
import {
  DashboardCreateRuleDto,
  DashboardUpdateRuleDto,
  DashboardDuplicateRuleDto,
  DashboardBulkUpdateRulesDto,
  DashboardRuleQueryDto,
} from '../dto';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

@Injectable()
export class DashboardRewardRulesService {
  private readonly logger = new Logger(DashboardRewardRulesService.name);

  constructor(
    private readonly rulesService: RewardRulesService,
    private readonly opsCache: DashboardOpsCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async list(query: DashboardRuleQueryDto) {
    return this.rulesService.findAll({
      profileId: query.profileId,
      status: query.status,
      ruleType: query.ruleType,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async getById(id: string) {
    return this.rulesService.findById(id);
  }

  async getByProfile(profileId: string) {
    return this.rulesService.findByProfile(profileId);
  }

  async create(dto: DashboardCreateRuleDto, storeId: string) {
    const rule = await this.rulesService.create(dto, storeId);
    await this.invalidateCache(storeId);
    return rule;
  }

  async update(id: string, dto: DashboardUpdateRuleDto, storeId: string) {
    const rule = await this.rulesService.update(id, dto, storeId);
    await this.invalidateCache(storeId);
    return rule;
  }

  async archive(id: string, storeId: string) {
    await this.rulesService.archive(id, storeId);
    await this.invalidateCache(storeId);
  }

  async restore(id: string, storeId: string) {
    const rule = await this.rulesService.restore(id, storeId);
    await this.invalidateCache(storeId);
    return rule;
  }

  async duplicate(id: string, dto: DashboardDuplicateRuleDto, storeId: string) {
    const rule = await this.rulesService.duplicate(id, { name: dto.name }, storeId);
    await this.invalidateCache(storeId);
    return rule;
  }

  async enable(id: string, storeId: string) {
    const rule = await this.rulesService.update(id, { status: 'ACTIVE' as any }, storeId);
    this.events.emit(DASHBOARD_REWARDS_EVENTS.RULE_PUBLISHED, {
      ruleId: id,
      publishedBy: storeId,
    });
    await this.invalidateCache(storeId);
    return rule;
  }

  async disable(id: string, storeId: string) {
    const rule = await this.rulesService.update(id, { status: 'DISABLED' as any }, storeId);
    await this.invalidateCache(storeId);
    return rule;
  }

  async bulkUpdate(dto: DashboardBulkUpdateRulesDto, storeId: string) {
    const results = [];
    for (const ruleId of dto.ruleIds) {
      const updateDto: Record<string, unknown> = {};
      if (dto.status) updateDto.status = dto.status;
      if (dto.priority !== undefined) updateDto.priority = dto.priority;
      const rule = await this.rulesService.update(ruleId, updateDto, storeId);
      results.push(rule);
    }
    await this.invalidateCache(storeId);
    return results;
  }

  async getMilestones(profileId?: string) {
    return this.rulesService.findMilestones(profileId);
  }

  private async invalidateCache(storeId: string): Promise<void> {
    try {
      await this.opsCache.invalidateSection(storeId, 'rewards');
    } catch {
      this.logger.warn(`Cache invalidation skipped for store ${storeId}`);
    }
  }
}
