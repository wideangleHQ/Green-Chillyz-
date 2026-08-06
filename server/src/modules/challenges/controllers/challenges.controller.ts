import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ChallengeService } from '../services';
import {
  CreateChallengeDto,
  UpdateChallengeDto,
  DuplicateChallengeDto,
  ChallengeQueryDto,
  CreateChallengeRuleDto,
  UpdateChallengeRuleDto,
  CreateChallengeRewardDto,
  UpdateChallengeRewardDto,
} from '../dto';
import { CHALLENGE_PERMISSIONS } from '../constants';

@ApiTags('Challenges')
@Controller({ path: 'challenges', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChallengesController {
  constructor(private readonly service: ChallengeService) {}

  @Get()
  @Permissions(CHALLENGE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'List challenges with filters' })
  list(@Query() query: ChallengeQueryDto) {
    return this.service.list(query, null);
  }

  @Get(':id')
  @Permissions(CHALLENGE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'Get challenge by ID' })
  @ApiParam({ name: 'id', type: String })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Permissions(CHALLENGE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Create a challenge' })
  create(
    @Body() dto: CreateChallengeDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.create(dto, actorId);
  }

  @Patch(':id')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a challenge' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChallengeDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.update(id, dto, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(CHALLENGE_PERMISSIONS.DELETE)
  @ApiOperation({ summary: 'Archive a challenge (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.archive(id, actorId);
  }

  @Post(':id/restore')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Restore an archived challenge' })
  @ApiParam({ name: 'id', type: String })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.restore(id, actorId);
  }

  @Post(':id/publish')
  @Permissions(CHALLENGE_PERMISSIONS.PUBLISH)
  @ApiOperation({ summary: 'Publish a challenge' })
  @ApiParam({ name: 'id', type: String })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.publish(id, actorId);
  }

  @Post(':id/pause')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Pause a challenge' })
  @ApiParam({ name: 'id', type: String })
  pause(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.pause(id, actorId);
  }

  @Post(':id/end')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'End a challenge' })
  @ApiParam({ name: 'id', type: String })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.end(id, actorId);
  }

  @Post(':id/duplicate')
  @Permissions(CHALLENGE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: 'Duplicate a challenge' })
  @ApiParam({ name: 'id', type: String })
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateChallengeDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.duplicate(id, dto, actorId);
  }

  @Get(':id/history')
  @Permissions(CHALLENGE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'Get challenge history' })
  @ApiParam({ name: 'id', type: String })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getHistory(id);
  }

  // ─── Rules sub-CRUD ───────────────────────────────

  @Post('rules')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Add a rule to a challenge' })
  createRule(
    @Body() dto: CreateChallengeRuleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.createRule(dto, actorId);
  }

  @Patch('rules/:ruleId')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a challenge rule' })
  @ApiParam({ name: 'ruleId', type: String })
  updateRule(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() dto: UpdateChallengeRuleDto,
  ) {
    return this.service.updateRule(ruleId, dto);
  }

  @Delete('rules/:ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Delete a challenge rule' })
  @ApiParam({ name: 'ruleId', type: String })
  deleteRule(@Param('ruleId', ParseUUIDPipe) ruleId: string) {
    return this.service.deleteRule(ruleId);
  }

  // ─── Rewards sub-CRUD ─────────────────────────────

  @Post('rewards')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Add a reward to a challenge' })
  createReward(
    @Body() dto: CreateChallengeRewardDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.createReward(dto, actorId);
  }

  @Patch('rewards/:rewardId')
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update a challenge reward' })
  @ApiParam({ name: 'rewardId', type: String })
  updateReward(
    @Param('rewardId', ParseUUIDPipe) rewardId: string,
    @Body() dto: UpdateChallengeRewardDto,
  ) {
    return this.service.updateReward(rewardId, dto);
  }

  @Delete('rewards/:rewardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(CHALLENGE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Delete a challenge reward' })
  @ApiParam({ name: 'rewardId', type: String })
  deleteReward(@Param('rewardId', ParseUUIDPipe) rewardId: string) {
    return this.service.deleteReward(rewardId);
  }
}
