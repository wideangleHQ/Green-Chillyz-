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
import { RewardAssignmentService } from '../services';
import {
  CreateRewardAssignmentDto,
  UpdateRewardAssignmentDto,
  ChangeAssignmentDto,
  RewardAssignmentQueryDto,
} from '../dto';
import { REWARD_ASSIGNMENT_PERMISSIONS } from '../constants';

@ApiTags('Reward Assignments')
@Controller({ path: 'reward-assignments', version: '1' })
export class RewardAssignmentController {
  constructor(private readonly service: RewardAssignmentService) {}

  @Get()
  @ApiOperation({ summary: 'List reward assignments with filters and pagination' })
  findAll(@Query() query: RewardAssignmentQueryDto) {
    return this.service.findAll(query);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get active assignment for a store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  findByStore(@Param('storeId') storeId: string) {
    return this.service.findByStore(storeId);
  }

  @Get('store/:storeId/profile')
  @ApiOperation({ summary: 'Resolve the active reward profile for a store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  resolveStoreProfile(@Param('storeId') storeId: string) {
    return this.service.resolveStoreProfile(storeId);
  }

  @Get('store/:storeId/history')
  @ApiOperation({ summary: 'Get assignment history for a store' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  findHistory(@Param('storeId') storeId: string) {
    return this.service.findHistory(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reward assignment by ID' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_ASSIGNMENT_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Assign a reward profile to a store' })
  assign(
    @Body() dto: CreateRewardAssignmentDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.assign(dto, userId);
  }

  @Post('store/:storeId/change')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_ASSIGNMENT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Switch the reward profile for a store (archives previous)' })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  changeProfile(
    @Param('storeId') storeId: string,
    @Body() dto: ChangeAssignmentDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.changeProfile(storeId, dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_ASSIGNMENT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a reward assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardAssignmentDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_ASSIGNMENT_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  archive(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.archive(id, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_ASSIGNMENT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Restore an archived reward assignment' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  restore(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.restore(id, userId);
  }
}
