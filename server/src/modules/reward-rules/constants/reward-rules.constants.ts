export const REWARD_RULE_ERRORS = {
  NOT_FOUND: 'Reward rule not found',
  PROFILE_NOT_FOUND: 'Reward profile not found',
  DUPLICATE_COIN_MILESTONE: 'An active rule with this coin requirement already exists for this profile',
  DUPLICATE_DISPLAY_ORDER: 'A rule with this display order already exists for this profile',
  NEGATIVE_COINS: 'Coin requirement must be zero or positive',
  MISSING_REWARD: 'Reward type and reference are required',
  CANNOT_ARCHIVE_ACTIVE: 'Cannot archive an active rule without disabling it first',
  INVALID_DATE_RANGE: 'Valid-from date must be before expiry date',
} as const;

export const REWARD_RULE_PERMISSIONS = {
  CREATE: 'REWARD_RULE_CREATE',
  UPDATE: 'REWARD_RULE_UPDATE',
  DELETE: 'REWARD_RULE_DELETE',
} as const;

export const REWARD_RULE_CACHE = {
  PREFIX: 'reward-rules:',
  PROFILE_RULES: 'reward-rules:profile:',
  ITEM: 'reward-rule:',
  MILESTONES: 'reward-milestones',

  TTL_LIST: 300,
  TTL_ITEM: 300,
  TTL_MILESTONES: 600,
} as const;

export const REWARD_RULE_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const REWARD_RULE_EVENTS = {
  CREATED: 'reward-rule.created',
  UPDATED: 'reward-rule.updated',
  ARCHIVED: 'reward-rule.archived',
  DELETED: 'reward-rule.deleted',
  DUPLICATED: 'reward-rule.duplicated',
} as const;
