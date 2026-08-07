import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../lib/api/opsApi';
import { dashboardKeys } from '../lib/queryKeys';

// Extend dashboard keys
export const opsKeys = {
  all: ['ops'] as const,
  stats: () => ['ops', 'stats'] as const,
  profile: () => ['ops', 'profile'] as const,
  activity: (limit: number) => ['ops', 'activity', limit] as const,
  customers: (params: any) => ['ops', 'customers', params] as const,
  customerProfile: (id: string) => ['ops', 'customer', id] as const,
  customerActivity: (id: string, limit: number) => ['ops', 'customer', id, 'activity', limit] as const,
  wallets: (params: any) => ['ops', 'wallets', params] as const,
  walletSummary: (id: string) => ['ops', 'wallet', id] as const,
  walletTransactions: (id: string, params: any) => ['ops', 'wallet', id, 'transactions', params] as const,
  vouchers: (params: any) => ['ops', 'vouchers', params] as const,
  voucherHistory: (params: any) => ['ops', 'vouchers', 'history', params] as const,
  voucher: (id: string) => ['ops', 'voucher', id] as const,
  analyticsOverview: () => ['ops', 'analytics', 'overview'] as const,
  analyticsDaily: () => ['ops', 'analytics', 'daily'] as const,
  analyticsWeekly: () => ['ops', 'analytics', 'weekly'] as const,
  analyticsMonthly: () => ['ops', 'analytics', 'monthly'] as const,
  notifications: (params: any) => ['ops', 'notifications', params] as const,
  unreadNotifications: () => ['ops', 'notifications', 'unread'] as const,
  auditLogs: (params: any) => ['ops', 'audit-logs', params] as const,
  recentAuditLogs: () => ['ops', 'audit-logs', 'recent'] as const,
  campaigns: (params: any) => ['ops', 'campaigns', params] as const,
  campaignRules: (id: string) => ['ops', 'campaign', id, 'rules'] as const,
  rewards: (params: any) => ['ops', 'rewards', params] as const,
  reward: (id: string) => ['ops', 'reward', id] as const,
  rewardRedemptions: (id: string, params: any) => ['ops', 'reward', id, 'redemptions', params] as const,
  catalogAdmin: (params: any) => ['ops', 'catalog-admin', params] as const,
  storeHolidays: (id: string) => ['ops', 'store', id, 'holidays'] as const,
  storeManagers: (id: string) => ['ops', 'store', id, 'managers'] as const,
  storeFacilities: (id: string) => ['ops', 'store', id, 'facilities'] as const,
  storeGallery: (id: string) => ['ops', 'store', id, 'gallery'] as const,
  storeVouchers: (params: any) => ['ops', 'store-vouchers', params] as const,
  storeVoucher: (id: string) => ['ops', 'store-voucher', id] as const,
  storeVoucherHistory: (id: string, params: any) => ['ops', 'store-voucher', id, 'history', params] as const,
  storeVoucherAnalytics: () => ['ops', 'store-voucher-analytics'] as const,
};

// --- Store hooks ---
export function useStoreStats() {
  return useQuery({
    queryKey: opsKeys.stats(),
    queryFn: () => opsApi.getStoreStats(),
    staleTime: 1000 * 60, // 1 min
  });
}

