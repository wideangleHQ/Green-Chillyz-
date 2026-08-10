import { api } from './client';

// Common interfaces
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Customers types
export interface DashboardCustomerListItem {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
  referralCode: string | null;
  walletBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface DashboardActivityItem {
  type: 'WALLET' | 'REDEMPTION' | 'GAME' | 'NOTIFICATION';
  occurredAt: string;
  title: string;
  detail: string | null;
  referenceId: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
  referralCode: string | null;
  wallet: {
    balance: number;
    pendingBalance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    lifetimeExpired: number;
    isActive: boolean;
  };
  counts: {
    redemptions: number;
    activeVouchers: number;
    gameSessions: number;
    unreadNotifications: number;
  };
  customerProfile?: {
    dateOfBirth: string | null;
    gender: string | null;
    referredBy?: {
      user: {
        id: string;
        fullName: string;
      };
    } | null;
  };
}

// Wallet types
export interface DashboardWalletListItem {
  customerId: string;
  customerName: string;
  customerEmail: string;
  balance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  isActive: boolean;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  source: string;
  description: string | null;
  createdAt: string;
  referenceId: string | null;
}

// Voucher types
export interface DashboardVoucherListItem {
  id: string;
  code: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  redeemedAt: string | null;
  createdAt: string;
  reward: {
    id: string;
    title: string;
    coinCost: number;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface VoucherDetail extends DashboardVoucherListItem {
  redeemedBy: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  redemption: {
    id: string;
    status: string;
    coinsSpent: number;
    createdAt: string;
  } | null;
  store: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface VoucherRedeemResult {
  valid: boolean;
  reason?: string;
  voucher?: {
    id: string;
    code: string;
    status: string;
    expiresAt: string;
    reward: { title: string; coinCost: number };
    user: { fullName: string; email: string };
  };
}

// Store types
export interface StoreProfile {
  id: string;
  name: string;
  slug: string;
  code: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  timings?: Array<{
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  holidays?: Array<{
    id: string;
    name: string;
    date: string;
    isClosed: boolean;
  }>;
  managers?: Array<{
    id: string;
    userId: string;
    role: string;
    user: { fullName: string; email: string };
  }>;
  facilities?: Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
  gallery?: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
  }>;
}

export interface StoreStats {
  newCustomers: number;
  activeVouchers: number;
  todayRedemptions: number;
  walletCredits: number;
  walletDebits: number;
}

// Analytics types
export interface DashboardAnalyticsTotals {
  newCustomers: number;
  walletCredits: { count: number; total: number };
  walletDebits: { count: number; total: number };
  rewardRedemptions: number;
  voucherRedemptions: number;
  gamePlays: number;
  notifications: number;
}

export interface DashboardAnalyticsOverview extends DashboardAnalyticsTotals {
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
}

export interface DashboardAnalyticsBucket extends DashboardAnalyticsTotals {
  bucketStart: string;
}

export interface DashboardAnalyticsSeries {
  granularity: 'day' | 'week' | 'month';
  rangeStart: string;
  rangeEnd: string;
  totals: DashboardAnalyticsTotals;
  series: DashboardAnalyticsBucket[];
  generatedAt: string;
}

// Audit types
export interface AuditRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorType: string;
  actorName: string;
  actorRole: string;
  storeId: string | null;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  metadata: any;
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  rules?: Array<{
    id: string;
    name: string;
    ruleType: string;
    operator: string;
    value: string;
  }>;
}

// Rewards Catalog types
export interface Reward {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  image: string | null;
  coinCost: number;
  rewardType: 'FREE_ITEM' | 'DISCOUNT' | 'BUY_ONE_GET_ONE' | 'CASHBACK' | 'COUPON' | 'PARTNER' | 'GIFT' | 'FESTIVAL' | 'LIMITED_TIME' | 'CUSTOM';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
  stock: number | null;
  dailyLimit: number | null;
  userLimit: number | null;
  validFrom: string | null;
  validUntil: string | null;
  terms: string | null;
  totalRedemptions: number;
  totalViews: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

type AnyRecord = Record<string, any>;
type CustomerSortField = 'createdAt' | 'fullName' | 'lastLoginAt' | 'name';
type CustomerSortInput = CustomerSortField | (string & {});
type WalletSortField = 'balance' | 'lifetimeEarned' | 'lifetimeSpent' | 'updatedAt';

function compact<T extends AnyRecord>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

function pick<T extends AnyRecord>(value: T | undefined, keys: readonly string[]) {
  if (!value) return undefined;
  return compact(
    keys.reduce<AnyRecord>((next, key) => {
      if (key in value) next[key] = value[key];
      return next;
    }, {}),
  );
}

function normalizeDateRange(params?: AnyRecord) {
  if (!params) return undefined;
  const next = { ...params };
  if ('from' in next && !('fromDate' in next)) next.fromDate = next.from;
  if ('to' in next && !('toDate' in next)) next.toDate = next.to;
  delete next.from;
  delete next.to;
  return next;
}

function normalizeCustomerParams(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: CustomerSortInput;
  sortOrder?: 'asc' | 'desc';
}) {
  const next = { ...params };
  if (next.sortBy === 'name') next.sortBy = 'fullName';
  if (
    next.sortBy &&
    !['createdAt', 'fullName', 'lastLoginAt'].includes(next.sortBy)
  ) {
    delete next.sortBy;
  }
  return pick(next, ['search', 'page', 'pageSize', 'sortBy', 'sortOrder']);
}

const REWARD_CREATE_FIELDS = [
  'title',
  'slug',
  'description',
  'shortDescription',
  'image',
  'bannerImage',
  'categoryId',
  'brandId',
  'coinCost',
  'cashAmount',
  'rewardType',
  'availability',
  'status',
  'priority',
  'isFeatured',
  'stock',
  'dailyLimit',
  'userLimit',
  'minimumLoyaltyTier',
  'campaignId',
  'voucherValidDays',
  'validFrom',
  'validUntil',
  'terms',
  'metadata',
] as const;

const REWARD_UPDATE_FIELDS = REWARD_CREATE_FIELDS.filter((field) => field !== 'slug');

const CAMPAIGN_CREATE_FIELDS = [
  'name',
  'slug',
  'description',
  'eventType',
  'source',
  'baseCoins',
  'multiplier',
  'bonusCoins',
  'maxClaims',
  'dailyLimit',
  'totalBudget',
  'coinExpiryDays',
  'storeIds',
  'brandIds',
  'minPurchase',
  'metadata',
  'startsAt',
  'endsAt',
] as const;

const CAMPAIGN_UPDATE_FIELDS = CAMPAIGN_CREATE_FIELDS.filter((field) => field !== 'slug');

const REWARD_PROFILE_CREATE_FIELDS = ['name', 'description', 'type', 'metadata'] as const;
const REWARD_PROFILE_UPDATE_FIELDS = ['name', 'description', 'type', 'status', 'metadata'] as const;
const REWARD_RULE_CREATE_FIELDS = [
  'profileId',
  'name',
  'description',
  'ruleType',
  'coinRequirement',
  'rewardType',
  'rewardReference',
  'displayOrder',
  'priority',
  'validFrom',
  'expiryDate',
] as const;
const REWARD_RULE_UPDATE_FIELDS = [
  'name',
  'description',
  'coinRequirement',
  'rewardType',
  'rewardReference',
  'displayOrder',
  'priority',
  'status',
  'validFrom',
  'expiryDate',
] as const;
const REWARD_ASSIGN_FIELDS = [
  'storeId',
  'profileId',
  'assignmentType',
  'effectiveFrom',
  'effectiveUntil',
  'reason',
] as const;
const REWARD_CHANGE_ASSIGNMENT_FIELDS = ['profileId', 'reason'] as const;
const REWARD_BULK_ASSIGN_FIELDS = ['storeIds', 'profileId', 'reason'] as const;
const REWARD_OVERRIDE_CREATE_FIELDS = [
  'ruleId',
  'overrideRewardType',
  'overrideRewardRef',
  'overrideCoinReq',
  'overrideDisplayOrder',
  'overridePriority',
  'effectiveFrom',
  'effectiveUntil',
  'reason',
] as const;
const REWARD_OVERRIDE_UPDATE_FIELDS = [
  'overrideRewardType',
  'overrideRewardRef',
  'overrideCoinReq',
  'overrideDisplayOrder',
  'overridePriority',
  'effectiveUntil',
  'status',
  'reason',
] as const;

const COIN_RULE_FIELDS = [
  'name',
  'description',
  'ruleType',
  'coinAmount',
  'minCoins',
  'maxCoins',
  'dailyLimit',
  'weeklyLimit',
  'monthlyLimit',
  'lifetimeLimit',
  'cooldownSeconds',
  'enabled',
  'priority',
  'status',
  'effectiveFrom',
  'effectiveUntil',
  'metadata',
] as const;
const COIN_LIMIT_FIELDS = [
  'ruleId',
  'name',
  'description',
  'scope',
  'maxCoins',
  'maxClaims',
  'windowSeconds',
  'storeId',
  'enabled',
  'priority',
  'effectiveFrom',
  'effectiveUntil',
] as const;
const COIN_MULTIPLIER_FIELDS = [
  'name',
  'description',
  'type',
  'multiplier',
  'ruleId',
  'ruleType',
  'storeId',
  'campaignReference',
  'daysOfWeek',
  'stackable',
  'priority',
  'enabled',
  'status',
  'effectiveFrom',
  'effectiveUntil',
] as const;

const CHALLENGE_CREATE_FIELDS = [
  'name',
  'slug',
  'description',
  'shortDescription',
  'image',
  'icon',
  'type',
  'status',
  'priority',
  'isFeatured',
  'maxParticipants',
  'startsAt',
  'endsAt',
  'storeIds',
  'brandIds',
  'campaignRef',
  'autoEnroll',
  'repeatableAfterDays',
  'metadata',
] as const;
const CHALLENGE_UPDATE_FIELDS = CHALLENGE_CREATE_FIELDS.filter((field) => field !== 'slug');
const CHALLENGE_RULE_CREATE_FIELDS = [
  'challengeId',
  'ruleType',
  'targetCount',
  'targetAmount',
  'gameSlug',
  'storeId',
  'sortOrder',
  'description',
  'metadata',
] as const;
const CHALLENGE_RULE_UPDATE_FIELDS = CHALLENGE_RULE_CREATE_FIELDS.filter(
  (field) => field !== 'challengeId',
);
const CHALLENGE_REWARD_CREATE_FIELDS = [
  'challengeId',
  'rewardType',
  'coinAmount',
  'rewardReference',
  'quantity',
  'sortOrder',
  'description',
  'metadata',
] as const;
const CHALLENGE_REWARD_UPDATE_FIELDS = CHALLENGE_REWARD_CREATE_FIELDS.filter(
  (field) => field !== 'challengeId',
);

// Store Voucher types
export type StoreVoucherType = 'PERCENTAGE' | 'FLAT_DISCOUNT' | 'FREE_ITEM' | 'COMBO' | 'FREE_BEVERAGE' | 'GIFT' | 'COIN_VOUCHER';
export type StoreVoucherStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'ARCHIVED';

export interface StoreVoucher {
  id: string;
  storeId: string;
  name: string;
  shortTitle: string | null;
  description: string | null;
  offerTag: string | null;
  discountBadge: string | null;
  offerImage: string | null;
  bannerImage: string | null;
  couponCode: string;
  voucherType: StoreVoucherType;
  minimumOrderValue: number | null;
  maximumDiscount: number | null;
  voucherValue: number | null;
  itemsIncluded: string | null;
  redeemVenue: string | null;
  validDays: string[] | null;
  startDate: string | null;
  endDate: string | null;
  validTime: string | null;
  totalLimit: number;
  remainingCount: number;
  redeemedCount: number;
  status: StoreVoucherStatus;
  isFeatured: boolean;
  priority: number;
  sortOrder: number;
  terms: string[] | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface StoreVoucherAnalytics {
  created: number;
  redeemed: number;
  remaining: number;
  expired: number;
  mostRedeemed: Array<{ name: string; count: number }>;
  conversionRate: number;
}

const STORE_VOUCHER_CREATE_FIELDS = [
  'name', 'shortTitle', 'description', 'offerTag', 'discountBadge',
  'offerImage', 'bannerImage', 'couponCode', 'voucherType',
  'minimumOrderValue', 'maximumDiscount', 'voucherValue', 'itemsIncluded',
  'redeemVenue', 'validDays', 'startDate', 'endDate', 'validTime',
  'totalLimit', 'isFeatured', 'priority', 'sortOrder', 'terms', 'status',
] as const;

const STORE_VOUCHER_UPDATE_FIELDS = STORE_VOUCHER_CREATE_FIELDS.filter(
  (f) => f !== 'couponCode' && f !== 'status',
);

export const opsApi = {
  // --- Customers ---
  async searchCustomers(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: CustomerSortInput;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<DashboardCustomerListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardCustomerListItem>>('/dashboard/customers', {
      params: normalizeCustomerParams(params),
    });
    return data;
  },

  async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    const { data } = await api.get<CustomerProfile>(`/dashboard/customers/${customerId}`);
    return data;
  },

  async getCustomerWallet(customerId: string) {
    const { data } = await api.get(`/dashboard/customers/${customerId}/wallet`);
    return data;
  },

  async getCustomerRewards(customerId: string, params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get(`/dashboard/customers/${customerId}/rewards`, { params });
    return data;
  },

  async getCustomerGames(customerId: string, params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get(`/dashboard/customers/${customerId}/games`, { params });
    return data;
  },

  async getCustomerNotifications(customerId: string, params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get(`/dashboard/customers/${customerId}/notifications`, { params });
    return data;
  },

  async getCustomerActivity(customerId: string, limit = 10): Promise<DashboardActivityItem[]> {
    const { data } = await api.get<DashboardActivityItem[]>(`/dashboard/customers/${customerId}/activity`, {
      params: { limit },
    });
    return data;
  },

  // --- Wallet ---
  async listWallets(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: WalletSortField;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<DashboardWalletListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardWalletListItem>>('/dashboard/wallets', {
      params: pick(params, ['search', 'page', 'pageSize', 'sortBy', 'sortOrder']),
    });
    return data;
  },

  async getWalletSummary(customerId: string) {
    const { data } = await api.get(`/dashboard/wallets/${customerId}`);
    return data;
  },

  async getWalletTransactions(customerId: string, params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    source?: string;
    status?: string;
  }): Promise<PaginatedResponse<WalletTransaction>> {
    const { data } = await api.get<PaginatedResponse<WalletTransaction>>(`/dashboard/wallets/${customerId}/transactions`, {
      params: pick(params, ['page', 'pageSize', 'type', 'source', 'status']),
    });
    return data;
  },

  // --- Vouchers ---
  async listVouchers(params: {
    status?: string;
    code?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<DashboardVoucherListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardVoucherListItem>>('/dashboard/vouchers', {
      params: pick(params, ['status', 'code', 'page', 'pageSize']),
    });
    return data;
  },

  async getVoucherHistory(params: {
    code?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<DashboardVoucherListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardVoucherListItem>>('/dashboard/vouchers/history', {
      params: pick(params, ['status', 'code', 'page', 'pageSize']),
    });
    return data;
  },

  async getVoucherDetail(voucherId: string): Promise<VoucherDetail> {
    const { data } = await api.get<VoucherDetail>(`/dashboard/vouchers/${voucherId}`);
    return data;
  },

  async redeemVoucher(code: string, signature: string): Promise<VoucherRedeemResult> {
    const { data } = await api.post<VoucherRedeemResult>('/dashboard/vouchers/redeem', { code, signature });
    return data;
  },

  // --- Stores ---
  async getStoreProfile(): Promise<StoreProfile> {
    const { data } = await api.get<StoreProfile>('/dashboard/stores/me');
    return data;
  },

  async getStoreStats(): Promise<StoreStats> {
    const { data } = await api.get<StoreStats>('/dashboard/stores/me/stats');
    return data;
  },

  async getStoreActivity(limit = 10): Promise<DashboardActivityItem[]> {
    const { data } = await api.get<DashboardActivityItem[]>('/dashboard/stores/me/activity', {
      params: { limit },
    });
    return data;
  },

  // Store Management API integrations
  async updateStoreTiming(storeId: string, timingId: string, dto: any) {
    const { data } = await api.patch(`/stores/${storeId}/timings/${timingId}`, pick(dto, ['opensAt', 'closesAt', 'isClosed']));
    return data;
  },

  async addStoreHoliday(storeId: string, dto: any) {
    const { data } = await api.post(`/stores/${storeId}/holidays`, pick({ ...dto, reason: dto?.reason ?? dto?.name }, ['date', 'reason', 'isClosed']));
    return data;
  },

  async getStoreHolidays(storeId: string) {
    const { data } = await api.get(`/stores/${storeId}/holidays`);
    return data;
  },

  async getStoreManagers(storeId: string) {
    const { data } = await api.get(`/stores/${storeId}/managers`);
    return data;
  },

  async getStoreFacilities(storeId: string) {
    const { data } = await api.get(`/stores/${storeId}/facilities`);
    return data;
  },

  async getStoreGallery(storeId: string) {
    const { data } = await api.get(`/stores/${storeId}/gallery`);
    return data;
  },

  // --- Analytics ---
  async getAnalyticsOverview(): Promise<DashboardAnalyticsOverview> {
    const { data } = await api.get<DashboardAnalyticsOverview>('/dashboard/analytics/overview');
    return data;
  },

  async getAnalyticsDaily(): Promise<DashboardAnalyticsSeries> {
    const { data } = await api.get<DashboardAnalyticsSeries>('/dashboard/analytics/daily');
    return data;
  },

  async getAnalyticsWeekly(): Promise<DashboardAnalyticsSeries> {
    const { data } = await api.get<DashboardAnalyticsSeries>('/dashboard/analytics/weekly');
    return data;
  },

  async getAnalyticsMonthly(): Promise<DashboardAnalyticsSeries> {
    const { data } = await api.get<DashboardAnalyticsSeries>('/dashboard/analytics/monthly');
    return data;
  },

  // --- Notifications ---
  async listNotifications(params: { page?: number; pageSize?: number; status?: string }) {
    const { data } = await api.get('/dashboard/notifications', {
      params: pick(normalizeDateRange(params), ['page', 'pageSize', 'status', 'type', 'fromDate', 'toDate']),
    });
    return data;
  },

  async getUnreadNotificationsCount(): Promise<{ unread: number }> {
    const { data } = await api.get<{ unread: number }>('/dashboard/notifications/unread');
    return data;
  },

  async getNotificationHistory(params: { page?: number; pageSize?: number; type?: string; status?: string }) {
    const { data } = await api.get('/dashboard/notifications/history', {
      params: pick(normalizeDateRange(params), ['page', 'pageSize', 'status', 'type', 'fromDate', 'toDate']),
    });
    return data;
  },

  // --- Audit Logs ---
  async queryAuditLogs(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    severity?: string;
    action?: string;
    entityType?: string;
  }): Promise<PaginatedResponse<AuditRecord>> {
    const { data } = await api.get<PaginatedResponse<AuditRecord>>('/audit', {
      params: pick(normalizeDateRange({ ...params, limit: params.pageSize }), [
        'cursor',
        'limit',
        'fromDate',
        'toDate',
        'userId',
        'employeeId',
        'storeId',
        'actorType',
        'actorRole',
        'severity',
        'entityType',
        'entityId',
        'action',
        'eventType',
      ]),
    });
    return data;
  },

  async getRecentAuditLogs(): Promise<AuditRecord[]> {
    const { data } = await api.get<AuditRecord[]>('/audit/recent');
    return data;
  },

  async searchAuditLogs(params: AnyRecord) {
    const { data } = await api.get<any>('/audit/search', {
      params: pick({ ...params, q: params?.query ?? params?.q, limit: params?.pageSize }, ['q', 'entityType', 'cursor', 'limit']),
    });
    return data;
  },

  async getAuditAnalytics(params?: { from?: string; to?: string }) {
    const { data } = await api.get<any>('/audit/analytics', {
      params: pick(normalizeDateRange(params), ['fromDate', 'toDate', 'storeId']),
    });
    return data;
  },

  async getAuditFraudIndicators(params?: { from?: string; to?: string }) {
    const { data } = await api.get<any>('/audit/fraud-indicators', {
      params: pick(normalizeDateRange(params), ['fromDate', 'toDate', 'storeId']),
    });
    return data;
  },

  async getAuditByEntity(params: { entityType: string; entityId: string }) {
    const { data } = await api.get<any>('/audit/entity', {
      params: pick(params, ['entityType', 'entityId', 'cursor', 'limit']),
    });
    return data;
  },

  async getAuditByUser(userId: string) {
    const { data } = await api.get<any>(`/audit/user/${userId}`);
    return data;
  },

  async getAuditLog(id: string): Promise<AuditRecord> {
    const { data } = await api.get<AuditRecord>(`/audit/${id}`);
    return data;
  },

  // --- Campaigns ---
  async listCampaigns(params?: { status?: string; search?: string }): Promise<Campaign[]> {
    const { data } = await api.get<Campaign[]>('/rewards/campaigns', {
      params: pick(params, ['eventType', 'status', 'page', 'pageSize']),
    });
    return data;
  },

  async createCampaign(dto: any): Promise<Campaign> {
    const { data } = await api.post<Campaign>('/rewards/campaigns', pick(dto, CAMPAIGN_CREATE_FIELDS));
    return data;
  },

  async updateCampaign(campaignId: string, dto: any): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/rewards/campaigns/${campaignId}`, pick(dto, CAMPAIGN_UPDATE_FIELDS));
    return data;
  },

  async updateCampaignStatus(campaignId: string, status: string): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/rewards/campaigns/${campaignId}/status/${status}`);
    return data;
  },

