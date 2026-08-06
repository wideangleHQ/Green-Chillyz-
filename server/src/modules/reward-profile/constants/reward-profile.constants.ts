export const REWARD_PROFILE_ERRORS = {
  NOT_FOUND: 'Reward profile not found',
  SLUG_EXISTS: 'A reward profile with this slug already exists',
  DUPLICATE_DEFAULT: 'Only one default profile is allowed',
  CANNOT_ARCHIVE_DEFAULT: 'Cannot archive the default profile',
  CANNOT_DISABLE_DEFAULT: 'Cannot disable the default profile',
  EMPTY_NAME: 'Profile name cannot be empty',
  INVALID_STATUS: 'Invalid profile status',
  INVALID_TYPE: 'Invalid profile type',
  ALREADY_ARCHIVED: 'Profile is already archived',
  NOT_ARCHIVED: 'Profile is not archived; restore is only valid for archived profiles',
} as const;

export const REWARD_PROFILE_PERMISSIONS = {
  CREATE: 'REWARD_PROFILE_CREATE',
  UPDATE: 'REWARD_PROFILE_UPDATE',
  DELETE: 'REWARD_PROFILE_DELETE',
  VIEW_ADMIN: 'REWARD_PROFILE_VIEW_ADMIN',
} as const;

export const REWARD_PROFILE_CACHE = {
  PREFIX: 'reward-profile:',
  LIST: 'reward-profile:list',
  DEFAULT: 'reward-profile:default',
  ITEM: 'reward-profile:item:',

  TTL_LIST: 300,
  TTL_DEFAULT: 600,
  TTL_ITEM: 300,
} as const;

export const REWARD_PROFILE_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const REWARD_PROFILE_EVENTS = {
  CREATED: 'reward-profile.created',
  UPDATED: 'reward-profile.updated',
  ARCHIVED: 'reward-profile.archived',
  RESTORED: 'reward-profile.restored',
  DUPLICATED: 'reward-profile.duplicated',
  ACTIVATED: 'reward-profile.activated',
  DEFAULT_CHANGED: 'reward-profile.default-changed',
} as const;
