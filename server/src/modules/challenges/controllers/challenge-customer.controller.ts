import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { ChallengeProgressService } from '../services';
import { ChallengeRewardClaimService } from '../services';
import {
  RecordProgressDto,
  ClaimRewardDto,
  CustomerChallengeQueryDto,
} from '../dto';

@ApiTags('Customer Challenges')
@Controller({ path: 'my/challenges', version: '1' })
@UseGuards(JwtAuthGuard)
export class ChallengeCustomerController {
  constructor(
    private readonly progress: ChallengeProgressService,
    private readonly rewards: ChallengeRewardClaimService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get active challenges for the current user' })
  getChallenges(
    @CurrentUser('id') userId: string,
    @Query() query: CustomerChallengeQueryDto,
  ) {
    return this.progress.getActiveChallenges(userId, query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming challenges' })
  getUpcoming(@CurrentUser('id') userId: string) {
    return this.progress.getUpcomingChallenges(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed challenge history' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: CustomerChallengeQueryDto,
  ) {
    return this.progress.getHistory(userId, query.page, query.pageSize);
  }

  @Get(':challengeId/progress')
  @ApiOperation({ summary: 'Get progress for a specific challenge' })
  @ApiParam({ name: 'challengeId', type: String })
  getProgress(
    @CurrentUser('id') userId: string,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    return this.progress.getProgress(userId, challengeId);
  }

  @Post('progress')
  @ApiOperation({ summary: 'Record progress on a challenge' })
  recordProgress(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordProgressDto,
  ) {
    return this.progress.recordProgress(userId, dto);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim reward for a completed challenge' })
  claimReward(
    @CurrentUser('id') userId: string,
    @Body() dto: ClaimRewardDto,
  ) {
    return this.rewards.claimReward(userId, dto.challengeId);
  }
}
