import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'crypto';
import { RewardEventType, RewardSourceType, RuleRewardType } from '@prisma/client';

import { RewardEngineService } from '../../reward/services/reward-engine.service';
import { RewardOverridesService } from '../../reward-overrides/services/reward-overrides.service';
import { RewardAssignmentService } from '../../reward-assignment/services/reward-assignment.service';
import { RewardProfileService } from '../../reward-profile/services/reward-profile.service';
import { RewardRulesService } from '../../reward-rules/services/reward-rules.service';
import { CoinEconomyService } from '../../coin-economy/services/coin-economy.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { AuditService } from '../../audit/services/audit.service';

import { RewardResolutionCacheService } from '../cache';
import {
  REWARD_RESOLUTION_ERRORS,
  RESOLUTION_SOURCE,
  REWARD_RESOLUTION_EVENTS,
  REWARD_RESOLUTION_AUDIT,
} from '../constants';
import {
  RewardResolutionInput,
  ResolvedRewardOutput,
  ResolvedRewardDetail,
  CoinResolutionResult,
  MilestoneResolutionResult,
  CustomerRewardSummary,
  CampaignApplied,
  StoreOverrideApplied,
  RuleUsed,
  MenuItemDetail,
} from '../interfaces';
import {
  RewardResolvedEvent,
  CampaignAppliedEvent,
  MilestoneReachedEvent,
} from '../events';

@Injectable()
export class RewardResolutionService {
  private readonly logger = new Logger(RewardResolutionService.name);

