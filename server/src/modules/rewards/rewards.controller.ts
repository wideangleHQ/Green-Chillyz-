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
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { RewardStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtPayload } from '../auth/interfaces';
import {
  RewardCatalogService,
  RewardRedemptionService,
  RewardEligibilityService,
  VoucherService,
  RewardAnalyticsService,
} from './services';
import {
  CreateRewardDto,
  UpdateRewardDto,
  RewardQueryDto,
  AdminRewardQueryDto,
  CreateRewardCategoryDto,
  UpdateRewardCategoryDto,
  RedeemRewardDto,
  VoucherQueryDto,
  VerifyVoucherDto,
  TrackRewardEventDto,
} from './dto';
import { REWARDS_PERMISSIONS, REWARD_ANALYTICS_EVENTS } from './constants';

@ApiTags('Rewards Catalog')
@Controller({ path: 'rewards-catalog', version: '1' })
export class RewardsController {
  constructor(
    private readonly catalogService: RewardCatalogService,
    private readonly redemptionService: RewardRedemptionService,
    private readonly eligibilityService: RewardEligibilityService,
    private readonly voucherService: VoucherService,
    private readonly analyticsService: RewardAnalyticsService,
  ) {}

  // ─── Catalog ──────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Browse the rewards catalog',
    description:
      'Paginated, filterable list of published rewards. Supports search, category, brand, store, type, price ceiling and sorting.',
  })
  async listCatalog(@Query() query: RewardQueryDto) {
    return this.catalogService.listCatalog(query);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active reward categories with counts' })
  async listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('featured')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Featured rewards for the catalog hero' })
  async listFeatured() {
    return this.catalogService.getFeatured();
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Most redeemed rewards' })
  async listPopular() {
    return this.catalogService.getPopular();
  }

  // ─── Vouchers (declared before :idOrSlug to avoid capture) ──

  @Get('vouchers/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List my vouchers',
    description: 'Active, used and expired vouchers for the signed-in user, with QR for active ones.',
  })
  async listMyVouchers(
    @CurrentUser() user: JwtPayload,
    @Query() query: VoucherQueryDto,
  ) {
    return this.voucherService.listUserVouchers(user.sub, query);
  }

  @Get('vouchers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get one of my vouchers, including its QR code' })
  async getMyVoucher(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.voucherService.getUserVoucher(user.sub, id);
  }

  @Post('vouchers/verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.VOUCHER_VERIFY)
  @ApiOperation({
    summary: 'Verify a scanned voucher (staff)',
    description: 'Validates signature, status, expiry and store match without mutating the voucher.',
  })
  async verifyVoucher(@Body() dto: VerifyVoucherDto) {
    return this.voucherService.verifyVoucher(dto.code, dto.signature, dto.storeId);
  }

  @Post('vouchers/redeem')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.VOUCHER_REDEEM)
  @ApiOperation({
    summary: 'Mark a voucher as used (staff)',
    description: 'Atomically transitions an ACTIVE voucher to USED. Replay-safe.',
  })
  async redeemVoucher(@Body() dto: VerifyVoucherDto, @CurrentUser() user: JwtPayload) {
    return this.voucherService.redeemVoucher(
      dto.code,
      dto.signature,
      user.sub,
      dto.storeId,
    );
  }

  // ─── Redemptions ──────────────────────────────────────

  @Get('redemptions/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'My redemption history' })
  async listMyRedemptions(
    @CurrentUser() user: JwtPayload,
    @Query() query: VoucherQueryDto,
  ) {
    return this.redemptionService.listUserRedemptions(user.sub, query);
  }

  // ─── Admin (declared before :idOrSlug) ────────────────

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.REWARD_VIEW_ADMIN)
  @ApiOperation({ summary: 'List all rewards regardless of status (Admin)' })
  async listAdmin(@Query() query: AdminRewardQueryDto) {
    return this.catalogService.listAdmin(query);
  }

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Catalog-wide analytics overview (Admin)' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.REWARD_CREATE)
  @ApiOperation({ summary: 'Create a reward (Admin)' })
  async createReward(@Body() dto: CreateRewardDto, @CurrentUser() user: JwtPayload) {
    return this.catalogService.create(dto, user.sub);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Create a reward category (Admin)' })
  async createCategory(@Body() dto: CreateRewardCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.CATEGORY_MANAGE)
  @ApiOperation({ summary: 'Update a reward category (Admin)' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.REWARD_UPDATE)
  @ApiOperation({ summary: 'Update a reward (Admin)' })
  async updateReward(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.catalogService.update(id, dto);
  }

  @Patch(':id/status/:status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.REWARD_UPDATE)
  @ApiParam({ name: 'status', enum: RewardStatus })
  @ApiOperation({ summary: 'Publish, pause or archive a reward (Admin)' })
  async updateRewardStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: RewardStatus,
  ) {
    return this.catalogService.updateStatus(id, status);
  }

  @Patch(':id/stock/:stock')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.REWARD_UPDATE)
  @ApiOperation({ summary: 'Adjust reward inventory (Admin)' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stock') stock: string,
  ) {
    return this.catalogService.adjustStock(id, parseInt(stock, 10));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.REWARD_DELETE)
  @ApiOperation({
    summary: 'Delete a reward (Admin)',
    description: 'Rewards with redemption history are archived instead of deleted.',
  })
  async deleteReward(@Param('id', ParseUUIDPipe) id: string) {
    await this.catalogService.delete(id);
    return { message: 'Reward deleted successfully' };
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(REWARDS_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Funnel statistics for one reward (Admin)' })
  async getRewardStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getRewardStats(id);
  }

  // ─── Reward detail & redemption (dynamic segment last) ──

  @Get(':idOrSlug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get reward details by ID or slug' })
  async getReward(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const reward = await this.catalogService.getDetail(idOrSlug);
    await this.analyticsService.trackView(reward.id, user.sub);
    return reward;
  }

  @Get(':idOrSlug/related')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Rewards related to this one' })
  async getRelated(@Param('idOrSlug') idOrSlug: string) {
    const reward = await this.catalogService.getDetail(idOrSlug);
    return this.catalogService.getRelated(reward.id, reward.category?.id ?? null);
  }

  @Get(':idOrSlug/eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Check whether I can redeem this reward',
    description:
      'Advisory only — the same checks re-run server-side during redemption before any coins move.',
  })
  async checkEligibility(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.redemptionService.checkEligibility(user.sub, idOrSlug);
  }

  @Post(':idOrSlug/redeem')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Redeem a reward with coins',
    description:
      'Validates eligibility, claims stock, debits the wallet via WalletService and issues a signed voucher.',
  })
  async redeem(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: RedeemRewardDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.redemptionService.redeem(user.sub, idOrSlug, dto, {
      ip: req.ip,
      device: req.headers['user-agent'],
    });
  }

  @Post(':idOrSlug/track')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record a catalog interaction (view/click)' })
  async trackEvent(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: TrackRewardEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const reward = await this.catalogService.getDetail(idOrSlug);
    await this.analyticsService.track(dto.eventType || REWARD_ANALYTICS_EVENTS.CLICK, {
      rewardId: reward.id,
      userId: user.sub,
      metadata: dto.metadata,
    });
    return { message: 'Event recorded' };
  }
}
