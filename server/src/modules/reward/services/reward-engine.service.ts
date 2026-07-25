import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  RewardEventType,
  TransactionSource,
  TransactionType,
  CampaignStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RewardCacheService } from './reward-cache.service';
import { RuleEngine } from '../rules';
import {
  RewardEvent,
  RewardDecision,
  RuleContext,
} from '../interfaces';
import { REWARD_DEFAULTS } from '../constants';

const EVENT_TO_WALLET_SOURCE: Record<RewardEventType, TransactionSource> = {
  GAME_COMPLETED: TransactionSource.GAME_REWARD,
  REFERRAL_COMPLETED: TransactionSource.REFERRAL_BONUS,
  PURCHASE_COMPLETED: TransactionSource.ORDER_CASHBACK,
  FIRST_PURCHASE: TransactionSource.ORDER_CASHBACK,
  BIRTHDAY: TransactionSource.BIRTHDAY_REWARD,
  ANNIVERSARY: TransactionSource.ANNIVERSARY_REWARD,
  LOYALTY_UPGRADE: TransactionSource.LOYALTY_TIER,
  STORE_VISIT: TransactionSource.STORE_VISIT,
  CHECK_IN: TransactionSource.CHECK_IN_REWARD,
  ADMIN_BONUS: TransactionSource.ADMIN_ADJUSTMENT,
  CAMPAIGN: TransactionSource.CAMPAIGN_REWARD,
  SYSTEM: TransactionSource.SYSTEM_REWARD,
  CUSTOM_EVENT: TransactionSource.SYSTEM_REWARD,
};

