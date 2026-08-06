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
import { DashboardRewardRulesService } from '../services';
import {
  DashboardCreateRuleDto,
  DashboardUpdateRuleDto,
  DashboardDuplicateRuleDto,
  DashboardBulkUpdateRulesDto,
  DashboardRuleQueryDto,
} from '../dto';
import { DASHBOARD_REWARDS_PERMISSIONS } from '../constants';

@ApiTags('Dashboard Reward Rules')
@ApiCookieAuth('gc_dashboard_access_token')
@Controller({ path: 'dashboard/reward-rules', version: '1' })
@UseGuards(DashboardAuthGuard, DashboardPermissionsGuard)
export class DashboardRewardRulesController {
  constructor(private readonly service: DashboardRewardRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List reward rules with filters' })
  list(@Query() query: DashboardRuleQueryDto) {
    return this.service.list(query);
  }

  @Get('milestones')
  @ApiOperation({ summary: 'Get active coin milestones' })
  getMilestones(@Query('profileId') profileId?: string) {
    return this.service.getMilestones(profileId);
  }

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Get all rules for a profile' })
  @ApiParam({ name: 'profileId', description: 'Profile UUID' })
  getByProfile(@Param('profileId') profileId: string) {
    return this.service.getByProfile(profileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reward rule by ID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_CREATE)
  @ApiOperation({ summary: 'Create a new reward rule' })
  create(
    @Body() dto: DashboardCreateRuleDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.create(dto, storeId);
  }

  @Patch(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Update a reward rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: DashboardUpdateRuleDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.update(id, dto, storeId);
  }

  @Delete(':id')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  archive(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.archive(id, storeId);
  }

  @Post(':id/restore')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Restore an archived reward rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  restore(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.restore(id, storeId);
  }

  @Post(':id/duplicate')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_CREATE)
  @ApiOperation({ summary: 'Duplicate a reward rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  duplicate(
    @Param('id') id: string,
    @Body() dto: DashboardDuplicateRuleDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.duplicate(id, dto, storeId);
  }

  @Post(':id/enable')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Enable a reward rule (set to ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  enable(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.enable(id, storeId);
  }

  @Post(':id/disable')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.RULE_UPDATE)
  @ApiOperation({ summary: 'Disable a reward rule (set to DISABLED)' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  disable(
    @Param('id') id: string,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.disable(id, storeId);
  }

  @Post('bulk-update')
  @DashboardPermissions(DASHBOARD_REWARDS_PERMISSIONS.BULK_OPERATIONS)
  @ApiOperation({ summary: 'Bulk update multiple reward rules' })
  bulkUpdate(
    @Body() dto: DashboardBulkUpdateRulesDto,
    @DashboardCurrentStore('storeId') storeId: string,
  ) {
    return this.service.bulkUpdate(dto, storeId);
  }
}
