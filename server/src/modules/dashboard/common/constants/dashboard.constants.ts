/** Metadata key read by DashboardPermissionsGuard. */
export const DASHBOARD_PERMISSIONS_KEY = 'dashboardPermissions';

export const DASHBOARD_OPS_ERRORS = {
  CUSTOMER_NOT_FOUND: 'Customer not found for this store',
  WALLET_NOT_FOUND: 'Wallet not found for this customer',
  VOUCHER_NOT_FOUND: 'Voucher not found for this store',
  REWARD_NOT_FOUND: 'Reward not found',
  STORE_NOT_FOUND: 'Store not found',
  PERMISSION_DENIED: 'Missing dashboard permission',
} as const;

/**
 * Cache keys are always store-scoped so one store's operational data can be
 * invalidated without touching another's.
 */
export const DASHBOARD_OPS_CACHE = {
  PREFIX: 'dashboard:ops',
  TTL: {
    /** Live counters — short so operational data is never meaningfully stale. */
    OVERVIEW_SECONDS: 60,
    UNREAD_SECONDS: 30,
    STORE_STATS_SECONDS: 120,
    CUSTOMER_SCOPE_SECONDS: 300,
    /** Historical series only ever gain the current bucket. */
    SERIES_SECONDS: 300,
  },
} as const;

export const DASHBOARD_ACTIVITY_DEFAULT_LIMIT = 20;
export const DASHBOARD_ACTIVITY_MAX_LIMIT = 50;

export const DASHBOARD_ANALYTICS_RANGES = {
  DAILY_DAYS: 7,
  WEEKLY_WEEKS: 8,
  MONTHLY_MONTHS: 6,
} as const;