  async getCampaignRules(campaignId: string) {
    const { data } = await api.get(`/rewards/rules/${campaignId}`);
    return data;
  },

  async addCampaignRule(dto: any) {
    const { data } = await api.post('/rewards/rules', pick(dto, ['campaignId', 'ruleType', 'operator', 'value', 'priority']));
    return data;
  },

  async removeCampaignRule(ruleId: string) {
    const { data } = await api.delete(`/rewards/rules/${ruleId}`);
    return data;
  },

  // --- Rewards / Offers ---
  async listRewards(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Reward>> {
    const { data } = await api.get<PaginatedResponse<Reward>>('/dashboard/rewards', {
      params: pick(params, [
        'page',
        'pageSize',
        'search',
        'category',
        'brandId',
        'storeId',
        'rewardType',
        'affordableOnly',
        'maxCoinCost',
        'featuredOnly',
        'sort',
      ]),
    });
    return data;
  },

  async getRewardDetail(rewardIdOrSlug: string): Promise<Reward> {
    const { data } = await api.get<Reward>(`/dashboard/rewards/${rewardIdOrSlug}`);
    return data;
  },

  async getRewardRedemptions(rewardId: string, params?: { page?: number; pageSize?: number; status?: string }) {
    const { data } = await api.get(`/dashboard/rewards/${rewardId}/redemptions`, {
      params: pick(params, ['page', 'pageSize', 'status']),
    });
    return data;
  },

  // Catalog administration is store-scoped by DashboardAuthGuard.
  async listCatalogAdmin(params?: AnyRecord): Promise<PaginatedResponse<Reward>> {
    const { data } = await api.get<PaginatedResponse<Reward>>('/dashboard/catalog', {
      params: pick(params, [
        'page',
        'pageSize',
        'search',
        'category',
        'brandId',
        'rewardType',
        'affordableOnly',
        'maxCoinCost',
        'featuredOnly',
        'sort',
        'status',
      ]),
    });
    return data;
  },

  async createReward(dto: any): Promise<Reward> {
    const { data } = await api.post<Reward>('/dashboard/catalog', pick(dto, REWARD_CREATE_FIELDS));
    return data;
  },

  async updateReward(rewardId: string, dto: any): Promise<Reward> {
    const { data } = await api.patch<Reward>(`/dashboard/catalog/${rewardId}`, pick(dto, REWARD_UPDATE_FIELDS));
    return data;
  },

  async updateRewardStatus(rewardId: string, status: string): Promise<Reward> {
    const { data } = await api.patch<Reward>(`/dashboard/catalog/${rewardId}/status/${status}`);
    return data;
  },

  async adjustRewardStock(rewardId: string, stock: number): Promise<Reward> {
    const { data } = await api.patch<Reward>(`/dashboard/catalog/${rewardId}/stock/${stock}`);
    return data;
  },

  async deleteReward(rewardId: string) {
    const { data } = await api.delete(`/dashboard/catalog/${rewardId}`);
    return data;
  },

  // --- Reward Profiles ---
  async listRewardProfiles(params?: { search?: string; status?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get<any>('/dashboard/reward-profiles', {
      params: pick(params, ['search', 'status', 'type', 'page', 'pageSize']),
    });
    return data;
  },

  async getDefaultRewardProfile() {
    const { data } = await api.get<any>('/dashboard/reward-profiles/default');
    return data;
  },

  async getRewardProfile(idOrSlug: string) {
    const { data } = await api.get<any>(`/dashboard/reward-profiles/${idOrSlug}`);
    return data;
  },

  async getRewardProfileVersions(id: string) {
    const { data } = await api.get<any>(`/dashboard/reward-profiles/${id}/versions`);
    return data;
  },

  async createRewardProfile(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-profiles', pick(dto, REWARD_PROFILE_CREATE_FIELDS));
    return data;
  },

  async updateRewardProfile(id: string, dto: any) {
    const { data } = await api.patch<any>(`/dashboard/reward-profiles/${id}`, pick(dto, REWARD_PROFILE_UPDATE_FIELDS));
    return data;
  },

  async archiveRewardProfile(id: string) {
    const { data } = await api.delete<any>(`/dashboard/reward-profiles/${id}`);
    return data;
  },

  async restoreRewardProfile(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-profiles/${id}/restore`);
    return data;
  },

  async duplicateRewardProfile(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-profiles/${id}/duplicate`, {});
    return data;
  },

  async publishRewardProfile(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-profiles/${id}/publish`, {});
    return data;
  },

  async setDefaultRewardProfile(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-profiles/${id}/set-default`);
    return data;
  },

