import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardPermissionsGuard } from '../../dashboard/common/guards/dashboard-permissions.guard';
import { DashboardPermissions } from '../../dashboard/common/decorators/dashboard-permissions.decorator';
import { DashboardRewardAssignmentsService } from '../services';
import {
  DashboardAssignProfileDto,
  DashboardChangeAssignmentDto,
  DashboardBulkAssignDto,
} from '../dto';
import { DASHBOARD_REWARDS_PERMISSIONS } from '../constants';

@ApiTags('Dashboard Reward Assignments')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/reward-assignments', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardAssignmentsController {
  constructor(private readonly service: DashboardRewardAssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reward assignments' })
  list(
    @Query('storeId') storeId?: string,
    @Query('profileId') profileId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.list({
      storeId,
      profileId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('my-store')
  @ApiOperation({ summary: 'Get the assignment for the authenticated store' })
  getMyAssignment(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.getByStore(storeId);
  }

  @Get('my-store/profile')
  @ApiOperation({ summary: 'Resolve the active reward profile for the authenticated store' })
  getMyProfile(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.resolveStoreProfile(storeId);
  }

  @Get('my-store/history')
  @ApiOperation({ summary: 'Get assignment history for the authenticated store' })
  getMyHistory(@DashboardCurrentStore('storeId') storeId: string) {
    return this.service.getHistory(storeId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get the assignment for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  getByStore(@Param('storeId') storeId: string) {
    return this.service.getByStore(storeId);
  }

  @Get('store/:storeId/history')
  @ApiOperation({ summary: 'Get assignment history for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  getHistory(@Param('storeId') storeId: string) {
    return this.service.getHistory(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an assignment by ID' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.ASSIGNMENT_CREATE)
  @ApiOperation({ summary: 'Assign a reward profile to a store' })
  assign(
    @Body() dto: DashboardAssignProfileDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.assign(dto, storeId);
  }

  @Post('store/:storeId/change')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.ASSIGNMENT_UPDATE)
  @ApiOperation({ summary: 'Switch the reward profile for a store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  changeProfile(
    @Param('storeId') storeId: string,
    @Body() dto: DashboardChangeAssignmentDto,
    @DashboardCurrentStore('storeId') currentStoreId: string,
  ) {
    return this.service.changeProfile(storeId, dto, currentStoreId);
  }

  @Delete(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.ASSIGNMENT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  archive(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.archive(id, storeId, storeId);
  }

  @Post(':id/restore')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.ASSIGNMENT_UPDATE)
  @ApiOperation({ summary: 'Restore an archived assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  restore(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.restore(id, storeId, storeId);
  }

  @Post('bulk-assign')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.BULK_OPERATIONS)
  @ApiOperation({ summary: 'Bulk assign a profile to multiple stores' })
  bulkAssign(
    @Body() dto: DashboardBulkAssignDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.bulkAssign(dto, storeId);
  }
}
