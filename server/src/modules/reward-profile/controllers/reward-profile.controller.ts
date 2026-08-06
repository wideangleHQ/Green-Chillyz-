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
import { RewardProfileService } from '../services';
import {
  CreateRewardProfileDto,
  UpdateRewardProfileDto,
  DuplicateRewardProfileDto,
  RewardProfileQueryDto,
} from '../dto';
import { REWARD_PROFILE_PERMISSIONS } from '../constants';

@ApiTags('Reward Profiles')
@Controller({ path: 'reward-profiles', version: '1' })
export class RewardProfileController {
  constructor(private readonly service: RewardProfileService) {}

  @Get()
  @ApiOperation({ summary: 'List reward profiles with filters and pagination' })
  findAll(@Query() query: RewardProfileQueryDto) {
    return this.service.findAll(query);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default reward profile' })
  findDefault() {
    return this.service.findDefault();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a reward profile by ID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'UUID or slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.service.findByIdOrSlug(idOrSlug);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions of a reward profile' })
  findVersions(@Param('id') id: string) {
    return this.service.findVersions(id);
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get metadata for a reward profile' })
  findMetadata(@Param('id') id: string) {
    return this.service.findMetadata(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PROFILE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a reward profile' })
  create(@Body() dto: CreateRewardProfileDto, @CurrentUser('id') userId?: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PROFILE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a reward profile' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardProfileDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PROFILE_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward profile (soft delete)' })
  archive(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.service.archive(id, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PROFILE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Restore an archived reward profile' })
  restore(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.service.restore(id, userId);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PROFILE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Duplicate a reward profile' })
  duplicate(
    @Param('id') id: string,
    @Body() dto: DuplicateRewardProfileDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.duplicate(id, dto, userId);
  }
}
