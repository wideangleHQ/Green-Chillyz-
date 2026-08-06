export const REWARD_ASSIGNMENT_ERRORS = {
  NOT_FOUND: 'Reward assignment not found',
  STORE_NOT_FOUND: 'Store not found',
  PROFILE_NOT_FOUND: 'Reward profile not found',
  DUPLICATE_ACTIVE: 'Store already has an active reward profile assignment',
  PROFILE_ARCHIVED: 'Cannot assign an archived reward profile',
  ASSIGNMENT_EXPIRED: 'Assignment has expired',
  INVALID_DATE_RANGE: 'Effective-from must be before effective-until',
} as const;

export const REWARD_ASSIGNMENT_PERMISSIONS = {
  CREATE: 'REWARD_ASSIGNMENT_CREATE',
  UPDATE: 'REWARD_ASSIGNMENT_UPDATE',
  DELETE: 'REWARD_ASSIGNMENT_DELETE',
} as const;

export const REWARD_ASSIGNMENT_CACHE = {
  PREFIX: 'reward-assignment:',
  STORE: 'reward-assignment:store:',
  PROFILE_STORE: 'reward-profile-store:',
  ITEM: 'reward-assignment:item:',

  TTL_STORE: 600,
  TTL_ITEM: 300,
} as const;

export const REWARD_ASSIGNMENT_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const REWARD_ASSIGNMENT_EVENTS = {
  ASSIGNED: 'reward-assignment.assigned',
  CHANGED: 'reward-assignment.changed',
  ARCHIVED: 'reward-assignment.archived',
  RESTORED: 'reward-assignment.restored',
  EXPIRED: 'reward-assignment.expired',
} as const;
