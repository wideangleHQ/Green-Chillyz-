export const REWARDS_ERRORS = {
  REWARD_NOT_FOUND: 'Reward not found',
  REWARD_NOT_AVAILABLE: 'This reward is not currently available',
  REWARD_EXPIRED: 'This reward has expired',
  REWARD_NOT_STARTED: 'This reward is not yet available',
  OUT_OF_STOCK: 'This reward is out of stock',
  INSUFFICIENT_COINS: 'Insufficient coin balance for this reward',
  USER_INACTIVE: 'User account is inactive',
  WALLET_INACTIVE: 'Wallet is inactive',
  STORE_INELIGIBLE: 'This reward is not available at your store',
  BRAND_INELIGIBLE: 'This reward is not available for your brand',
  DAILY_LIMIT_REACHED: 'Daily redemption limit reached for this reward',
  USER_LIMIT_REACHED: 'You have reached the redemption limit for this reward',
  LOYALTY_TIER_TOO_LOW: 'Your loyalty tier does not qualify for this reward',
  DUPLICATE_REDEMPTION: 'A redemption for this request is already in progress',
  CATEGORY_NOT_FOUND: 'Reward category not found',
  CATEGORY_SLUG_EXISTS: 'A category with this slug already exists',
  SLUG_EXISTS: 'A reward with this slug already exists',
  VOUCHER_NOT_FOUND: 'Voucher not found',
  VOUCHER_NOT_ACTIVE: 'This voucher is no longer active',
  VOUCHER_EXPIRED: 'This voucher has expired',
  VOUCHER_ALREADY_USED: 'This voucher has already been used',
  VOUCHER_INVALID_SIGNATURE: 'Voucher verification failed',
  VOUCHER_NOT_OWNED: 'This voucher does not belong to you',
  VOUCHER_STORE_MISMATCH: 'This voucher cannot be redeemed at this store',
  INVALID_DATE_RANGE: 'Valid until must be after valid from',
} as const;

export const REWARDS_PERMISSIONS = {
  REWARD_CREATE: 'REWARD_CATALOG_CREATE',
  REWARD_UPDATE: 'REWARD_CATALOG_UPDATE',
  REWARD_DELETE: 'REWARD_CATALOG_DELETE',
  REWARD_VIEW_ADMIN: 'REWARD_CATALOG_VIEW_ADMIN',
  CATEGORY_MANAGE: 'REWARD_CATEGORY_MANAGE',
  VOUCHER_VERIFY: 'REWARD_VOUCHER_VERIFY',
  VOUCHER_REDEEM: 'REWARD_VOUCHER_REDEEM',
  ANALYTICS_VIEW: 'REWARD_ANALYTICS_VIEW',
} as const;

export const REWARDS_CACHE = {
  PREFIX: 'rewards:',
  CATALOG: 'rewards:catalog:',
  DETAIL: 'rewards:detail:',
  CATEGORIES: 'rewards:categories',
  FEATURED: 'rewards:featured',
  POPULAR: 'rewards:popular',
  DAILY_COUNT: 'rewards:daily:',
  TTL_CATALOG: 120,
  TTL_DETAIL: 300,
  TTL_CATEGORIES: 600,
  TTL_FEATURED: 300,
  TTL_POPULAR: 600,
} as const;

export const REWARDS_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  VOUCHER_CODE_LENGTH: 12,
  VOUCHER_CODE_ALPHABET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  VOUCHER_CODE_MAX_ATTEMPTS: 5,
  VOUCHER_VALID_DAYS: 30,
  FEATURED_LIMIT: 10,
  POPULAR_LIMIT: 10,
  RELATED_LIMIT: 6,
} as const;

export const REWARD_ANALYTICS_EVENTS = {
  VIEW: 'REWARD_VIEW',
  CLICK: 'REWARD_CLICK',
  REDEEM_ATTEMPT: 'REDEEM_ATTEMPT',
  REDEEM_SUCCESS: 'REDEEM_SUCCESS',
  REDEEM_FAILED: 'REDEEM_FAILED',
  VOUCHER_USED: 'VOUCHER_USED',
  VOUCHER_EXPIRED: 'VOUCHER_EXPIRED',
  FRAUD_ATTEMPT: 'FRAUD_ATTEMPT',
} as const;

export const REWARDS_SORT = {
  PRIORITY: 'priority',
  COIN_COST_ASC: 'coinCostAsc',
  COIN_COST_DESC: 'coinCostDesc',
  NEWEST: 'newest',
  POPULAR: 'popular',
} as const;
