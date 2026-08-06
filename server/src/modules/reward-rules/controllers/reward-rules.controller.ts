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
import { RewardRulesService } from '../services';
import {
  CreateRewardRuleDto,
  UpdateRewardRuleDto,
  DuplicateRewardRuleDto,
  RewardRuleQueryDto,
} from '../dto';
import { REWARD_RULE_PERMISSIONS } from '../constants';

@ApiTags('Reward Rules')
@Controller({ path: 'reward-rules', version: '1' })
export class RewardRulesController {
  constructor(private readonly service: RewardRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List reward rules with filters and pagination' })
  findAll(@Query() query: RewardRuleQueryDto) {
    return this.service.findAll(query);
  }

  @Get('milestones')
  @ApiOperation({ summary: 'Get active coin milestones (public/customer API)' })
  findMilestones(@Query('profileId') profileId?: string) {
    return this.service.findMilestones(profileId);
  }

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Get all rules for a reward profile (public/customer API)' })
  @ApiParam({ name: 'profileId', description: 'Reward profile UUID or slug' })
  findByProfile(@Param('profileId') profileId: string) {
    return this.service.findByProfile(profileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reward rule by ID' })
  @ApiParam({ name: 'id', description: 'Reward rule UUID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_RULE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a reward rule' })
  create(@Body() dto: CreateRewardRuleDto, @CurrentUser('id') userId?: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_RULE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a reward rule' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRewardRuleDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_RULE_PERMISSIONS.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a reward rule (soft delete)' })
  archive(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.service.archive(id, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_RULE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Restore an archived reward rule' })
  restore(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.service.restore(id, userId);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_RULE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Duplicate a reward rule' })
  duplicate(
    @Param('id') id: string,
    @Body() dto: DuplicateRewardRuleDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.service.duplicate(id, dto, userId);
  }
}
