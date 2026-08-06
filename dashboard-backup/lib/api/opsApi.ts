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

export const opsApi = {
  // --- Customers ---
  async searchCustomers(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<DashboardCustomerListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardCustomerListItem>>('/dashboard/customers', { params });
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
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<DashboardWalletListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardWalletListItem>>('/dashboard/wallets', { params });
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
    const { data } = await api.get<PaginatedResponse<WalletTransaction>>(`/dashboard/wallets/${customerId}/transactions`, { params });
    return data;
  },

  // --- Vouchers ---
  async listVouchers(params: {
    status?: string;
    code?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<DashboardVoucherListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardVoucherListItem>>('/dashboard/vouchers', { params });
    return data;
  },

  async getVoucherHistory(params: {
    code?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<DashboardVoucherListItem>> {
    const { data } = await api.get<PaginatedResponse<DashboardVoucherListItem>>('/dashboard/vouchers/history', { params });
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
    const { data } = await api.put(`/stores/${storeId}/timings/${timingId}`, dto);
    return data;
  },

  async addStoreHoliday(storeId: string, dto: any) {
    const { data } = await api.post(`/stores/${storeId}/holidays`, dto);
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
    const { data } = await api.get('/dashboard/notifications', { params });
    return data;
  },

  async getUnreadNotificationsCount(): Promise<{ unread: number }> {
    const { data } = await api.get<{ unread: number }>('/dashboard/notifications/unread');
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
    const { data } = await api.get<PaginatedResponse<AuditRecord>>('/audit', { params });
    return data;
  },

  async getRecentAuditLogs(): Promise<AuditRecord[]> {
    const { data } = await api.get<AuditRecord[]>('/audit/recent');
    return data;
  },

  // --- Campaigns ---
  async listCampaigns(params?: { status?: string; search?: string }): Promise<Campaign[]> {
    const { data } = await api.get<Campaign[]>('/rewards/campaigns', { params });
    return data;
  },

  async createCampaign(dto: any): Promise<Campaign> {
    const { data } = await api.post<Campaign>('/rewards/campaigns', dto);
    return data;
  },

  async updateCampaign(campaignId: string, dto: any): Promise<Campaign> {
    const { data } = await api.patch<Campaign>(`/rewards/campaigns/${campaignId}`, dto);
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
    const { data } = await api.post('/rewards/rules', dto);
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
    const { data } = await api.get<PaginatedResponse<Reward>>('/dashboard/rewards', { params });
    return data;
  },

  async getRewardDetail(rewardIdOrSlug: string): Promise<Reward> {
    const { data } = await api.get<Reward>(`/dashboard/rewards/${rewardIdOrSlug}`);
    return data;
  },

  async getRewardRedemptions(rewardId: string, params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get(`/dashboard/rewards/${rewardId}/redemptions`, { params });
    return data;
  },

  // Catalog administration (creation/updates)
  async listCatalogAdmin(params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<Reward>> {
    const { data } = await api.get<PaginatedResponse<Reward>>('/rewards-catalog/admin/list', { params });
    return data;
  },

  async createReward(dto: any): Promise<Reward> {
    const { data } = await api.post<Reward>('/rewards-catalog', dto);
    return data;
  },

  async updateReward(rewardId: string, dto: any): Promise<Reward> {
    const { data } = await api.patch<Reward>(`/rewards-catalog/${rewardId}`, dto);
    return data;
  },

  async updateRewardStatus(rewardId: string, status: string): Promise<Reward> {
    const { data } = await api.patch<Reward>(`/rewards-catalog/${rewardId}/status/${status}`);
    return data;
  },

  async adjustRewardStock(rewardId: string, stock: number): Promise<Reward> {
    const { data } = await api.patch<Reward>(`/rewards-catalog/${rewardId}/stock/${stock}`);
    return data;
  },

  async deleteReward(rewardId: string) {
    const { data } = await api.delete(`/rewards-catalog/${rewardId}`);
    return data;
  },
};