export function useStoreProfile() {
  return useQuery({
    queryKey: opsKeys.profile(),
    queryFn: () => opsApi.getStoreProfile(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useStoreActivity(limit = 10) {
  return useQuery({
    queryKey: opsKeys.activity(limit),
    queryFn: () => opsApi.getStoreActivity(limit),
    staleTime: 1000 * 30, // 30s
  });
}

// --- Customer hooks ---
export function useSearchCustomers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'fullName' | 'lastLoginAt' | 'name' | (string & {});
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: opsKeys.customers(params),
    queryFn: () => opsApi.searchCustomers(params),
    staleTime: 1000 * 30,
  });
}

export function useCustomerProfile(customerId: string) {
  return useQuery({
    queryKey: opsKeys.customerProfile(customerId),
    queryFn: () => opsApi.getCustomerProfile(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60,
  });
}

export function useCustomerActivity(customerId: string, limit = 10) {
  return useQuery({
    queryKey: opsKeys.customerActivity(customerId, limit),
    queryFn: () => opsApi.getCustomerActivity(customerId, limit),
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

export function useCustomerRewards(customerId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['ops', 'customer', customerId, 'rewards', params],
    queryFn: () => opsApi.getCustomerRewards(customerId, params),
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

export function useCustomerGames(customerId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['ops', 'customer', customerId, 'games', params],
    queryFn: () => opsApi.getCustomerGames(customerId, params),
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

export function useCustomerNotifications(customerId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['ops', 'customer', customerId, 'notifications', params],
    queryFn: () => opsApi.getCustomerNotifications(customerId, params),
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

// --- Wallet hooks ---
export function useListWallets(params: any) {
  return useQuery({
    queryKey: opsKeys.wallets(params),
    queryFn: () => opsApi.listWallets(params),
    staleTime: 1000 * 30,
  });
}

export function useWalletTransactions(customerId: string, params: any) {
  return useQuery({
    queryKey: opsKeys.walletTransactions(customerId, params),
    queryFn: () => opsApi.getWalletTransactions(customerId, params),
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

// --- Voucher hooks ---
export function useListVouchers(params: any) {
  return useQuery({
    queryKey: opsKeys.vouchers(params),
    queryFn: () => opsApi.listVouchers(params),
    staleTime: 1000 * 30,
  });
}

export function useVoucherHistory(params: any) {
  return useQuery({
    queryKey: opsKeys.voucherHistory(params),
    queryFn: () => opsApi.getVoucherHistory(params),
    staleTime: 1000 * 30,
  });
}

export function useVoucherDetail(voucherId: string) {
  return useQuery({
    queryKey: opsKeys.voucher(voucherId),
    queryFn: () => opsApi.getVoucherDetail(voucherId),
    enabled: !!voucherId,
    staleTime: 1000 * 60,
  });
}

export function useRedeemVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, signature }: { code: string; signature: string }) =>
      opsApi.redeemVoucher(code, signature),
    onSuccess: () => {
      // Invalidate store stats & voucher lists
      queryClient.invalidateQueries({ queryKey: opsKeys.stats() });
      queryClient.invalidateQueries({ queryKey: ['ops', 'vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'activity'] });
    },
  });
}

// --- Analytics hooks ---
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: opsKeys.analyticsOverview(),
    queryFn: () => opsApi.getAnalyticsOverview(),
    staleTime: 1000 * 60,
  });
}

export function useAnalyticsDaily() {
  return useQuery({
    queryKey: opsKeys.analyticsDaily(),
    queryFn: () => opsApi.getAnalyticsDaily(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsWeekly() {
  return useQuery({
    queryKey: opsKeys.analyticsWeekly(),
    queryFn: () => opsApi.getAnalyticsWeekly(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsMonthly() {
  return useQuery({
    queryKey: opsKeys.analyticsMonthly(),
    queryFn: () => opsApi.getAnalyticsMonthly(),
    staleTime: 1000 * 60 * 5,
  });
}

// --- Notifications hooks ---
export function useListNotifications(params: any) {
  return useQuery({
    queryKey: opsKeys.notifications(params),
    queryFn: () => opsApi.listNotifications(params),
    staleTime: 1000 * 30,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: opsKeys.unreadNotifications(),
    queryFn: () => opsApi.getUnreadNotificationsCount(),
    staleTime: 1000 * 30,
  });
}

export function useNotificationHistory(params: any) {
  return useQuery({
    queryKey: ['ops', 'notifications', 'history', params],
    queryFn: () => opsApi.getNotificationHistory(params),
    staleTime: 1000 * 30,
  });
}

// --- Audit logs hooks ---
export function useQueryAuditLogs(params: any) {
  return useQuery({
    queryKey: opsKeys.auditLogs(params),
    queryFn: () => opsApi.queryAuditLogs(params),
    staleTime: 1000 * 30,
  });
}

export function useAuditAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['ops', 'audit-analytics', params],
    queryFn: () => opsApi.getAuditAnalytics(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAuditFraudIndicators(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['ops', 'audit-fraud', params],
    queryFn: () => opsApi.getAuditFraudIndicators(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['ops', 'audit-log', id],
    queryFn: () => opsApi.getAuditLog(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

// --- Campaigns hooks ---
export function useListCampaigns(params?: any) {
  return useQuery({
    queryKey: opsKeys.campaigns(params),
    queryFn: () => opsApi.listCampaigns(params),
    staleTime: 1000 * 60,
  });
}

export function useCampaignRules(campaignId: string) {
  return useQuery({
    queryKey: opsKeys.campaignRules(campaignId),
    queryFn: () => opsApi.getCampaignRules(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createCampaign(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateCampaign(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'campaign', data.id] });
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => opsApi.updateCampaignStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'campaign', data.id] });
    },
  });
}

// --- Rewards/Catalog hooks ---
export function useListRewards(params?: any) {
  return useQuery({
    queryKey: opsKeys.rewards(params),
    queryFn: () => opsApi.listRewards(params),
    staleTime: 1000 * 30,
  });
}

export function useRewardDetail(rewardId: string) {
  return useQuery({
    queryKey: opsKeys.reward(rewardId),
    queryFn: () => opsApi.getRewardDetail(rewardId),
    enabled: !!rewardId,
    staleTime: 1000 * 60,
  });
}

export function useRewardRedemptions(rewardId: string, params: any) {
  return useQuery({
    queryKey: opsKeys.rewardRedemptions(rewardId, params),
    queryFn: () => opsApi.getRewardRedemptions(rewardId, params),
    enabled: !!rewardId,
    staleTime: 1000 * 30,
  });
}

export function useListCatalogAdmin(params?: any) {
  return useQuery({
    queryKey: opsKeys.catalogAdmin(params),
    queryFn: () => opsApi.listCatalogAdmin(params),
    staleTime: 1000 * 30,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createReward(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'catalog-admin'] });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateReward(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'catalog-admin'] });
      queryClient.invalidateQueries({ queryKey: opsKeys.reward(data.id) });
    },
  });
}

export function useUpdateRewardStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => opsApi.updateRewardStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'catalog-admin'] });
      queryClient.invalidateQueries({ queryKey: opsKeys.reward(data.id) });
    },
  });
}

export function useAdjustRewardStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => opsApi.adjustRewardStock(id, stock),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'catalog-admin'] });
      queryClient.invalidateQueries({ queryKey: opsKeys.reward(data.id) });
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.deleteReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'catalog-admin'] });
    },
  });
}

