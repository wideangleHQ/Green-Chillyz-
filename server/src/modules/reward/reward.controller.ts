import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CampaignStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtPayload } from '../auth/interfaces';
import { RewardEngineService, CampaignService } from './services';
import {
  EvaluateRewardDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
  CreateRuleDto,
  RewardHistoryQueryDto,
} from './dto';
import { REWARD_PERMISSIONS } from './constants';
import { RewardEvent } from './interfaces';

@ApiTags('Reward Engine')
@Controller({ path: 'rewards', version: '1' })
export class RewardController {
  constructor(
    private readonly rewardEngine: RewardEngineService,
    private readonly campaignService: CampaignService,
  ) {}

  @Post('evaluate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.GRANT_REWARD)
  @ApiOperation({
    summary: 'Evaluate a reward event',
    description:
      'Returns a RewardDecision. Does NOT modify wallet balances. ' +
      'The caller is responsible for calling WalletService.credit() with the returned decision.',
  })
  async evaluate(
    @Body() dto: EvaluateRewardDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const event: RewardEvent = {
      eventType: dto.eventType,
      userId: dto.userId,
      source: dto.source,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      storeId: dto.storeId,
      brandId: dto.brandId,
      purchaseAmount: dto.purchaseAmount,
      metadata: dto.metadata,
      ip: req.ip,
      device: req.headers['user-agent'] as string,
      initiatorId: user.sub,
    };

    return this.rewardEngine.evaluateReward(event);
  }

  @Post('campaigns')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_CREATE)
  @ApiOperation({ summary: 'Create a reward campaign' })
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaignService.create(dto, user.sub);
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_VIEW)
  @ApiOperation({ summary: 'List reward campaigns' })
  async listCampaigns(@Query() query: CampaignQueryDto) {
    return this.campaignService.findAll(query);
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_VIEW)
  @ApiOperation({ summary: 'Get a reward campaign by ID' })
  async getCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignService.findById(id);
  }

  @Patch('campaigns/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_UPDATE)
  @ApiOperation({ summary: 'Update a reward campaign' })
  async updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaignService.update(id, dto, user.sub);
  }

  @Patch('campaigns/:id/status/:status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_UPDATE)
  @ApiOperation({ summary: 'Update campaign status' })
  async updateCampaignStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: CampaignStatus,
  ) {
    return this.campaignService.updateStatus(id, status);
  }

  @Post('rules')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_UPDATE)
  @ApiOperation({ summary: 'Add a rule to a campaign' })
  async addRule(@Body() dto: CreateRuleDto) {
    return this.campaignService.addRule(dto);
  }

  @Get('rules/:campaignId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_VIEW)
  @ApiOperation({ summary: 'Get rules for a campaign' })
  async getRules(@Param('campaignId', ParseUUIDPipe) campaignId: string) {
    return this.campaignService.getRules(campaignId);
  }

  @Delete('rules/:ruleId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.CAMPAIGN_UPDATE)
  @ApiOperation({ summary: 'Remove a rule' })
  async removeRule(@Param('ruleId', ParseUUIDPipe) ruleId: string) {
    await this.campaignService.removeRule(ruleId);
    return { message: 'Rule removed successfully' };
  }

  @Get('history/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user reward history' })
  async getMyHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: RewardHistoryQueryDto,
  ) {
    return this.campaignService.getHistory(user.sub, query);
  }

  @Get('history/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARD_PERMISSIONS.VIEW_HISTORY)
  @ApiOperation({ summary: 'Get any user reward history (admin)' })
  async getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: RewardHistoryQueryDto,
  ) {
    return this.campaignService.getHistory(userId, query);
  }
}
