import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardPermissionsGuard } from '../../dashboard/common/guards/dashboard-permissions.guard';
import { DashboardRewardAnalyticsService } from '../services';

@ApiTags('Dashboard Reward Analytics')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/reward-analytics', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardAnalyticsController {
  constructor(private readonly service: DashboardRewardAnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get reward management analytics' })
  getAnalytics(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.getAnalytics(storeId);
  }
}
