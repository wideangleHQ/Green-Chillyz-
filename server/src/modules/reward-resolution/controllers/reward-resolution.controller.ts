import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RewardResolutionService } from '../services';
import {
  ResolveRewardDto,
  PreviewRewardDto,
  ResolveCoinsDto,
  ResolveMilestoneDto,
  ResolveVoucherDto,
  ResolveCampaignRewardDto,
  ResolveStoreRewardDto,
  CustomerSummaryDto,
} from '../dto';

@ApiTags('Reward Resolution')
@ApiBearerAuth('access-token')
@Controller({ path: 'reward-resolution', version: '1' })
export class RewardResolutionController {
  constructor(private readonly service: RewardResolutionService) {}

  @Post('resolve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('rewards.resolve')
  @ApiOperation({ summary: 'Resolve the best reward for a customer at a store' })
  resolveReward(@Body() dto: ResolveRewardDto) {
    return this.service.resolveReward({
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Preview reward resolution without persisting (simulation mode)' })
  previewReward(@Body() dto: PreviewRewardDto) {
    return this.service.previewReward({
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  @Post('resolve-coins')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('rewards.resolve')
  @ApiOperation({ summary: 'Resolve coin earning for a customer' })
  resolveCoins(@Body() dto: ResolveCoinsDto) {
    return this.service.resolveCoins(
      dto.customerId,
      dto.storeId,
      dto.ruleType,
      {
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        metadata: dto.metadata,
        device: dto.device,
        ip: dto.ip,
      },
    );
  }

  @Post('resolve-milestone')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Resolve the highest milestone a customer has reached' })
  resolveMilestone(@Body() dto: ResolveMilestoneDto) {
    return this.service.resolveMilestone(dto.customerId, dto.storeId, dto.coinBalance);
  }

  @Post('resolve-voucher')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('rewards.resolve')
  @ApiOperation({ summary: 'Resolve a voucher reward for a specific rule' })
  resolveVoucher(@Body() dto: ResolveVoucherDto) {
    return this.service.resolveVoucher(dto.customerId, dto.storeId, dto.ruleId);
  }

  @Post('resolve-campaign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('rewards.resolve')
  @ApiOperation({ summary: 'Resolve reward from an active campaign' })
  resolveCampaignReward(@Body() dto: ResolveCampaignRewardDto) {
    return this.service.resolveCampaignReward(
      dto.customerId,
      dto.storeId,
      dto.campaignContext,
      dto.device,
      dto.ip,
    );
  }

  @Post('resolve-store')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Resolve store-specific reward (override → profile → global)' })
  resolveStoreReward(@Body() dto: ResolveStoreRewardDto) {
    return this.service.resolveStoreReward(
      dto.customerId,
      dto.storeId,
      dto.rewardType,
      dto.coinBalance,
    );
  }

  @Get('customer-summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get a full reward summary for a customer at a store' })
  getCustomerSummary(@Query() query: CustomerSummaryDto) {
    return this.service.getCustomerSummary(query.customerId, query.storeId);
  }
}
