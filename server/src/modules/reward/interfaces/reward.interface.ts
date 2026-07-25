import {
  RewardEventType,
  RewardSourceType,
  TransactionSource,
  TransactionType,
  CampaignStatus,
} from '@prisma/client';

export interface RewardEvent {
  eventType: RewardEventType;
  userId: string;
  source: RewardSourceType;
  referenceId?: string;
  referenceType?: string;
  storeId?: string;
  brandId?: string;
  purchaseAmount?: number;
  metadata?: Record<string, unknown>;
  ip?: string;
  device?: string;
  initiatorId?: string;
}

export interface RewardDecision {
  rewardGranted: boolean;
  coins: number;
  multiplier: number;
  bonusCoins: number;
  totalCoins: number;
  reason: string;
  campaignId: string | null;
  campaignName: string | null;
  expiresAt: Date | null;
  walletSource: TransactionSource;
  walletTransactionType: TransactionType;
  ruleApplied: string | null;
  metadata: Record<string, unknown>;
}

export interface RuleContext {
  userId: string;
  eventType: RewardEventType;
  storeId?: string;
  brandId?: string;
  purchaseAmount?: number;
  now: Date;
  dailyClaimCount: number;
  totalClaimCount: number;
}

export interface RuleEvaluationResult {
  passed: boolean;
  reason: string;
  ruleType: string;
}

export interface CampaignResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventType: RewardEventType;
  source: RewardSourceType;
  status: CampaignStatus;
  baseCoins: number;
  multiplier: number;
  bonusCoins: number;
  maxClaims: number | null;
  dailyLimit: number | null;
  totalBudget: number | null;
  spentBudget: number;
  coinExpiryDays: number | null;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

export interface RewardHistoryResponse {
  id: string;
  userId: string;
  campaignId: string | null;
  eventType: RewardEventType;
  source: RewardSourceType;
  rewardGranted: boolean;
  coins: number;
  multiplier: number;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  ruleApplied: string | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
