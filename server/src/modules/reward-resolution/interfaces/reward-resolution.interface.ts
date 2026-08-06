import { RuleRewardType, RewardRuleType } from '@prisma/client';

export interface RewardResolutionInput {
  customerId: string;
  storeId: string;
  rewardType?: RuleRewardType;
  ruleType?: RewardRuleType;
  walletBalance?: number;
  coinBalance?: number;
  campaignContext?: CampaignContext;
  storeContext?: StoreContext;
  date?: Date;
  device?: string;
  ip?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignContext {
  campaignId?: string;
  campaignSlug?: string;
  eventType?: string;
  purchaseAmount?: number;
  source?: string;
}

export interface StoreContext {
  brandId?: string;
  locationId?: string;
}

export interface ResolvedRewardOutput {
  resolved: boolean;
  reward: ResolvedRewardDetail | null;
  source: string;
  ruleUsed: RuleUsed | null;
  campaignApplied: CampaignApplied | null;
  storeOverrideApplied: StoreOverrideApplied | null;
  coinAmount: number;
  voucher: VoucherDetail | null;
  menuItem: MenuItemDetail | null;
  expiry: Date | null;
  notificationRequired: boolean;
  auditRequired: boolean;
  preview: boolean;
  reason: string;
}

export interface ResolvedRewardDetail {
  id: string;
  name: string;
  ruleType: string;
  rewardType: RuleRewardType;
  rewardReference: string | null;
  coinRequirement: number;
  displayOrder: number;
  priority: number;
}

export interface RuleUsed {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  profileId: string;
  profileName: string;
}

export interface CampaignApplied {
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  coins: number;
  multiplier: number;
  bonusCoins: number;
  totalCoins: number;
}

export interface StoreOverrideApplied {
  overrideId: string;
  ruleId: string;
  overrideRewardType: RuleRewardType;
  overrideRewardRef: string | null;
  overrideCoinReq: number | null;
}

export interface VoucherDetail {
  id: string;
  code: string;
  expiresAt: Date;
}

export interface MenuItemDetail {
  rewardReference: string;
  rewardType: RuleRewardType;
}

export interface CoinResolutionResult {
  granted: boolean;
  coins: number;
  source: string;
  ruleId: string | null;
  ruleType: string | null;
  calculation: Record<string, unknown> | null;
  newBalance: number | null;
  reason: string;
}

export interface MilestoneResolutionResult {
  reached: boolean;
  milestone: ResolvedRewardDetail | null;
  source: string;
  overrideApplied: StoreOverrideApplied | null;
  nextMilestone: ResolvedRewardDetail | null;
  reason: string;
}

export interface CustomerRewardSummary {
  customerId: string;
  storeId: string;
  walletBalance: number;
  coinBalance: number;
  availableMilestones: ResolvedRewardDetail[];
  nextMilestone: ResolvedRewardDetail | null;
  activeOverrides: number;
  activeCampaigns: number;
  profileName: string | null;
  profileSource: string;
}