  constructor(
    private readonly campaignEngine: RewardEngineService,
    private readonly overridesService: RewardOverridesService,
    private readonly assignmentService: RewardAssignmentService,
    private readonly profileService: RewardProfileService,
    private readonly rulesService: RewardRulesService,
    private readonly coinEconomy: CoinEconomyService,
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
    private readonly cache: RewardResolutionCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async resolveReward(input: RewardResolutionInput): Promise<ResolvedRewardOutput> {
    const startMs = Date.now();
    const hash = this.inputHash(input);

    const cached = await this.cache.getResolution<ResolvedRewardOutput>(
      input.customerId,
      input.storeId,
      hash,
    );
    if (cached) return cached;

    const result = await this.executeResolution(input, false);

    if (result.resolved) {
      await this.cache.setResolution(input.customerId, input.storeId, hash, result);
      await this.postResolution(input, result);
    }

    this.logger.log(
      `Resolved reward for ${input.customerId}@${input.storeId} → ${result.source} | ${Date.now() - startMs}ms`,
    );

    return result;
  }

  async previewReward(input: RewardResolutionInput): Promise<ResolvedRewardOutput> {
    const hash = this.inputHash(input);

    const cached = await this.cache.getPreview<ResolvedRewardOutput>(
      input.customerId,
      input.storeId,
      hash,
    );
    if (cached) return cached;

    const result = await this.executeResolution(input, true);
    await this.cache.setPreview(input.customerId, input.storeId, hash, result);

    return result;
  }

  async resolveCoins(
    customerId: string,
    storeId: string,
    ruleType?: string,
    options?: {
      referenceId?: string;
      referenceType?: string;
      metadata?: Record<string, unknown>;
      device?: string;
      ip?: string;
      preview?: boolean;
    },
  ): Promise<CoinResolutionResult> {
    const coinContext = {
      userId: customerId,
      ruleType: ruleType as any,
      storeId,
      referenceId: options?.referenceId,
      referenceType: options?.referenceType,
      metadata: options?.metadata,
      device: options?.device,
      ip: options?.ip,
    };

    const decision = options?.preview
      ? await this.coinEconomy.preview(coinContext)
      : await this.coinEconomy.earn(coinContext);

    if (!options?.preview && decision.granted) {
      this.audit.record({
        eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.COINS_CALCULATED,
        entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
        action: REWARD_RESOLUTION_AUDIT.ACTIONS.COINS_CALCULATED,
        entityId: decision.ruleId,
        userId: customerId,
        storeId,
        newValue: {
          coins: decision.coins,
          ruleType: decision.ruleType,
          ruleId: decision.ruleId,
        },
      });
    }

    return {
      granted: decision.granted,
      coins: decision.coins,
      source: RESOLUTION_SOURCE.COIN_ECONOMY,
      ruleId: decision.ruleId,
      ruleType: decision.ruleType,
      calculation: decision.calculation as Record<string, unknown> | null,
      newBalance: decision.newBalance,
      reason: decision.reason,
    };
  }

  async resolveMilestone(
    customerId: string,
    storeId: string,
    coinBalance?: number,
  ): Promise<MilestoneResolutionResult> {
    const balance = coinBalance ?? (await this.wallet.getBalance(customerId)).balance;
    const resolvedRules = await this.resolveStoreRules(storeId);

    const milestones = resolvedRules
      .filter((r) => r.ruleType === 'COIN_MILESTONE' && r.coinRequirement <= balance)
      .sort((a, b) => b.coinRequirement - a.coinRequirement);

    const nextMilestones = resolvedRules
      .filter((r) => r.ruleType === 'COIN_MILESTONE' && r.coinRequirement > balance)
      .sort((a, b) => a.coinRequirement - b.coinRequirement);

    if (milestones.length === 0) {
      return {
        reached: false,
        milestone: null,
        source: RESOLUTION_SOURCE.ASSIGNED_PROFILE,
        overrideApplied: null,
        nextMilestone: nextMilestones[0]
          ? this.toRewardDetail(nextMilestones[0])
          : null,
        reason: 'No milestone reached at current balance',
      };
    }

    const best = milestones[0];
    return {
      reached: true,
      milestone: this.toRewardDetail(best),
      source: best.source === 'OVERRIDE'
        ? RESOLUTION_SOURCE.STORE_OVERRIDE
        : RESOLUTION_SOURCE.ASSIGNED_PROFILE,
      overrideApplied: best.overrideId
        ? {
            overrideId: best.overrideId,
            ruleId: best.ruleId,
            overrideRewardType: best.rewardType as RuleRewardType,
            overrideRewardRef: best.rewardReference,
            overrideCoinReq: best.coinRequirement,
          }
        : null,
      nextMilestone: nextMilestones[0]
        ? this.toRewardDetail(nextMilestones[0])
        : null,
      reason: `Milestone reached: ${best.ruleName} (${best.coinRequirement} coins)`,
    };
  }

  async resolveStoreReward(
    customerId: string,
    storeId: string,
    rewardType?: RuleRewardType,
    coinBalance?: number,
  ): Promise<ResolvedRewardOutput> {
    return this.executeResolution(
      {
        customerId,
        storeId,
        rewardType,
        coinBalance,
      },
      false,
    );
  }

  async resolveCampaignReward(
    customerId: string,
    storeId: string,
    campaignContext: RewardResolutionInput['campaignContext'],
    device?: string,
    ip?: string,
  ): Promise<ResolvedRewardOutput> {
    if (!campaignContext?.eventType) {
      return this.noRewardResult('No campaign event type provided');
    }

    const campaignDecision = await this.campaignEngine.evaluateReward({
      eventType: campaignContext.eventType as RewardEventType,
      userId: customerId,
      source: (campaignContext.source as RewardSourceType) || RewardSourceType.SYSTEM,
      storeId,
      purchaseAmount: campaignContext.purchaseAmount,
      metadata: {
        campaignId: campaignContext.campaignId,
        campaignSlug: campaignContext.campaignSlug,
      },
      ip,
      device,
    });

    if (!campaignDecision.rewardGranted) {
      return this.noRewardResult(campaignDecision.reason);
    }

    const campaignApplied: CampaignApplied = {
      campaignId: campaignDecision.campaignId!,
      campaignName: campaignDecision.campaignName!,
      campaignSlug: (campaignDecision.metadata?.campaignSlug as string) || '',
      coins: campaignDecision.coins,
      multiplier: campaignDecision.multiplier,
      bonusCoins: campaignDecision.bonusCoins,
      totalCoins: campaignDecision.totalCoins,
    };

    this.events.emit(
      REWARD_RESOLUTION_EVENTS.CAMPAIGN_APPLIED,
      new CampaignAppliedEvent(
        customerId,
        storeId,
        campaignApplied.campaignId,
        campaignApplied.campaignName,
        campaignApplied.totalCoins,
      ),
    );

    return {
      resolved: true,
      reward: null,
      source: RESOLUTION_SOURCE.CAMPAIGN,
      ruleUsed: null,
      campaignApplied,
      storeOverrideApplied: null,
      coinAmount: campaignDecision.totalCoins,
      voucher: null,
      menuItem: null,
      expiry: campaignDecision.expiresAt,
      notificationRequired: true,
      auditRequired: true,
      preview: false,
      reason: campaignDecision.reason,
    };
  }

  async resolveVoucher(
    customerId: string,
    storeId: string,
    ruleId: string,
  ): Promise<ResolvedRewardOutput> {
    const resolvedRules = await this.resolveStoreRules(storeId);
    const rule = resolvedRules.find(
      (r) => r.ruleId === ruleId && r.rewardType === 'VOUCHER',
    );

    if (!rule) {
      return this.noRewardResult('No matching voucher rule found');
    }

    const balance = (await this.wallet.getBalance(customerId)).balance;
    if (balance < rule.coinRequirement) {
      return this.noRewardResult(REWARD_RESOLUTION_ERRORS.INSUFFICIENT_COINS);
    }

    return {
      resolved: true,
      reward: this.toRewardDetail(rule),
      source: rule.source === 'OVERRIDE'
        ? RESOLUTION_SOURCE.STORE_OVERRIDE
        : RESOLUTION_SOURCE.ASSIGNED_PROFILE,
      ruleUsed: {
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        ruleType: rule.ruleType,
        profileId: '',
        profileName: '',
      },
      campaignApplied: null,
      storeOverrideApplied: rule.overrideId
        ? {
            overrideId: rule.overrideId,
            ruleId: rule.ruleId,
            overrideRewardType: rule.rewardType as RuleRewardType,
            overrideRewardRef: rule.rewardReference,
            overrideCoinReq: rule.coinRequirement,
          }
        : null,
      coinAmount: rule.coinRequirement,
      voucher: null,
      menuItem: null,
      expiry: rule.expiryDate,
      notificationRequired: true,
      auditRequired: true,
      preview: false,
      reason: `Voucher resolved: ${rule.ruleName}`,
    };
  }

  async getCustomerSummary(
    customerId: string,
    storeId: string,
  ): Promise<CustomerRewardSummary> {
    const cached = await this.cache.getCustomerSummary<CustomerRewardSummary>(
      customerId,
      storeId,
    );
    if (cached) return cached;

    const [walletData, resolvedRules, overrides] = await Promise.all([
      this.wallet.getBalance(customerId).catch(() => ({ balance: 0, pendingBalance: 0 })),
      this.resolveStoreRules(storeId).catch(() => []),
      this.overridesService.findByStore(storeId).catch(() => []),
    ]);

    const balance = walletData.balance;
    const milestones = resolvedRules.filter((r) => r.ruleType === 'COIN_MILESTONE');
    const available = milestones.filter((r) => r.coinRequirement <= balance);
    const next = milestones
      .filter((r) => r.coinRequirement > balance)
      .sort((a, b) => a.coinRequirement - b.coinRequirement);

    let profileName: string | null = null;
    let profileSource: string = RESOLUTION_SOURCE.GLOBAL_DEFAULT;
    try {
      const profile = await this.assignmentService.resolveStoreProfile(storeId);
      if (profile) {
        profileName = (profile as any).name;
        profileSource = RESOLUTION_SOURCE.ASSIGNED_PROFILE;
      }
    } catch {
      try {
        const defaultProfile = await this.profileService.findDefault() as any;
        profileName = defaultProfile?.name || null;
      } catch {}
    }

    const summary: CustomerRewardSummary = {
      customerId,
      storeId,
      walletBalance: balance,
      coinBalance: balance,
      availableMilestones: available.map((r) => this.toRewardDetail(r)),
      nextMilestone: next[0] ? this.toRewardDetail(next[0]) : null,
      activeOverrides: Array.isArray(overrides) ? overrides.length : 0,
      activeCampaigns: 0,
      profileName,
      profileSource,
    };

    await this.cache.setCustomerSummary(customerId, storeId, summary);
    return summary;
  }

  private async executeResolution(
    input: RewardResolutionInput,
    preview: boolean,
  ): Promise<ResolvedRewardOutput> {
    // PRIORITY 1: Active Campaign
    if (input.campaignContext?.eventType) {
      const campaignResult = await this.tryCampaignResolution(input, preview);
      if (campaignResult.resolved) return campaignResult;
    }

    // PRIORITY 2–4: Store Override → Assigned Profile → Global Default
    const profileResult = await this.tryProfileResolution(input, preview);
    if (profileResult.resolved) return profileResult;

    // PRIORITY 5: Coin Economy
    if (input.ruleType || input.campaignContext?.eventType) {
      const coinResult = await this.tryCoinResolution(input, preview);
      if (coinResult.resolved) return coinResult;
    }

    // PRIORITY 6: Wallet balance check
    const walletResult = await this.tryWalletResolution(input);
    if (walletResult.resolved) return walletResult;

    return this.noRewardResult('No reward resolved for the given context');
  }

  private async tryCampaignResolution(
    input: RewardResolutionInput,
    preview: boolean,
  ): Promise<ResolvedRewardOutput> {
    try {
      const decision = await this.campaignEngine.evaluateReward({
        eventType: input.campaignContext!.eventType as RewardEventType,
        userId: input.customerId,
        source: (input.campaignContext!.source as RewardSourceType) || RewardSourceType.SYSTEM,
        storeId: input.storeId,
        brandId: input.storeContext?.brandId,
        purchaseAmount: input.campaignContext!.purchaseAmount,
        metadata: {
          campaignId: input.campaignContext!.campaignId,
          campaignSlug: input.campaignContext!.campaignSlug,
        },
        ip: input.ip,
        device: input.device,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
      });

      if (!decision.rewardGranted) {
        return this.noRewardResult(decision.reason);
      }

      const campaignApplied: CampaignApplied = {
        campaignId: decision.campaignId!,
        campaignName: decision.campaignName!,
        campaignSlug: (decision.metadata?.campaignSlug as string) || '',
        coins: decision.coins,
        multiplier: decision.multiplier,
        bonusCoins: decision.bonusCoins,
        totalCoins: decision.totalCoins,
      };

      return {
        resolved: true,
        reward: null,
        source: RESOLUTION_SOURCE.CAMPAIGN,
        ruleUsed: decision.ruleApplied
          ? { ruleId: '', ruleName: decision.ruleApplied, ruleType: 'CAMPAIGN', profileId: '', profileName: '' }
          : null,
        campaignApplied,
        storeOverrideApplied: null,
        coinAmount: decision.totalCoins,
        voucher: null,
        menuItem: null,
        expiry: decision.expiresAt,
        notificationRequired: true,
        auditRequired: !preview,
        preview,
        reason: decision.reason,
      };
    } catch (err) {
      this.logger.warn(`Campaign resolution failed: ${(err as Error).message}`);
      return this.noRewardResult(`Campaign resolution failed: ${(err as Error).message}`);
    }
  }

  private async tryProfileResolution(
    input: RewardResolutionInput,
    preview: boolean,
  ): Promise<ResolvedRewardOutput> {
    try {
      const resolvedRules = await this.resolveStoreRules(input.storeId);

      if (resolvedRules.length === 0) {
        return this.noRewardResult(REWARD_RESOLUTION_ERRORS.NO_MATCHING_RULE);
      }

      let candidates = resolvedRules;

      if (input.rewardType) {
        candidates = candidates.filter((r) => r.rewardType === input.rewardType);
      }
      if (input.ruleType) {
        candidates = candidates.filter((r) => r.ruleType === input.ruleType);
      }

      if (input.coinBalance !== undefined || input.walletBalance !== undefined) {
        const balance = input.coinBalance ?? input.walletBalance ?? 0;
        candidates = candidates.filter((r) => r.coinRequirement <= balance);
      }

      const now = input.date || new Date();
      candidates = candidates.filter((r) => {
        if (r.validFrom && new Date(r.validFrom) > now) return false;
        if (r.expiryDate && new Date(r.expiryDate) < now) return false;
        return true;
      });

      if (candidates.length === 0) {
        return this.noRewardResult(REWARD_RESOLUTION_ERRORS.NO_MATCHING_RULE);
      }

      const best = candidates[0];
      const isOverride = best.source === 'OVERRIDE';

      let profileId = '';
      let profileName = '';
      try {
        const profile = await this.assignmentService.resolveStoreProfile(input.storeId);
        if (profile) {
          profileId = (profile as any).id;
          profileName = (profile as any).name;
        }
      } catch {
        try {
          const defaultProfile = await this.profileService.findDefault() as any;
          profileId = defaultProfile?.id || '';
          profileName = defaultProfile?.name || '';
        } catch {}
      }

      const ruleUsed: RuleUsed = {
        ruleId: best.ruleId,
        ruleName: best.ruleName,
        ruleType: best.ruleType,
        profileId,
        profileName,
      };

      const storeOverrideApplied: StoreOverrideApplied | null = isOverride && best.overrideId
        ? {
            overrideId: best.overrideId,
            ruleId: best.ruleId,
            overrideRewardType: best.rewardType as RuleRewardType,
            overrideRewardRef: best.rewardReference,
            overrideCoinReq: best.coinRequirement,
          }
        : null;

      const menuItem: MenuItemDetail | null = best.rewardType === 'MENU_ITEM' && best.rewardReference
        ? { rewardReference: best.rewardReference, rewardType: best.rewardType as RuleRewardType }
        : null;

      return {
        resolved: true,
        reward: this.toRewardDetail(best),
        source: isOverride
          ? RESOLUTION_SOURCE.STORE_OVERRIDE
          : profileId
            ? RESOLUTION_SOURCE.ASSIGNED_PROFILE
            : RESOLUTION_SOURCE.GLOBAL_DEFAULT,
        ruleUsed,
        campaignApplied: null,
        storeOverrideApplied,
        coinAmount: best.coinRequirement,
        voucher: null,
        menuItem,
        expiry: best.expiryDate,
        notificationRequired: true,
        auditRequired: !preview,
        preview,
        reason: `Resolved via ${isOverride ? 'store override' : 'profile'}: ${best.ruleName}`,
      };
    } catch (err) {
      this.logger.warn(`Profile resolution failed: ${(err as Error).message}`);
      return this.noRewardResult(`Profile resolution failed: ${(err as Error).message}`);
    }
  }

  private async tryCoinResolution(
    input: RewardResolutionInput,
    preview: boolean,
  ): Promise<ResolvedRewardOutput> {
    try {
      const coinResult = await this.resolveCoins(
        input.customerId,
        input.storeId,
        input.ruleType || input.campaignContext?.eventType,
        {
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          metadata: input.metadata,
          device: input.device,
          ip: input.ip,
          preview,
        },
      );

      if (!coinResult.granted) {
        return this.noRewardResult(coinResult.reason);
      }

      return {
        resolved: true,
        reward: null,
        source: RESOLUTION_SOURCE.COIN_ECONOMY,
        ruleUsed: coinResult.ruleId
          ? {
              ruleId: coinResult.ruleId,
              ruleName: coinResult.ruleType || '',
              ruleType: coinResult.ruleType || '',
              profileId: '',
              profileName: '',
            }
          : null,
        campaignApplied: null,
        storeOverrideApplied: null,
        coinAmount: coinResult.coins,
        voucher: null,
        menuItem: null,
        expiry: null,
        notificationRequired: true,
        auditRequired: !preview,
        preview,
        reason: coinResult.reason,
      };
    } catch (err) {
      this.logger.warn(`Coin resolution failed: ${(err as Error).message}`);
      return this.noRewardResult(`Coin resolution failed: ${(err as Error).message}`);
    }
  }

  private async tryWalletResolution(
    input: RewardResolutionInput,
  ): Promise<ResolvedRewardOutput> {
    try {
      const walletData = await this.wallet.getBalance(input.customerId);
      if (walletData.balance > 0) {
        return {
          resolved: true,
          reward: null,
          source: RESOLUTION_SOURCE.WALLET,
          ruleUsed: null,
          campaignApplied: null,
          storeOverrideApplied: null,
          coinAmount: walletData.balance,
          voucher: null,
          menuItem: null,
          expiry: null,
          notificationRequired: false,
          auditRequired: false,
          preview: false,
          reason: `Wallet balance available: ${walletData.balance} coins`,
        };
      }
      return this.noRewardResult('No wallet balance');
    } catch {
      return this.noRewardResult('Wallet not available');
    }
  }

  private async resolveStoreRules(storeId: string): Promise<ResolvedRule[]> {
    const storeCtx = await this.cache.getStoreContext<ResolvedRule[]>(storeId);
    if (storeCtx) return storeCtx;

    let resolvedRules: ResolvedRule[] = [];

    try {
      const overridePreview = await this.overridesService.previewEffectiveRewards(storeId);
      resolvedRules = overridePreview.map((r: any) => ({
        ruleId: r.ruleId,
        ruleName: r.ruleName,
        ruleType: r.ruleType,
        coinRequirement: r.coinRequirement,
        rewardType: r.rewardType,
        rewardReference: r.rewardReference,
        displayOrder: r.displayOrder,
        priority: r.priority,
        source: r.source,
        overrideId: r.overrideId,
        validFrom: r.validFrom,
        expiryDate: r.expiryDate,
      }));
    } catch {
      try {
        const profile = await this.assignmentService.resolveStoreProfile(storeId);
        if (profile) {
          const rules = await this.rulesService.findByProfile((profile as any).id);
          resolvedRules = (Array.isArray(rules) ? rules : (rules as any)?.data || [])
            .filter((r: any) => r.status === 'ACTIVE')
            .map((r: any) => ({
              ruleId: r.id,
              ruleName: r.name,
              ruleType: r.ruleType,
              coinRequirement: r.coinRequirement,
              rewardType: r.rewardType,
              rewardReference: r.rewardReference,
              displayOrder: r.displayOrder,
              priority: r.priority,
              source: 'PROFILE' as const,
              overrideId: null,
              validFrom: r.validFrom,
              expiryDate: r.expiryDate,
            }));
        }
      } catch {
        try {
          const defaultProfile = await this.profileService.findDefault() as any;
          if (defaultProfile) {
            const rules = await this.rulesService.findByProfile(defaultProfile.id);
            resolvedRules = (Array.isArray(rules) ? rules : (rules as any)?.data || [])
              .filter((r: any) => r.status === 'ACTIVE')
              .map((r: any) => ({
                ruleId: r.id,
                ruleName: r.name,
                ruleType: r.ruleType,
                coinRequirement: r.coinRequirement,
                rewardType: r.rewardType,
                rewardReference: r.rewardReference,
                displayOrder: r.displayOrder,
                priority: r.priority,
                source: 'PROFILE' as const,
                overrideId: null,
                validFrom: r.validFrom,
                expiryDate: r.expiryDate,
              }));
          }
        } catch {
          this.logger.warn(`No rules resolved for store ${storeId}`);
        }
      }
    }

    if (resolvedRules.length > 0) {
      await this.cache.setStoreContext(storeId, resolvedRules);
    }

    return resolvedRules;
  }

  private async postResolution(
    input: RewardResolutionInput,
    result: ResolvedRewardOutput,
  ): Promise<void> {
    if (result.preview) return;

    this.events.emit(
      REWARD_RESOLUTION_EVENTS.REWARD_RESOLVED,
      new RewardResolvedEvent(input.customerId, input.storeId, result),
    );

    if (result.campaignApplied) {
      this.events.emit(
        REWARD_RESOLUTION_EVENTS.CAMPAIGN_APPLIED,
        new CampaignAppliedEvent(
          input.customerId,
          input.storeId,
          result.campaignApplied.campaignId,
          result.campaignApplied.campaignName,
          result.campaignApplied.totalCoins,
        ),
      );
    }

    if (result.reward && result.reward.ruleType === 'COIN_MILESTONE') {
      this.events.emit(
        REWARD_RESOLUTION_EVENTS.MILESTONE_REACHED,
        new MilestoneReachedEvent(
          input.customerId,
          input.storeId,
          result.reward.id,
          result.reward.name,
          result.reward.coinRequirement,
        ),
      );
    }

    this.audit.record({
      eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.RESOLVED,
      entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
      action: REWARD_RESOLUTION_AUDIT.ACTIONS.RESOLVED,
      entityId: result.reward?.id || result.campaignApplied?.campaignId,
      userId: input.customerId,
      storeId: input.storeId,
      newValue: {
        source: result.source,
        coinAmount: result.coinAmount,
        ruleUsed: result.ruleUsed,
        campaignApplied: result.campaignApplied
          ? { id: result.campaignApplied.campaignId, name: result.campaignApplied.campaignName }
          : null,
        storeOverrideApplied: result.storeOverrideApplied
          ? { id: result.storeOverrideApplied.overrideId }
          : null,
      },
      metadata: { device: input.device, ip: input.ip },
      ipAddress: input.ip,
      device: input.device,
    });

    if (result.storeOverrideApplied) {
      this.audit.record({
        eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.OVERRIDE_USED,
        entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
        action: REWARD_RESOLUTION_AUDIT.ACTIONS.OVERRIDE_USED,
        entityId: result.storeOverrideApplied.overrideId,
        userId: input.customerId,
        storeId: input.storeId,
        newValue: result.storeOverrideApplied as any,
      });
    }
  }

  private toRewardDetail(rule: ResolvedRule): ResolvedRewardDetail {
    return {
      id: rule.ruleId,
      name: rule.ruleName,
      ruleType: rule.ruleType,
      rewardType: rule.rewardType as RuleRewardType,
      rewardReference: rule.rewardReference,
      coinRequirement: rule.coinRequirement,
      displayOrder: rule.displayOrder,
      priority: rule.priority,
    };
  }

  private noRewardResult(reason: string): ResolvedRewardOutput {
    return {
      resolved: false,
      reward: null,
      source: '',
      ruleUsed: null,
      campaignApplied: null,
      storeOverrideApplied: null,
      coinAmount: 0,
      voucher: null,
      menuItem: null,
      expiry: null,
      notificationRequired: false,
      auditRequired: false,
      preview: false,
      reason,
    };
  }

  private inputHash(input: RewardResolutionInput): string {
    const key = `${input.customerId}:${input.storeId}:${input.rewardType || ''}:${input.ruleType || ''}:${input.coinBalance || ''}:${input.campaignContext?.campaignId || ''}:${input.campaignContext?.eventType || ''}`;
    return createHash('md5').update(key).digest('hex').slice(0, 12);
  }
}

interface ResolvedRule {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  coinRequirement: number;
  rewardType: string;
  rewardReference: string | null;
  displayOrder: number;
  priority: number;
  source: 'OVERRIDE' | 'PROFILE';
  overrideId: string | null;
  validFrom: Date | null;
  expiryDate: Date | null;
}
