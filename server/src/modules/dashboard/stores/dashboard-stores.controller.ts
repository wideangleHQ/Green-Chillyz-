import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardActivityQueryDto } from '../customers/dto/dashboard-customer.dto';
import { DashboardStoresService } from './dashboard-stores.service';

@ApiTags('Dashboard Store')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/stores', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardStoresController {
  constructor(private readonly storesService: DashboardStoresService) {}

  @Get('me')
  @ApiOperation({
    summary: 'The authenticated store’s full profile',
    description:
      'Identity, timings, gallery and facilities from the shared StoreService.',
  })
  async getMe(@DashboardCurrentStore('storeId') storeId: string) {
    return this.storesService.getMe(storeId);
  }

  @Get('me/stats')
  @ApiOperation({
    summary: 'Operational statistics for the store',
    description:
      'Customer counts, active vouchers, today’s redemptions and wallet ' +
      'totals. Cached briefly and invalidated on movements.',
  })
  @ApiOkResponse({ description: 'Store statistics snapshot' })
  async getStats(@DashboardCurrentStore('storeId') storeId: string) {
    return this.storesService.getStats(storeId);
  }

  @Get('me/activity')
  @ApiOperation({
    summary: 'Latest operational events at the store',
    description:
      'Chronological merge of redemptions, voucher scans and new customers.',
  })
  async getActivity(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: DashboardActivityQueryDto,
  ) {
    return this.storesService.getActivity(storeId, query);
  }
}