@Injectable()
export class RewardEngineService {
  private readonly logger = new Logger(RewardEngineService.name);
  private readonly ruleEngine = new RuleEngine();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RewardCacheService,
  ) {}

  async evaluateReward(event: RewardEvent): Promise<RewardDecision> {
    const startMs = Date.now();

    let campaigns = await this.getActiveCampaigns(event.eventType);

    if (event.metadata?.campaignId) {
      campaigns = campaigns.filter((c) => c.id === event.metadata?.campaignId);
    } else if (event.metadata?.campaignSlug) {
      campaigns = campaigns.filter((c) => c.slug === event.metadata?.campaignSlug);
    }

    if (campaigns.length === 0) {
      this.logger.debug(`No active campaigns for ${event.eventType}`);
      return this.noRewardDecision(event, 'No active campaign found');
    }

    let lastRejectionReason = 'No eligible campaign';
    for (const campaign of campaigns) {
      const decision = await this.evaluateAgainstCampaign(event, campaign);
      if (decision.rewardGranted) {
        await this.recordHistory(event, decision);
        await this.cache.incrementDailyCount(event.userId, event.eventType);
        this.logger.log(
          `Reward granted: ${decision.totalCoins} coins to user ${event.userId} | campaign=${campaign.slug} | ${Date.now() - startMs}ms`,
        );
        return decision;
      }
      lastRejectionReason = decision.reason;
    }

    const decision = this.noRewardDecision(event, lastRejectionReason);
    await this.recordHistory(event, decision);
    this.logger.debug(`No reward for ${event.userId} | ${event.eventType} | ${Date.now() - startMs}ms`);
    return decision;
  }

  async getRewardDecision(event: RewardEvent): Promise<RewardDecision> {
    return this.evaluateReward(event);
  }

  private async evaluateAgainstCampaign(
    event: RewardEvent,
    campaign: CampaignRecord,
  ): Promise<RewardDecision> {
    const now = new Date();

    if (now < new Date(campaign.startsAt) || now > new Date(campaign.endsAt)) {
      return this.noRewardDecision(event, 'Campaign outside date range');
    }

    if (
      campaign.totalBudget &&
      Number(campaign.spentBudget) >= Number(campaign.totalBudget)
    ) {
      return this.noRewardDecision(event, 'Campaign budget exhausted');
    }

    if (campaign.storeIds.length > 0 && event.storeId) {
      if (!campaign.storeIds.includes(event.storeId)) {
        return this.noRewardDecision(event, 'Store not eligible');
      }
    }

    if (campaign.brandIds.length > 0 && event.brandId) {
      if (!campaign.brandIds.includes(event.brandId)) {
        return this.noRewardDecision(event, 'Brand not eligible');
      }
    }

    if (
      campaign.minPurchase &&
      event.purchaseAmount !== undefined &&
      event.purchaseAmount < Number(campaign.minPurchase)
    ) {
      return this.noRewardDecision(event, 'Minimum purchase not met');
    }

    const eligibility = await this.validateEligibility(event, campaign);
    if (!eligibility.eligible) {
      return this.noRewardDecision(event, eligibility.reason);
    }

    const rules = await this.getRules(campaign.id);
    if (rules.length > 0) {
      const [dailyCount, totalCount] = await Promise.all([
        this.cache.getDailyCount(event.userId, event.eventType),
        this.getTotalClaimCount(event.userId, campaign.id),
      ]);

      const ruleContext: RuleContext = {
        userId: event.userId,
        eventType: event.eventType,
        storeId: event.storeId,
        brandId: event.brandId,
        purchaseAmount: event.purchaseAmount,
        now,
        dailyClaimCount: dailyCount,
        totalClaimCount: totalCount,
      };

      const evaluation = this.ruleEngine.evaluateAll(
        rules.map((r) => ({
          ruleType: r.ruleType,
          operator: r.operator,
          value: r.value,
          priority: r.priority,
        })),
        ruleContext,
      );

      if (!evaluation.allPassed) {
        return this.noRewardDecision(event, evaluation.failedRule ?? 'Rule check failed');
      }
    }

    const coins = this.calculateCoins(campaign);
    const multiplier = this.applyMultiplier(campaign);
    const totalCoins = this.computeTotal(coins, multiplier, campaign.bonusCoins);
    const expiresAt = this.calculateExpiry(campaign.coinExpiryDays);

    return {
      rewardGranted: true,
      coins,
      multiplier,
      bonusCoins: campaign.bonusCoins,
      totalCoins,
      reason: `Reward from campaign: ${campaign.name}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      expiresAt,
      walletSource: EVENT_TO_WALLET_SOURCE[event.eventType],
      walletTransactionType: TransactionType.CREDIT,
      ruleApplied: rules.length > 0 ? rules.map((r) => r.ruleType).join(', ') : null,
      metadata: {
        ...event.metadata,
        campaignSlug: campaign.slug,
        eventType: event.eventType,
        source: event.source,
        referenceId: event.referenceId,
        referenceType: event.referenceType,
      },
    };
  }

  calculateCoins(campaign: CampaignRecord): number {
    return campaign.baseCoins;
  }

  applyMultiplier(campaign: CampaignRecord): number {
    return Number(campaign.multiplier) || REWARD_DEFAULTS.DEFAULT_MULTIPLIER;
  }

  computeTotal(baseCoins: number, multiplier: number, bonusCoins: number): number {
    return Math.round(baseCoins * multiplier) + bonusCoins;
  }

  calculateExpiry(coinExpiryDays: number | null): Date | null {
    if (!coinExpiryDays) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + REWARD_DEFAULTS.DEFAULT_COIN_EXPIRY_DAYS);
      return defaultExpiry;
    }
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + coinExpiryDays);
    return expiry;
  }

  private async validateEligibility(
    event: RewardEvent,
    campaign: CampaignRecord,
  ): Promise<{ eligible: boolean; reason: string }> {
    if (event.referenceId) {
      const existing = await this.prisma.rewardHistory.findFirst({
        where: {
          userId: event.userId,
          campaignId: campaign.id,
          referenceId: event.referenceId,
          referenceType: event.referenceType,
          rewardGranted: true,
        },
        select: { id: true },
      });

      if (existing) {
        return { eligible: false, reason: 'Reward already claimed for this reference' };
      }
    }

    if (campaign.maxClaims) {
      const totalClaims = await this.getTotalClaimCount(event.userId, campaign.id);
      if (totalClaims >= campaign.maxClaims) {
        return { eligible: false, reason: 'Maximum claims reached' };
      }
    }

    if (campaign.dailyLimit) {
      const dailyCount = await this.cache.getDailyCount(event.userId, event.eventType);
      if (dailyCount >= campaign.dailyLimit) {
        return { eligible: false, reason: 'Daily limit reached' };
      }
    }

    return { eligible: true, reason: 'Eligible' };
  }

  private async getActiveCampaigns(eventType: RewardEventType): Promise<CampaignRecord[]> {
    const cached = await this.cache.getActiveCampaigns<CampaignRecord[]>(eventType);
    if (cached) return cached;

    const now = new Date();
    const campaigns = await this.prisma.rewardCampaign.findMany({
      where: {
        eventType,
        status: CampaignStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.cache.setActiveCampaigns(eventType, campaigns);
    return campaigns;
  }

  private async getRules(campaignId: string): Promise<RuleRecord[]> {
    const cached = await this.cache.getRules<RuleRecord[]>(campaignId);
    if (cached) return cached;

    const rules = await this.prisma.rewardRule.findMany({
      where: { campaignId, isActive: true },
      orderBy: { priority: 'asc' },
    });

    await this.cache.setRules(campaignId, rules);
    return rules;
  }

  private async getTotalClaimCount(userId: string, campaignId: string): Promise<number> {
    return this.prisma.rewardHistory.count({
      where: { userId, campaignId, rewardGranted: true },
    });
  }

  private async recordHistory(event: RewardEvent, decision: RewardDecision): Promise<void> {
    await this.prisma.rewardHistory.create({
      data: {
        userId: event.userId,
        campaignId: decision.campaignId,
        eventType: event.eventType,
        source: event.source,
        rewardGranted: decision.rewardGranted,
        coins: decision.totalCoins,
        multiplier: decision.multiplier,
        reason: decision.reason,
        referenceId: event.referenceId,
        referenceType: event.referenceType,
        ruleApplied: decision.ruleApplied,
        expiresAt: decision.expiresAt,
        ipAddress: event.ip,
        deviceInfo: event.device,
        metadata: decision.metadata ? (decision.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    if (decision.rewardGranted && decision.campaignId) {
      await this.prisma.rewardCampaign.update({
        where: { id: decision.campaignId },
        data: { spentBudget: { increment: decision.totalCoins } },
      });
    }
  }

  private noRewardDecision(event: RewardEvent, reason: string): RewardDecision {
    return {
      rewardGranted: false,
      coins: 0,
      multiplier: REWARD_DEFAULTS.DEFAULT_MULTIPLIER,
      bonusCoins: 0,
      totalCoins: 0,
      reason,
      campaignId: null,
      campaignName: null,
      expiresAt: null,
      walletSource: EVENT_TO_WALLET_SOURCE[event.eventType],
      walletTransactionType: TransactionType.CREDIT,
      ruleApplied: null,
      metadata: { eventType: event.eventType, source: event.source },
    };
  }
}

interface CampaignRecord {
  id: string;
  name: string;
  slug: string;
  eventType: RewardEventType;
  status: CampaignStatus;
  baseCoins: number;
  multiplier: unknown;
  bonusCoins: number;
  maxClaims: number | null;
  dailyLimit: number | null;
  totalBudget: unknown;
  spentBudget: unknown;
  coinExpiryDays: number | null;
  storeIds: string[];
  brandIds: string[];
  minPurchase: unknown;
  startsAt: Date;
  endsAt: Date;
}

interface RuleRecord {
  id: string;
  ruleType: string;
  operator: string;
  value: string;
  priority: number;
}
