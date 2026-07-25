import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, CampaignStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RewardCacheService } from './reward-cache.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
  CreateRuleDto,
} from '../dto';
import { CampaignResponse, RewardHistoryResponse } from '../interfaces';
import { REWARD_ERRORS } from '../constants';
import { PaginatedResponse } from '../../../common/interfaces';
import { paginate } from '../../../common/pagination/paginator';
import { RewardHistoryQueryDto } from '../dto/reward-history-query.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RewardCacheService,
  ) {}

  async create(dto: CreateCampaignDto, createdBy: string): Promise<CampaignResponse> {
    const existing = await this.prisma.rewardCampaign.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(REWARD_ERRORS.SLUG_EXISTS);
    }

    if (new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException(REWARD_ERRORS.INVALID_DATE_RANGE);
    }

    const campaign = await this.prisma.rewardCampaign.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        eventType: dto.eventType,
        source: dto.source,
        baseCoins: dto.baseCoins,
        multiplier: dto.multiplier ?? 1.0,
        bonusCoins: dto.bonusCoins ?? 0,
        maxClaims: dto.maxClaims,
        dailyLimit: dto.dailyLimit,
        totalBudget: dto.totalBudget,
        coinExpiryDays: dto.coinExpiryDays,
        storeIds: dto.storeIds ?? [],
        brandIds: dto.brandIds ?? [],
        minPurchase: dto.minPurchase,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        createdBy,
      },
    });

    await this.cache.invalidateAll();
    this.logger.log(`Campaign created: ${campaign.slug} by ${createdBy}`);
    return this.toCampaignResponse(campaign);
  }

  async update(
    id: string,
    dto: UpdateCampaignDto,
    updatedBy: string,
  ): Promise<CampaignResponse> {
    const existing = await this.prisma.rewardCampaign.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(REWARD_ERRORS.CAMPAIGN_NOT_FOUND);
    }

    if (dto.endsAt && dto.startsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException(REWARD_ERRORS.INVALID_DATE_RANGE);
    }

    const updated = await this.prisma.rewardCampaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.eventType !== undefined && { eventType: dto.eventType }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.baseCoins !== undefined && { baseCoins: dto.baseCoins }),
        ...(dto.multiplier !== undefined && { multiplier: dto.multiplier }),
        ...(dto.bonusCoins !== undefined && { bonusCoins: dto.bonusCoins }),
        ...(dto.maxClaims !== undefined && { maxClaims: dto.maxClaims }),
        ...(dto.dailyLimit !== undefined && { dailyLimit: dto.dailyLimit }),
        ...(dto.totalBudget !== undefined && { totalBudget: dto.totalBudget }),
        ...(dto.coinExpiryDays !== undefined && { coinExpiryDays: dto.coinExpiryDays }),
        ...(dto.storeIds !== undefined && { storeIds: dto.storeIds }),
        ...(dto.brandIds !== undefined && { brandIds: dto.brandIds }),
        ...(dto.minPurchase !== undefined && { minPurchase: dto.minPurchase }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as Prisma.InputJsonValue }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
      },
    });

    await this.cache.invalidateCampaign(id);
    this.logger.log(`Campaign updated: ${updated.slug} by ${updatedBy}`);
    return this.toCampaignResponse(updated);
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<CampaignResponse> {
    const existing = await this.prisma.rewardCampaign.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(REWARD_ERRORS.CAMPAIGN_NOT_FOUND);
    }

    const updated = await this.prisma.rewardCampaign.update({
      where: { id },
      data: { status },
    });

    await this.cache.invalidateCampaign(id);
    this.logger.log(`Campaign ${updated.slug} status → ${status}`);
    return this.toCampaignResponse(updated);
  }

  async findAll(query: CampaignQueryDto): Promise<PaginatedResponse<CampaignResponse>> {
    const where: Prisma.RewardCampaignWhereInput = {};
    if (query.eventType) where.eventType = query.eventType;
    if (query.status) where.status = query.status;

    const [campaigns, total] = await Promise.all([
      this.prisma.rewardCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardCampaign.count({ where }),
    ]);

    return paginate(
      campaigns.map((c) => this.toCampaignResponse(c)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async findById(id: string): Promise<CampaignResponse> {
    const cached = await this.cache.getCampaign<CampaignResponse>(id);
    if (cached) return cached;

    const campaign = await this.prisma.rewardCampaign.findUnique({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException(REWARD_ERRORS.CAMPAIGN_NOT_FOUND);
    }

    const response = this.toCampaignResponse(campaign);
    await this.cache.setCampaign(id, response);
    return response;
  }

  async addRule(dto: CreateRuleDto): Promise<{ id: string; ruleType: string }> {
    const campaign = await this.prisma.rewardCampaign.findUnique({
      where: { id: dto.campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new NotFoundException(REWARD_ERRORS.CAMPAIGN_NOT_FOUND);
    }

    const rule = await this.prisma.rewardRule.create({
      data: {
        campaignId: dto.campaignId,
        ruleType: dto.ruleType,
        operator: dto.operator,
        value: dto.value,
        priority: dto.priority ?? 0,
      },
    });

    await this.cache.invalidateCampaign(dto.campaignId);
    this.logger.log(`Rule added: ${dto.ruleType} to campaign ${dto.campaignId}`);
    return { id: rule.id, ruleType: rule.ruleType };
  }

  async removeRule(ruleId: string): Promise<void> {
    const rule = await this.prisma.rewardRule.findUnique({
      where: { id: ruleId },
      select: { id: true, campaignId: true },
    });
    if (!rule) {
      throw new NotFoundException(REWARD_ERRORS.RULE_NOT_FOUND);
    }

    await this.prisma.rewardRule.delete({ where: { id: ruleId } });
    await this.cache.invalidateCampaign(rule.campaignId);
    this.logger.log(`Rule removed: ${ruleId}`);
  }

  async getRules(campaignId: string): Promise<{ id: string; ruleType: string; operator: string; value: string; priority: number }[]> {
    return this.prisma.rewardRule.findMany({
      where: { campaignId, isActive: true },
      orderBy: { priority: 'asc' },
      select: { id: true, ruleType: true, operator: true, value: true, priority: true },
    });
  }

  async getHistory(
    userId: string,
    query: RewardHistoryQueryDto,
  ): Promise<PaginatedResponse<RewardHistoryResponse>> {
    const where: Prisma.RewardHistoryWhereInput = { userId };
    if (query.eventType) where.eventType = query.eventType;
    if (query.source) where.source = query.source;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) where.createdAt.lte = new Date(query.toDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.rewardHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardHistory.count({ where }),
    ]);

    return paginate(
      items.map((h) => this.toHistoryResponse(h)),
      total,
      query.page,
      query.pageSize,
    );
  }

  private toCampaignResponse(c: Record<string, unknown>): CampaignResponse {
    return {
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      description: (c.description as string) ?? null,
      eventType: c.eventType as CampaignResponse['eventType'],
      source: c.source as CampaignResponse['source'],
      status: c.status as CampaignResponse['status'],
      baseCoins: c.baseCoins as number,
      multiplier: Number(c.multiplier),
      bonusCoins: c.bonusCoins as number,
      maxClaims: (c.maxClaims as number) ?? null,
      dailyLimit: (c.dailyLimit as number) ?? null,
      totalBudget: c.totalBudget ? Number(c.totalBudget) : null,
      spentBudget: Number(c.spentBudget),
      coinExpiryDays: (c.coinExpiryDays as number) ?? null,
      startsAt: c.startsAt as Date,
      endsAt: c.endsAt as Date,
      createdAt: c.createdAt as Date,
    };
  }

  private toHistoryResponse(h: Record<string, unknown>): RewardHistoryResponse {
    return {
      id: h.id as string,
      userId: h.userId as string,
      campaignId: (h.campaignId as string) ?? null,
      eventType: h.eventType as RewardHistoryResponse['eventType'],
      source: h.source as RewardHistoryResponse['source'],
      rewardGranted: h.rewardGranted as boolean,
      coins: h.coins as number,
      multiplier: Number(h.multiplier),
      reason: h.reason as string,
      referenceId: (h.referenceId as string) ?? null,
      referenceType: (h.referenceType as string) ?? null,
      ruleApplied: (h.ruleApplied as string) ?? null,
      expiresAt: (h.expiresAt as Date) ?? null,
      metadata: (h.metadata as Record<string, unknown>) ?? null,
      createdAt: h.createdAt as Date,
    };
  }
}
