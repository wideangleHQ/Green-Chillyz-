import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../../dashboard/common/guards/dashboard-permissions.guard';
import { DashboardRewardSearchService } from '../services';
import { DashboardRewardSearchDto } from '../dto';

@ApiTags('Dashboard Reward Search')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/reward-search', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardSearchController {
  constructor(private readonly service: DashboardRewardSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across profiles, rules, stores, assignments and overrides' })
  search(@Query() query: DashboardRewardSearchDto) {
    return this.service.search(query);
  }
}