  async rollbackRewardProfile(id: string, versionNumber: number) {
    const { data } = await api.post<any>(`/dashboard/reward-profiles/${id}/rollback/${versionNumber}`);
    return data;
  },

  // --- Reward Rules ---
  async listRewardRules(params?: { search?: string; profileId?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get<any>('/dashboard/reward-rules', {
      params: pick(params, ['profileId', 'status', 'ruleType', 'search', 'page', 'pageSize']),
    });
    return data;
  },

  async getRewardMilestones() {
    const { data } = await api.get<any>('/dashboard/reward-rules/milestones');
    return data;
  },

  async getRewardRulesByProfile(profileId: string) {
    const { data } = await api.get<any>(`/dashboard/reward-rules/profile/${profileId}`);
    return data;
  },

  async getRewardRule(id: string) {
    const { data } = await api.get<any>(`/dashboard/reward-rules/${id}`);
    return data;
  },

  async createRewardRule(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-rules', pick(dto, REWARD_RULE_CREATE_FIELDS));
    return data;
  },

  async updateRewardRule(id: string, dto: any) {
    const { data } = await api.patch<any>(`/dashboard/reward-rules/${id}`, pick(dto, REWARD_RULE_UPDATE_FIELDS));
    return data;
  },

  async archiveRewardRule(id: string) {
    const { data } = await api.delete<any>(`/dashboard/reward-rules/${id}`);
    return data;
  },

  async restoreRewardRule(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-rules/${id}/restore`);
    return data;
  },

  async enableRewardRule(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-rules/${id}/enable`);
    return data;
  },

