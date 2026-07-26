import {
  RewardType,
  RewardStatus,
  RewardAvailability,
  RedemptionStatus,
  VoucherStatus,
} from '@prisma/client';

export interface RewardCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  rewardCount?: number;
}

export interface RewardListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  image: string | null;
  coinCost: number;
  rewardType: RewardType;
  availability: RewardAvailability;
  status: RewardStatus;
  isFeatured: boolean;
  priority: number;
  remainingStock: number | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string } | null;
  validUntil: Date | null;
}

export interface RewardDetail extends RewardListItem {
  description: string | null;
  bannerImage: string | null;
  cashAmount: number | null;
  terms: string | null;
  userLimit: number | null;
  dailyLimit: number | null;
  minimumLoyaltyTier: string | null;
  validFrom: Date | null;
  voucherValidDays: number;
  totalRedemptions: number;
  stores: Array<{ id: string; name: string; city: string | null }>;
  metadata: Record<string, unknown> | null;
}

/** Result of running the eligibility pipeline for one reward. */
export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  /** Per-check outcomes, useful for the details page and debugging. */
  checks: EligibilityCheck[];
  balance: number;
  coinCost: number;
  shortBy: number;
}

export interface EligibilityCheck {
  name: string;
  passed: boolean;
  reason?: string;
}

export interface VoucherPayload {
  code: string;
  signature: string;
  expiresAt: string;
}

export interface VoucherResponse {
  id: string;
  code: string;
  status: VoucherStatus;
  qrCodeDataUrl: string | null;
  expiresAt: Date;
  redeemedAt: Date | null;
  createdAt: Date;
  reward: {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    coinCost: number;
    rewardType: RewardType;
  };
  store: { id: string; name: string } | null;
}

export interface RedemptionResponse {
  id: string;
  status: RedemptionStatus;
  coinsSpent: number;
  newBalance: number;
  createdAt: Date;
  reward: { id: string; title: string; slug: string; image: string | null };
  voucher: VoucherResponse;
}

export interface VoucherVerificationResult {
  valid: boolean;
  reason?: string;
  voucher?: VoucherResponse;
}

export interface RewardStats {
  rewardId: string;
  title: string;
  views: number;
  clicks: number;
  redemptions: number;
  conversionRate: number;
  coinsSpent: number;
  vouchersActive: number;
  vouchersUsed: number;
  vouchersExpired: number;
  usageRate: number;
  expiryRate: number;
}

export interface CatalogOverviewStats {
  totalRewards: number;
  publishedRewards: number;
  totalRedemptions: number;
  totalCoinsSpent: number;
  activeVouchers: number;
  usedVouchers: number;
  expiredVouchers: number;
  fraudAttempts: number;
  topRewards: Array<{ rewardId: string; title: string; redemptions: number }>;
  storeRedemptions: Array<{ storeId: string; storeName: string; redemptions: number }>;
}
