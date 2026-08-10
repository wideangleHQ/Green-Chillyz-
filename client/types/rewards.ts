export type RewardType =
  | "FREE_ITEM"
  | "DISCOUNT"
  | "BUY_ONE_GET_ONE"
  | "CASHBACK"
  | "COUPON"
  | "PARTNER"
  | "GIFT"
  | "FESTIVAL"
  | "LIMITED_TIME"
  | "CUSTOM";

export type RewardStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "PAUSED"
  | "SOLD_OUT"
  | "ARCHIVED";

export type RewardAvailability =
  | "GLOBAL"
  | "BRAND_SPECIFIC"
  | "STORE_SPECIFIC"
  | "CAMPAIGN_SPECIFIC"
  | "LOCATION_SPECIFIC";

export type VoucherStatus = "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED" | "INVALID";

export type RedemptionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";

export type RewardSort =
  | "priority"
  | "coinCostAsc"
  | "coinCostDesc"
  | "newest"
  | "popular";

export interface RewardCategory {
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
  validUntil: string | null;
}

export interface RewardDetail extends RewardListItem {
  description: string | null;
  bannerImage: string | null;
  cashAmount: number | null;
  terms: string | null;
  userLimit: number | null;
  dailyLimit: number | null;
  minimumLoyaltyTier: string | null;
  validFrom: string | null;
  voucherValidDays: number;
  totalRedemptions: number;
  stores: Array<{ id: string; name: string; city: string | null }>;
  metadata: Record<string, unknown> | null;
}

export interface EligibilityCheck {
  name: string;
  passed: boolean;
  reason?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  checks: EligibilityCheck[];
  balance: number;
  coinCost: number;
  shortBy: number;
}

export interface Voucher {
  id: string;
  code: string;
  status: VoucherStatus;
  qrCodeDataUrl: string | null;
  expiresAt: string;
  redeemedAt: string | null;
  createdAt: string;
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

export interface Redemption {
  id: string;
  status: RedemptionStatus;
  coinsSpent: number;
  newBalance: number;
  createdAt: string;
  reward: { id: string; title: string; slug: string; image: string | null };
  voucher: Voucher;
}

export type StoreVoucherType =
  | "PERCENTAGE"
  | "FLAT_DISCOUNT"
  | "FREE_ITEM"
  | "COMBO"
  | "FREE_BEVERAGE"
  | "GIFT"
  | "COIN_VOUCHER";

export interface StoreVoucherItem {
  id: string;
  name: string;
  shortTitle: string | null;
  description: string | null;
  offerTag: string | null;
  discountBadge: string | null;
  offerImage: string | null;
  bannerImage: string | null;
  couponCode: string;
  voucherType: StoreVoucherType;
  minimumOrderValue: string | number | null;
  maximumDiscount: string | number | null;
  voucherValue: string | number | null;
  itemsIncluded: string | null;
  redeemVenue: string | null;
  validDays: string[] | null;
  startDate: string | null;
  endDate: string | null;
  validTime: string | null;
  isFeatured: boolean;
  totalLimit: number;
  remainingCount: number;
  terms: string[] | null;
}

export const VOUCHER_TYPE_LABELS: Record<StoreVoucherType, string> = {
  PERCENTAGE: "Percentage Discount",
  FLAT_DISCOUNT: "Flat Discount",
  FREE_ITEM: "Free Item",
  COMBO: "Combo Offer",
  FREE_BEVERAGE: "Free Beverage",
  GIFT: "Gift",
  COIN_VOUCHER: "Coin Voucher",
};

export interface RewardQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  brandId?: string;
  storeId?: string;
  rewardType?: RewardType;
  maxCoinCost?: number;
  featuredOnly?: boolean;
  sort?: RewardSort;
}

export interface VoucherQueryParams {
  page?: number;
  pageSize?: number;
  status?: VoucherStatus;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedRewards {
  items: RewardListItem[];
  meta: PaginationMeta;
}

export interface PaginatedVouchers {
  items: Voucher[];
  meta: PaginationMeta;
}