  async disableRewardRule(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-rules/${id}/disable`);
    return data;
  },

  async duplicateRewardRule(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-rules/${id}/duplicate`, {});
    return data;
  },

  async bulkUpdateRewardRules(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-rules/bulk-update', pick(dto, ['ruleIds', 'status', 'priority']));
    return data;
  },

  // --- Reward Assignments ---
  async listRewardAssignments(params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get<any>('/dashboard/reward-assignments', {
      params: pick(params, ['storeId', 'profileId', 'page', 'pageSize']),
    });
    return data;
  },

  async getMyRewardAssignment() {
    const { data } = await api.get<any>('/dashboard/reward-assignments/my-store');
    return data;
  },

  async getMyRewardProfile() {
    const { data } = await api.get<any>('/dashboard/reward-assignments/my-store/profile');
    return data;
  },

  async getMyRewardAssignmentHistory() {
    const { data } = await api.get<any>('/dashboard/reward-assignments/my-store/history');
    return data;
  },

  async getRewardAssignmentByStore(storeId: string) {
    const { data } = await api.get<any>(`/dashboard/reward-assignments/store/${storeId}`);
    return data;
  },

  async assignRewardProfile(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-assignments', pick(dto, REWARD_ASSIGN_FIELDS));
    return data;
  },

