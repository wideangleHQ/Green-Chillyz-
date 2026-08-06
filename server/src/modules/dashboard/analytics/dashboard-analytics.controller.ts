import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardAnalyticsService } from './dashboard-analytics.service';

@ApiTags('Dashboard Analytics')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/analytics', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardAnalyticsController {
  constructor(private readonly analyticsService: DashboardAnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Today’s operational counters for the store',
    description:
      'New customers, wallet credits/debits, reward and voucher redemptions, ' +
      'game plays and notifications since midnight. Cached for one minute ' +
      'and invalidated on movements.',
  })
  @ApiOkResponse({ description: 'Today’s totals' })
  async getOverview(@DashboardCurrentStore('storeId') storeId: string) {
    return this.analyticsService.getOverview(storeId);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Per-day series for the last 7 days' })
  async getDaily(@DashboardCurrentStore('storeId') storeId: string) {
    return this.analyticsService.getDaily(storeId);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Per-week series for the last 8 weeks' })
  async getWeekly(@DashboardCurrentStore('storeId') storeId: string) {
    return this.analyticsService.getWeekly(storeId);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Per-month series for the last 6 months' })
  async getMonthly(@DashboardCurrentStore('storeId') storeId: string) {
    return this.analyticsService.getMonthly(storeId);
  }
}
