export const REWARD_RESOLUTION_ERRORS = {
  CUSTOMER_NOT_FOUND: 'Customer not found',
  STORE_NOT_FOUND: 'Store not found or inactive',
  NO_ACTIVE_PROFILE: 'No active reward profile for store',
  NO_MATCHING_RULE: 'No matching reward rule found',
  INSUFFICIENT_COINS: 'Insufficient coin balance',
  EXPIRED_CAMPAIGN: 'Campaign has expired',
  ARCHIVED_PROFILE: 'Reward profile is archived',
  INACTIVE_VOUCHER: 'Voucher type is inactive',
  INVALID_COIN_RULE: 'Coin rule is invalid or disabled',
  DUPLICATE_REWARD: 'Reward already granted for this context',
  BROKEN_REWARD: 'Reward configuration is invalid',
  INVALID_REWARD_TYPE: 'Unknown or unsupported reward type',
} as const;

export const REWARD_RESOLUTION_CACHE = {
  PREFIX: 'reward-resolution',
  KEYS: {
    RESOLVE: 'resolve',
    PREVIEW: 'preview',
    CONTEXT: 'context',
    STORE_CONTEXT: 'store-context',
    CAMPAIGN_CONTEXT: 'campaign-context',
    PROFILE_CONTEXT: 'profile-context',
    CUSTOMER_SUMMARY: 'customer-summary',
  },
  TTL: {
    RESOLVE: 30,
    PREVIEW: 60,
    CONTEXT: 120,
    STORE_CONTEXT: 300,
    CAMPAIGN_CONTEXT: 120,
    PROFILE_CONTEXT: 300,
    CUSTOMER_SUMMARY: 60,
  },
} as const;

export const REWARD_RESOLUTION_EVENTS = {
  REWARD_RESOLVED: 'reward-resolution.reward.resolved',
  REWARD_UNLOCKED: 'reward-resolution.reward.unlocked',
  VOUCHER_UNLOCKED: 'reward-resolution.voucher.unlocked',
  CAMPAIGN_APPLIED: 'reward-resolution.campaign.applied',
  MILESTONE_REACHED: 'reward-resolution.milestone.reached',
  COINS_CALCULATED: 'reward-resolution.coins.calculated',
} as const;

export const RESOLUTION_SOURCE = {
  CAMPAIGN: 'CAMPAIGN',
  STORE_OVERRIDE: 'STORE_OVERRIDE',
  ASSIGNED_PROFILE: 'ASSIGNED_PROFILE',
  GLOBAL_DEFAULT: 'GLOBAL_DEFAULT',
  COIN_ECONOMY: 'COIN_ECONOMY',
  WALLET: 'WALLET',
} as const;

export const REWARD_RESOLUTION_AUDIT = {
  ENTITY_TYPE: 'REWARD_RESOLUTION',
  ACTIONS: {
    RESOLVED: 'REWARD_RESOLVED',
    CAMPAIGN_APPLIED: 'CAMPAIGN_APPLIED',
    OVERRIDE_USED: 'STORE_OVERRIDE_USED',
    PROFILE_USED: 'PROFILE_USED',
    COINS_CALCULATED: 'COINS_CALCULATED',
    VOUCHER_GENERATED: 'VOUCHER_GENERATED',
  },
} as const;