  async changeStoreRewardProfile(storeId: string, dto: any) {
    const { data } = await api.post<any>(`/dashboard/reward-assignments/store/${storeId}/change`, pick(dto, REWARD_CHANGE_ASSIGNMENT_FIELDS));
    return data;
  },

  async getRewardAssignment(id: string) {
    const { data } = await api.get<any>(`/dashboard/reward-assignments/${id}`);
    return data;
  },

  async getStoreAssignmentHistory(storeId: string) {
    const { data } = await api.get<any>(`/dashboard/reward-assignments/store/${storeId}/history`);
    return data;
  },

  async archiveRewardAssignment(id: string) {
    const { data } = await api.delete<any>(`/dashboard/reward-assignments/${id}`);
    return data;
  },

  async restoreRewardAssignment(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-assignments/${id}/restore`);
    return data;
  },

  async bulkAssignRewardProfiles(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-assignments/bulk-assign', pick(dto, REWARD_BULK_ASSIGN_FIELDS));
    return data;
  },

  // --- Reward Overrides ---
  async listMyRewardOverrides(params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get<any>('/dashboard/reward-overrides');
    return data;
  },

  async previewMyRewards() {
    const { data } = await api.get<any>('/dashboard/reward-overrides/preview');
    return data;
  },

  async getMyOverrideHistory() {
    const { data } = await api.get<any>('/dashboard/reward-overrides/history');
    return data;
  },

  async listOverridesByStore(storeId: string) {
    const { data } = await api.get<any>(`/dashboard/reward-overrides/store/${storeId}`);
    return data;
  },

  async previewStoreRewards(storeId: string) {
    const { data } = await api.get<any>(`/dashboard/reward-overrides/store/${storeId}/preview`);
    return data;
  },

  async getRewardOverride(id: string) {
    const { data } = await api.get<any>(`/dashboard/reward-overrides/${id}`);
    return data;
  },

  async createRewardOverride(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-overrides', pick(dto, REWARD_OVERRIDE_CREATE_FIELDS));
    return data;
  },

  async updateRewardOverride(id: string, dto: any) {
    const { data } = await api.patch<any>(`/dashboard/reward-overrides/${id}`, pick(dto, REWARD_OVERRIDE_UPDATE_FIELDS));
    return data;
  },

  async archiveRewardOverride(id: string) {
    const { data } = await api.delete<any>(`/dashboard/reward-overrides/${id}`);
    return data;
  },

  async restoreRewardOverride(id: string) {
    const { data } = await api.post<any>(`/dashboard/reward-overrides/${id}/restore`);
    return data;
  },

  async bulkCreateRewardOverrides(dto: any) {
    const { data } = await api.post<any>('/dashboard/reward-overrides/bulk', {
      overrides: Array.isArray(dto?.overrides)
        ? dto.overrides.map((override: AnyRecord) => pick(override, REWARD_OVERRIDE_CREATE_FIELDS))
        : [],
    });
    return data;
  },

  // --- Reward Analytics ---
  async getRewardAnalytics() {
    const { data } = await api.get<any>('/dashboard/reward-analytics');
    return data;
  },

  // --- Reward Search ---
  async searchRewards(params?: AnyRecord) {
    const { data } = await api.get<any>('/dashboard/reward-search', {
      params: pick({ ...params, query: params?.query ?? params?.q }, ['query', 'page', 'pageSize']),
    });
    return data;
  },

  // --- Coin Economy ---
  async getCoinRules() {
    const { data } = await api.get<any>('/coin-economy/rules');
    return data;
  },

  async getCoinGameRules() {
    const { data } = await api.get<any>('/coin-economy/game-rules');
    return data;
  },

  async getCoinDailyLimits() {
    const { data } = await api.get<any>('/coin-economy/daily-limits');
    return data;
  },

  async getCoinBonuses() {
    const { data } = await api.get<any>('/coin-economy/available-bonuses');
    return data;
  },

  // --- Coin Rules ---
  async listCoinRules(params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get<any>('/coin-rules', {
      params: pick(params, ['ruleType', 'status', 'enabled', 'page', 'pageSize', 'search', 'includeArchived']),
    });
    return data;
  },

  async getCoinRule(id: string) {
    const { data } = await api.get<any>(`/coin-rules/${id}`);
    return data;
  },

  async getCoinRuleHistory(id: string) {
    const { data } = await api.get<any>(`/coin-rules/${id}/history`);
    return data;
  },

  async getCoinRuleMetadata(id: string) {
    const { data } = await api.get<any>(`/coin-rules/${id}/metadata`);
    return data;
  },

  async createCoinRule(dto: any) {
    const { data } = await api.post<any>('/coin-rules', pick(dto, COIN_RULE_FIELDS));
    return data;
  },

  async updateCoinRule(id: string, dto: any) {
    const { data } = await api.patch<any>(`/coin-rules/${id}`, pick(dto, COIN_RULE_FIELDS));
    return data;
  },

  async enableCoinRule(id: string) {
    const { data } = await api.post<any>(`/coin-rules/${id}/enable`);
    return data;
  },

  async disableCoinRule(id: string) {
    const { data } = await api.post<any>(`/coin-rules/${id}/disable`);
    return data;
  },

  async duplicateCoinRule(id: string) {
    const { data } = await api.post<any>(`/coin-rules/${id}/duplicate`, {});
    return data;
  },

  async restoreCoinRule(id: string) {
    const { data } = await api.post<any>(`/coin-rules/${id}/restore`);
    return data;
  },

  async deleteCoinRule(id: string) {
    const { data } = await api.delete<any>(`/coin-rules/${id}`);
    return data;
  },

  // --- Coin Limits ---
  async listCoinLimits() {
    const { data } = await api.get<any>('/coin-limits');
    return data;
  },

  async getCoinLimit(id: string) {
    const { data } = await api.get<any>(`/coin-limits/${id}`);
    return data;
  },

  async createCoinLimit(dto: any) {
    const { data } = await api.post<any>('/coin-limits', pick(dto, COIN_LIMIT_FIELDS));
    return data;
  },

  async updateCoinLimit(id: string, dto: any) {
    const { data } = await api.patch<any>(`/coin-limits/${id}`, pick(dto, COIN_LIMIT_FIELDS));
    return data;
  },

  async restoreCoinLimit(id: string) {
    const { data } = await api.post<any>(`/coin-limits/${id}/restore`);
    return data;
  },

  async deleteCoinLimit(id: string) {
    const { data } = await api.delete<any>(`/coin-limits/${id}`);
    return data;
  },

  // --- Coin Multipliers ---
  async listCoinMultipliers() {
    const { data } = await api.get<any>('/coin-multipliers');
    return data;
  },

  async getCoinMultiplier(id: string) {
    const { data } = await api.get<any>(`/coin-multipliers/${id}`);
    return data;
  },

  async createCoinMultiplier(dto: any) {
    const { data } = await api.post<any>('/coin-multipliers', pick(dto, COIN_MULTIPLIER_FIELDS));
    return data;
  },

  async updateCoinMultiplier(id: string, dto: any) {
    const { data } = await api.patch<any>(`/coin-multipliers/${id}`, pick(dto, COIN_MULTIPLIER_FIELDS));
    return data;
  },

  async restoreCoinMultiplier(id: string) {
    const { data } = await api.post<any>(`/coin-multipliers/${id}/restore`);
    return data;
  },

  async deleteCoinMultiplier(id: string) {
    const { data } = await api.delete<any>(`/coin-multipliers/${id}`);
    return data;
  },

  // --- Challenges ---
  async listChallenges(params?: { status?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get<any>('/challenges', {
      params: pick(params, ['type', 'status', 'isFeatured', 'includeArchived', 'page', 'pageSize']),
    });
    return data;
  },

  async getChallenge(id: string) {
    const { data } = await api.get<any>(`/challenges/${id}`);
    return data;
  },

  async createChallenge(dto: any) {
    const { data } = await api.post<any>('/challenges', pick(dto, CHALLENGE_CREATE_FIELDS));
    return data;
  },

  async updateChallenge(id: string, dto: any) {
    const { data } = await api.patch<any>(`/challenges/${id}`, pick(dto, CHALLENGE_UPDATE_FIELDS));
    return data;
  },

  async deleteChallenge(id: string) {
    const { data } = await api.delete<any>(`/challenges/${id}`);
    return data;
  },

  async restoreChallenge(id: string) {
    const { data } = await api.post<any>(`/challenges/${id}/restore`);
    return data;
  },

  async publishChallenge(id: string) {
    const { data } = await api.post<any>(`/challenges/${id}/publish`);
    return data;
  },

  async pauseChallenge(id: string) {
    const { data } = await api.post<any>(`/challenges/${id}/pause`);
    return data;
  },

  async endChallenge(id: string) {
    const { data } = await api.post<any>(`/challenges/${id}/end`);
    return data;
  },

  async duplicateChallenge(id: string, dto?: any) {
    const { data } = await api.post<any>(`/challenges/${id}/duplicate`, pick(dto, ['name', 'startsAt', 'endsAt']));
    return data;
  },

  async getChallengeHistory(id: string) {
    const { data } = await api.get<any>(`/challenges/${id}/history`);
    return data;
  },

  async createChallengeRule(dto: any) {
    const { data } = await api.post<any>('/challenges/rules', pick(dto, CHALLENGE_RULE_CREATE_FIELDS));
    return data;
  },

  async updateChallengeRule(ruleId: string, dto: any) {
    const { data } = await api.patch<any>(`/challenges/rules/${ruleId}`, pick(dto, CHALLENGE_RULE_UPDATE_FIELDS));
    return data;
  },

  async deleteChallengeRule(ruleId: string) {
    const { data } = await api.delete<any>(`/challenges/rules/${ruleId}`);
    return data;
  },

  async createChallengeReward(dto: any) {
    const { data } = await api.post<any>('/challenges/rewards', pick(dto, CHALLENGE_REWARD_CREATE_FIELDS));
    return data;
  },

  async updateChallengeReward(rewardId: string, dto: any) {
    const { data } = await api.patch<any>(`/challenges/rewards/${rewardId}`, pick(dto, CHALLENGE_REWARD_UPDATE_FIELDS));
    return data;
  },

  async deleteChallengeReward(rewardId: string) {
    const { data } = await api.delete<any>(`/challenges/rewards/${rewardId}`);
    return data;
  },

  // --- Reward Resolution ---
  async previewRewardResolution(dto: any) {
    const { data } = await api.post<any>('/reward-resolution/preview', pick(dto, [
      'customerId',
      'storeId',
      'rewardType',
      'ruleType',
      'walletBalance',
      'coinBalance',
      'campaignContext',
      'storeContext',
      'date',
      'device',
      'ip',
      'referenceId',
      'referenceType',
      'metadata',
    ]));
    return data;
  },

  async getCustomerRewardSummary(params: { customerId: string; storeId: string }) {
    const { data } = await api.get<any>('/reward-resolution/customer-summary', {
      params: pick(params, ['customerId', 'storeId']),
    });
    return data;
  },

  // --- Store Vouchers ---
  async listStoreVouchers(params?: {
    search?: string;
    status?: string;
    tag?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<StoreVoucher>> {
    const { data } = await api.get<PaginatedResponse<StoreVoucher>>('/dashboard/store-vouchers', {
      params: pick(params, ['search', 'status', 'tag', 'fromDate', 'toDate', 'page', 'pageSize']),
    });
    return data;
  },

  async getStoreVoucher(id: string): Promise<StoreVoucher> {
    const { data } = await api.get<StoreVoucher>(`/dashboard/store-vouchers/${id}`);
    return data;
  },

  async createStoreVoucher(dto: any): Promise<StoreVoucher> {
    const { data } = await api.post<StoreVoucher>('/dashboard/store-vouchers', pick(dto, STORE_VOUCHER_CREATE_FIELDS));
    return data;
  },

  async updateStoreVoucher(id: string, dto: any): Promise<StoreVoucher> {
    const { data } = await api.patch<StoreVoucher>(`/dashboard/store-vouchers/${id}`, pick(dto, STORE_VOUCHER_UPDATE_FIELDS));
    return data;
  },

  async archiveStoreVoucher(id: string): Promise<StoreVoucher> {
    const { data } = await api.post<StoreVoucher>(`/dashboard/store-vouchers/${id}/archive`);
    return data;
  },

  async restoreStoreVoucher(id: string): Promise<StoreVoucher> {
    const { data } = await api.post<StoreVoucher>(`/dashboard/store-vouchers/${id}/restore`);
    return data;
  },

  async activateStoreVoucher(id: string): Promise<StoreVoucher> {
    const { data } = await api.post<StoreVoucher>(`/dashboard/store-vouchers/${id}/activate`);
    return data;
  },

  async deactivateStoreVoucher(id: string): Promise<StoreVoucher> {
    const { data } = await api.post<StoreVoucher>(`/dashboard/store-vouchers/${id}/deactivate`);
    return data;
  },

  async duplicateStoreVoucher(id: string): Promise<StoreVoucher> {
    const { data } = await api.post<StoreVoucher>(`/dashboard/store-vouchers/${id}/duplicate`);
    return data;
  },

  async redeemStoreVoucher(couponCode: string): Promise<any> {
    const { data } = await api.post<any>('/dashboard/store-vouchers/redeem', { couponCode });
    return data;
  },

  async getStoreVoucherHistory(id: string, params?: { page?: number; pageSize?: number }): Promise<any> {
    const { data } = await api.get<any>(`/dashboard/store-vouchers/${id}/history`, {
      params: pick(params, ['page', 'pageSize']),
    });
    return data;
  },

  async getStoreVoucherAnalytics(): Promise<StoreVoucherAnalytics> {
    const { data } = await api.get<StoreVoucherAnalytics>('/dashboard/store-vouchers/analytics');
    return data;
  },
};
