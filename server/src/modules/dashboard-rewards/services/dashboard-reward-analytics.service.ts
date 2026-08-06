import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardOpsCacheService } from '../../dashboard/common/services/dashboard-ops-cache.service';
import { DASHBOARD_REWARDS_CACHE } from '../constants';

@Injectable()
export class DashboardRewardAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opsCache: DashboardOpsCacheService,
  ) {}

  async getAnalytics(storeId: string) {
    const cached = await this.opsCache.get(
      storeId,
      'reward-analytics',
    );
    if (cached) return cached;

    const [
      profilesCount,
      activeProfilesCount,
      archivedProfilesCount,
      rulesCount,
      activeRulesCount,
      archivedRulesCount,
      overridesCount,
      assignedStoresCount,
      totalStoresCount,
    ] = await Promise.all([
      this.prisma.rewardProfile.count({ where: { deletedAt: null } }),
      this.prisma.rewardProfile.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.rewardProfile.count({ where: { status: 'ARCHIVED', deletedAt: null } }),
      this.prisma.profileRewardRule.count({ where: { deletedAt: null } }),
      this.prisma.profileRewardRule.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.profileRewardRule.count({ where: { status: 'ARCHIVED', deletedAt: null } }),
      this.prisma.rewardOverride.count({
        where: { storeId, status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.rewardAssignment.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.store.count({ where: { isActive: true, deletedAt: null } }),
    ]);

    const mostUsedReward = await this.prisma.profileRewardRule.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        name: true,
        rewardType: true,
        coinRequirement: true,
        _count: { select: { overrides: true } },
      },
      orderBy: { overrides: { _count: 'desc' } },
    });

    const analytics = {
      profiles: {
        total: profilesCount,
        active: activeProfilesCount,
        archived: archivedProfilesCount,
        draft: profilesCount - activeProfilesCount - archivedProfilesCount,
      },
      rules: {
        total: rulesCount,
        active: activeRulesCount,
        archived: archivedRulesCount,
      },
      overrides: {
        storeActive: overridesCount,
      },
      stores: {
        total: totalStoresCount,
        assigned: assignedStoresCount,
        unassigned: totalStoresCount - assignedStoresCount,
      },
      mostUsedReward: mostUsedReward
        ? {
            id: mostUsedReward.id,
            name: mostUsedReward.name,
            rewardType: mostUsedReward.rewardType,
            coinRequirement: mostUsedReward.coinRequirement,
            overrideCount: mostUsedReward._count.overrides,
          }
        : null,
    };

    await this.opsCache.set(
      storeId,
      'reward-analytics',
      analytics,
      DASHBOARD_REWARDS_CACHE.TTL.ANALYTICS,
    );

    return analytics;
  }
}
