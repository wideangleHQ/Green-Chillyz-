import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { RewardQueryDto } from '../../rewards/dto';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardRewardsService } from './dashboard-rewards.service';
import { DashboardRedemptionQueryDto } from './dto/dashboard-reward.dto';

@ApiTags('Dashboard Rewards')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/rewards', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardsController {
  constructor(private readonly rewardsService: DashboardRewardsService) {}

  @Get()
  @ApiOperation({
    summary: 'Reward catalog available at this store',
    description:
      'Paginated catalog with category, cost, stock and availability filters. ' +
      'Scoped to rewards redeemable at the authenticated store.',
  })
  @ApiOkResponse({ description: 'Paginated reward catalog' })
  async list(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: RewardQueryDto,
  ) {
    return this.rewardsService.list(storeId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Reward detail with redemption statistics',
    description:
      'Catalog detail (stock, cost, validity, terms) enriched with view and ' +
      'redemption counters.',
  })
  async getDetail(@Param('id') idOrSlug: string) {
    return this.rewardsService.getDetail(idOrSlug);
  }

  @Get(':id/redemptions')
  @ApiOperation({
    summary: 'Recent redemptions of this reward at this store',
  })
  async getRedemptions(
    @DashboardCurrentStore('storeId') storeId: string,
    @Param('id', ParseUUIDPipe) rewardId: string,
    @Query() query: DashboardRedemptionQueryDto,
  ) {
    return this.rewardsService.getRedemptions(storeId, rewardId, query);
  }
}