// --- Store details sub-hooks ---
export function useStoreHolidays(storeId: string) {
  return useQuery({
    queryKey: opsKeys.storeHolidays(storeId),
    queryFn: () => opsApi.getStoreHolidays(storeId),
    enabled: !!storeId,
  });
}

export function useStoreManagers(storeId: string) {
  return useQuery({
    queryKey: opsKeys.storeManagers(storeId),
    queryFn: () => opsApi.getStoreManagers(storeId),
    enabled: !!storeId,
  });
}

export function useStoreFacilities(storeId: string) {
  return useQuery({
    queryKey: opsKeys.storeFacilities(storeId),
    queryFn: () => opsApi.getStoreFacilities(storeId),
    enabled: !!storeId,
  });
}

export function useStoreGallery(storeId: string) {
  return useQuery({
    queryKey: opsKeys.storeGallery(storeId),
    queryFn: () => opsApi.getStoreGallery(storeId),
    enabled: !!storeId,
  });
}

export function useAddStoreHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, dto }: { storeId: string; dto: { name: string; date: string; isClosed: boolean } }) =>
      opsApi.addStoreHoliday(storeId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.storeHolidays(variables.storeId) });
    },
  });
}

// --- Store Voucher hooks ---
export function useListStoreVouchers(params: any) {
  return useQuery({
    queryKey: opsKeys.storeVouchers(params),
    queryFn: () => opsApi.listStoreVouchers(params),
    staleTime: 1000 * 30,
  });
}

export function useStoreVoucher(id: string) {
  return useQuery({
    queryKey: opsKeys.storeVoucher(id),
    queryFn: () => opsApi.getStoreVoucher(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useStoreVoucherHistory(id: string, params?: any) {
  return useQuery({
    queryKey: opsKeys.storeVoucherHistory(id, params),
    queryFn: () => opsApi.getStoreVoucherHistory(id, params),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function useStoreVoucherAnalytics() {
  return useQuery({
    queryKey: opsKeys.storeVoucherAnalytics(),
    queryFn: () => opsApi.getStoreVoucherAnalytics(),
    staleTime: 1000 * 60,
  });
}

export function useCreateStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createStoreVoucher(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-voucher-analytics'] });
    },
  });
}

export function useUpdateStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateStoreVoucher(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: opsKeys.storeVoucher(variables.id) });
    },
  });
}

export function useArchiveStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.archiveStoreVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-voucher-analytics'] });
    },
  });
}

export function useRestoreStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.restoreStoreVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-voucher-analytics'] });
    },
  });
}

export function useActivateStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.activateStoreVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-voucher-analytics'] });
    },
  });
}

export function useDeactivateStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.deactivateStoreVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-voucher-analytics'] });
    },
  });
}

export function useDuplicateStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.duplicateStoreVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
    },
  });
}

export function useRedeemStoreVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponCode: string) => opsApi.redeemStoreVoucher(couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['ops', 'store-voucher-analytics'] });
      queryClient.invalidateQueries({ queryKey: opsKeys.stats() });
    },
  });
}
