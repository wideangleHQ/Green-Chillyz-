export const REWARD_ERRORS = {
  CAMPAIGN_NOT_FOUND: 'Reward campaign not found',
  CAMPAIGN_INACTIVE: 'This campaign is not currently active',
  CAMPAIGN_EXPIRED: 'This campaign has ended',
  CAMPAIGN_NOT_STARTED: 'This campaign has not started yet',
  CAMPAIGN_BUDGET_EXHAUSTED: 'Campaign budget has been exhausted',
  DAILY_LIMIT_REACHED: 'Daily reward limit reached for this event',
  MAX_CLAIMS_REACHED: 'Maximum claims reached for this campaign',
  DUPLICATE_CLAIM: 'Reward already claimed for this reference',
  USER_INELIGIBLE: 'User is not eligible for this reward',
  WALLET_INACTIVE: 'User wallet is inactive',
  STORE_INELIGIBLE: 'This store is not eligible for this campaign',
  BRAND_INELIGIBLE: 'This brand is not eligible for this campaign',
  MIN_PURCHASE_NOT_MET: 'Minimum purchase amount not met',
  RULE_NOT_FOUND: 'Reward rule not found',
  SLUG_EXISTS: 'A campaign with this slug already exists',
  INVALID_DATE_RANGE: 'End date must be after start date',
} as const;

export const REWARD_PERMISSIONS = {
  CAMPAIGN_CREATE: 'REWARD_CAMPAIGN_CREATE',
  CAMPAIGN_UPDATE: 'REWARD_CAMPAIGN_UPDATE',
  CAMPAIGN_DELETE: 'REWARD_CAMPAIGN_DELETE',
  CAMPAIGN_VIEW: 'REWARD_CAMPAIGN_VIEW',
  GRANT_REWARD: 'REWARD_GRANT',
  VIEW_HISTORY: 'REWARD_HISTORY_VIEW',
} as const;

export const REWARD_CACHE = {
  PREFIX: 'reward:',
  CAMPAIGN: 'reward:campaign:',
  ACTIVE_CAMPAIGNS: 'reward:active:',
  DAILY_COUNT: 'reward:daily:',
  RULES: 'reward:rules:',
  TTL_CAMPAIGN: 300,
  TTL_ACTIVE: 120,
  TTL_RULES: 300,
  TTL_DAILY: 86400,
} as const;

export const REWARD_DEFAULTS = {
  DEFAULT_MULTIPLIER: 1.0,
  DEFAULT_COIN_EXPIRY_DAYS: 90,
  MAX_DAILY_REWARDS: 50,
} as const;

export const RULE_TYPES = {
  DAILY_LIMIT: 'DAILY_LIMIT',
  MAX_CLAIMS: 'MAX_CLAIMS',
  MIN_PURCHASE: 'MIN_PURCHASE',
  STORE_ELIGIBLE: 'STORE_ELIGIBLE',
  BRAND_ELIGIBLE: 'BRAND_ELIGIBLE',
  FIRST_PURCHASE: 'FIRST_PURCHASE',
  BIRTHDAY_ONLY: 'BIRTHDAY_ONLY',
  WEEKEND_ONLY: 'WEEKEND_ONLY',
  TIME_WINDOW: 'TIME_WINDOW',
  USER_ACTIVE: 'USER_ACTIVE',
  WALLET_ACTIVE: 'WALLET_ACTIVE',
  LOYALTY_TIER: 'LOYALTY_TIER',
} as const;

export const RULE_OPERATORS = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN: 'LESS_THAN',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  BETWEEN: 'BETWEEN',
  BOOLEAN: 'BOOLEAN',
} as const;
