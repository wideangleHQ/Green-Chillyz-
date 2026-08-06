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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators';
import { RewardOverridesService } from '../services';
import {
  CreateRewardOverrideDto,
  UpdateRewardOverrideDto,
  RewardOverrideQueryDto,
} from '../dto';
import { REWARD_OVERRIDE_PERMISSIONS } from '../constants';

@ApiTags('Reward Overrides')
@Controller({ path: 'reward-overrides', version: '1' })
export class RewardOverridesController {
  constructor(private readonly service: RewardOverridesService) {}

  @Get()
  @ApiOperation({ summary: 'List reward overrides with filters and pagination' })
  findAll(@Query() query: RewardOverrideQueryDto) {
    return this.service.findAll(query);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get active overrides for a store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  findByStore(@Param('storeId') storeId: string) {
    return this.service.findByStore(storeId);
  }

  @Get('store/:storeId/preview')
  @ApiOperation({ summary: 'Preview effective rewards for a store after applying overrides' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  previewEffectiveRewards(@Param('storeId') storeId: string) {
    return this.service.previewEffectiveRewards(storeId);
  }

  @Get('store/:storeId/history')
  @ApiOperation({ summary: 'Get override history for a store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  findHistory(@Param('storeId') storeId: string) {
    return this.service.findHistory(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reward override by ID' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_OVERRIDE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a reward override for a store' })
  create(
    @Body() dto: CreateRewardOverrideDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_OVERRIDE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a reward override' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardOverrideDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_OVERRIDE_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward override' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  archive(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.archive(id, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_OVERRIDE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Restore an archived reward override' })
  @ApiParam({ name: 'id', description: 'Override UUID' })
  restore(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.restore(id, userId);
  }
}
