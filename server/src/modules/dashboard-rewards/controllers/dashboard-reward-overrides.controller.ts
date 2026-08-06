import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardPermissionsGuard } from '../../dashboard/common/guards/dashboard-permissions.guard';
import { DashboardPermissions } from '../../dashboard/common/decorators/dashboard-permissions.decorator';
import { DashboardRewardOverridesService } from '../services';
import {
  DashboardCreateOverrideDto,
  DashboardUpdateOverrideDto,
  DashboardBulkOverrideDto,
} from '../dto';
import { DASHBOARD_REWARDS_PERMISSIONS } from '../constants';

@ApiTags('Dashboard Reward Overrides')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/reward-overrides', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardOverridesController {
  constructor(private readonly service: DashboardRewardOverridesService) {}

  @Get()
  @ApiOperation({ summary: 'List active overrides for the authenticated store' })
  listMyOverrides(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.listByStore(storeId);
  }

  @Get('preview')
  @ApiOperation({ summary: 'Preview effective rewards for the authenticated store' })
  previewMyRewards(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.preview(storeId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get override history for the authenticated store' })
  getMyHistory(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.getHistory(storeId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List active overrides for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  listByStore(@Param('storeId') storeId: string) {
    return this.service.listByStore(storeId);
  }

  @Get('store/:storeId/preview')
  @ApiOperation({ summary: 'Preview effective rewards for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  previewStoreRewards(@Param('storeId') storeId: string) {
    return this.service.preview(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an override by ID' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.OVERRIDE_CREATE)
  @ApiOperation({ summary: 'Create a reward override for the authenticated store' })
  create(
    @Body() dto: DashboardCreateOverrideDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.create(storeId, dto, storeId);
  }

  @Patch(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.OVERRIDE_UPDATE)
  @ApiOperation({ summary: 'Update a reward override' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: DashboardUpdateOverrideDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.update(id, storeId, dto, storeId);
  }

  @Delete(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.OVERRIDE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward override' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  archive(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.archive(id, storeId, storeId);
  }

  @Post(':id/restore')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.OVERRIDE_UPDATE)
  @ApiOperation({ summary: 'Restore an archived override' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  restore(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.restore(id, storeId, storeId);
  }

  @Post('bulk')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.BULK_OPERATIONS)
  @ApiOperation({ summary: 'Bulk create overrides for the authenticated store' })
  bulkCreate(
    @Body() dto: DashboardBulkOverrideDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.bulkCreate(storeId, dto, storeId);
  }
}
