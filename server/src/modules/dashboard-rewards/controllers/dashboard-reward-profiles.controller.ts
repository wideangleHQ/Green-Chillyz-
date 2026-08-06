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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardCurrentStore } from '../../dashboard-auth/decorators';
import { DashboardPermissionsGuard } from '../../dashboard/common/guards/dashboard-permissions.guard';
import { DashboardPermissions } from '../../dashboard/common/decorators/dashboard-permissions.decorator';
import { DashboardRewardProfilesService } from '../services';
import {
  DashboardCreateProfileDto,
  DashboardUpdateProfileDto,
  DashboardDuplicateProfileDto,
  DashboardPublishProfileDto,
  DashboardProfileQueryDto,
} from '../dto';
import { DASHBOARD_REWARDS_PERMISSIONS } from '../constants';

@ApiTags('Dashboard Reward Profiles')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/reward-profiles', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardProfilesController {
  constructor(private readonly service: DashboardRewardProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List reward profiles with search and filters' })
  list(@Query() query: DashboardProfileQueryDto) {
    return this.service.list(query);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default reward profile' })
  getDefault() {
    return this.service.getDefault();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a reward profile by ID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'UUID or slug' })
  getById(@Param('idOrSlug') idOrSlug: string) {
    return this.service.getById(idOrSlug);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a profile' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  getVersions(@Param('id') id: string) {
    return this.service.getVersions(id);
  }

  @Post()
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_CREATE)
  @ApiOperation({ summary: 'Create a new reward profile' })
  create(
    @Body() dto: DashboardCreateProfileDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.create(dto, storeId);
  }

  @Patch(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_UPDATE)
  @ApiOperation({ summary: 'Update a reward profile' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: DashboardUpdateProfileDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.update(id, dto, storeId);
  }

  @Delete(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward profile' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  archive(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.archive(id, storeId);
  }

  @Post(':id/restore')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_UPDATE)
  @ApiOperation({ summary: 'Restore an archived reward profile' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  restore(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.restore(id, storeId);
  }

  @Post(':id/duplicate')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_CREATE)
  @ApiOperation({ summary: 'Duplicate a reward profile' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  duplicate(
    @Param('id') id: string,
    @Body() dto: DashboardDuplicateProfileDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.duplicate(id, dto, storeId);
  }

  @Post(':id/publish')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_PUBLISH)
  @ApiOperation({ summary: 'Publish a reward profile (DRAFT → ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  publish(
    @Param('id') id: string,
    @Body() dto: DashboardPublishProfileDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.publish(id, dto, storeId);
  }

  @Post(':id/set-default')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_UPDATE)
  @ApiOperation({ summary: 'Set a profile as the default' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  setDefault(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.setDefault(id, storeId);
  }

  @Post(':id/rollback/:versionNumber')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.PROFILE_UPDATE)
  @ApiOperation({ summary: 'Rollback a profile to a previous version' })
  @ApiParam({ name: 'id', description: 'Profile UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number to rollback to' })
  rollback(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.rollbackVersion(id, parseInt(versionNumber, 10), storeId);
  }
}
