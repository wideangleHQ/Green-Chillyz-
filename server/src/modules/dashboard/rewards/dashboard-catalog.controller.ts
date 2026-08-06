import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RewardStatus } from '@prisma/client';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { RewardCatalogService } from '../../rewards/services/reward-catalog.service';
import { RewardDetail } from '../../rewards/interfaces';
import {
  CreateRewardDto,
  UpdateRewardDto,
  AdminRewardQueryDto,
  CreateRewardCategoryDto,
  UpdateRewardCategoryDto,
} from '../../rewards/dto';

/**
 * Dashboard endpoint for managing the Reward Catalog.
 * 
 * Store managers can create and manage rewards for their outlet.
 * The storeId is automatically derived from the authenticated dashboard user,
 * preventing cross-store catalog manipulation.
 */
@ApiTags('Dashboard Reward Catalog')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/catalog', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardCatalogController {
  constructor(private readonly catalogService: RewardCatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'List all rewards for this store',
    description: 'Admin view of all rewards regardless of status, scoped to the authenticated store',
  })
  @ApiOkResponse({ description: 'Paginated list of rewards' })
  async listAdmin(
    @DashboardCurrentStore('storeId') storeId: string,
    @Query() query: AdminRewardQueryDto,
  ) {
    query.storeId = storeId;
    return this.catalogService.listAdmin(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new reward for this store',
    description: 'Store managers can create rewards. The storeId is automatically set from the authenticated user.',
  })
  @ApiOkResponse({ description: 'Reward created successfully' })
  async createReward(
    @DashboardCurrentStore('storeId') storeId: string,
    @DashboardCurrentStore('sessionId') sessionId: string,
    @Body() dto: CreateRewardDto,
  ) {
    dto.storeIds = [storeId];
    return this.catalogService.create(dto, sessionId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List reward categories' })
  async listCategories() {
    return this.catalogService.listCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a reward category' })
  async createCategory(@Body() dto: CreateRewardCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a reward category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reward details' })
  async getReward(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.getDetail(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reward' })
  async updateReward(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    const existing = await this.catalogService.getDetail(id);
    this.assertStoreOwnership(existing, storeId);
    return this.catalogService.update(id, dto);
  }

  @Patch(':id/status/:status')
  @ApiParam({ name: 'status', enum: RewardStatus })
  @ApiOperation({ summary: 'Change reward status (publish, pause, archive)' })
  async updateRewardStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: RewardStatus,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    const existing = await this.catalogService.getDetail(id);
    this.assertStoreOwnership(existing, storeId);
    return this.catalogService.updateStatus(id, status);
  }

  @Patch(':id/stock/:stock')
  @ApiOperation({ summary: 'Adjust reward stock levels' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stock') stock: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    const existing = await this.catalogService.getDetail(id);
    this.assertStoreOwnership(existing, storeId);
    return this.catalogService.adjustStock(id, parseInt(stock, 10));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a reward',
    description: 'Rewards with redemption history are archived instead of deleted',
  })
  async deleteReward(
    @Param('id', ParseUUIDPipe) id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    const existing = await this.catalogService.getDetail(id);
    this.assertStoreOwnership(existing, storeId);
    await this.catalogService.delete(id);
    return { message: 'Reward deleted successfully' };
  }

  private assertStoreOwnership(reward: RewardDetail, storeId: string): void {
    if (reward.stores.length > 0 && !reward.stores.some((s) => s.id === storeId)) {
      throw new ForbiddenException('Cannot manage rewards from another store');
    }
  }
}
