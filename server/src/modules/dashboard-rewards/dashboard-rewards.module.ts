import { Module } from '@nestjs/common';
import { DashboardAuthModule } from '../dashboard-auth/dashboard-auth.module';
import { RewardProfileModule } from '../reward-profile/reward-profile.module';
import { RewardRulesModule } from '../reward-rules/reward-rules.module';
import { RewardAssignmentModule } from '../reward-assignment/reward-assignment.module';
import { RewardOverridesModule } from '../reward-overrides/reward-overrides.module';
import { DashboardPermissionsGuard } from '../dashboard/common/guards/dashboard-permissions.guard';
import { DashboardOpsCacheService } from '../dashboard/common/services/dashboard-ops-cache.service';
import {
  DashboardRewardProfilesController,
  DashboardRewardRulesController,
  DashboardRewardAssignmentsController,
  DashboardRewardOverridesController,
  DashboardRewardAnalyticsController,
  DashboardRewardSearchController,
} from './controllers';
import {
  DashboardRewardProfilesService,
  DashboardRewardRulesService,
  DashboardRewardAssignmentsService,
  DashboardRewardOverridesService,
  DashboardRewardAnalyticsService,
  DashboardRewardSearchService,
} from './services';

@Module({
  imports: [
    DashboardAuthModule,
    RewardProfileModule,
    RewardRulesModule,
    RewardAssignmentModule,
    RewardOverridesModule,
  ],
  controllers: [
    DashboardRewardProfilesController,
    DashboardRewardRulesController,
    DashboardRewardAssignmentsController,
    DashboardRewardOverridesController,
    DashboardRewardAnalyticsController,
    DashboardRewardSearchController,
  ],
  providers: [
    DashboardPermissionsGuard,
    DashboardOpsCacheService,
    DashboardRewardProfilesService,
    DashboardRewardRulesService,
    DashboardRewardAssignmentsService,
    DashboardRewardOverridesService,
    DashboardRewardAnalyticsService,
    DashboardRewardSearchService,
  ],
})
export class DashboardRewardsModule {}
