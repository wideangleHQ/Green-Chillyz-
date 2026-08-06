export const REWARD_OVERRIDE_ERRORS = {
  NOT_FOUND: 'Reward override not found',
  STORE_NOT_FOUND: 'Store not found',
  RULE_NOT_FOUND: 'Reward rule not found',
  DUPLICATE_OVERRIDE: 'An active override already exists for this rule in this store',
  RULE_ARCHIVED: 'Cannot override an archived reward rule',
  RULE_INACTIVE: 'Cannot override an inactive reward rule',
  OVERRIDE_EXPIRED: 'Override has expired',
  INVALID_DATE_RANGE: 'Effective-from must be before effective-until',
  INVALID_REWARD_REFERENCE: 'Invalid reward reference',
  DUPLICATE_COIN_MILESTONE: 'A coin milestone override with this value already exists for this store',
  NO_ASSIGNMENT: 'Store has no active reward profile assignment',
} as const;

export const REWARD_OVERRIDE_PERMISSIONS = {
  CREATE: 'REWARD_OVERRIDE_CREATE',
  UPDATE: 'REWARD_OVERRIDE_UPDATE',
  DELETE: 'REWARD_OVERRIDE_DELETE',
} as const;

export const REWARD_OVERRIDE_CACHE = {
  PREFIX: 'reward-override:',
  STORE: 'reward-override:store:',
  ITEM: 'reward-override:item:',
  PREVIEW: 'reward-preview:',

  TTL_STORE: 600,
  TTL_ITEM: 300,
  TTL_PREVIEW: 300,
} as const;

export const REWARD_OVERRIDE_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const REWARD_OVERRIDE_EVENTS = {
  CREATED: 'reward-override.created',
  UPDATED: 'reward-override.updated',
  ARCHIVED: 'reward-override.archived',
  DELETED: 'reward-override.deleted',
  RESTORED: 'reward-override.restored',
} as const;
