export const BOOTSTRAP_INITIALIZERS = Symbol('BOOTSTRAP_INITIALIZERS');

export const BOOTSTRAP_EVENTS = {
  USER_REGISTERED: 'user.registered',
  BOOTSTRAP_COMPLETED: 'customer.bootstrap.completed',
} as const;

export const BOOTSTRAP_INITIALIZER_NAMES = {
  WALLET: 'wallet',
  CUSTOMER_PROFILE: 'customer-profile',
} as const;

export const BOOTSTRAP_PRIORITY = {
  WALLET: 10,
  CUSTOMER_PROFILE: 20,
  LOYALTY: 30,
  NOTIFICATION_PREFERENCES: 40,
  REFERRAL: 50,
  GAME_PROFILE: 60,
  MARKETING_PREFERENCES: 70,
} as const;

export const BOOTSTRAP_DEFAULTS = {
  REFERRAL_CODE_LENGTH: 8,
  REFERRAL_CODE_MAX_ATTEMPTS: 5,
  REFERRAL_CODE_ALPHABET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
} as const;

export const BOOTSTRAP_ERRORS = {
  NO_DEFAULT_STORE: 'No active store available to assign customer profile',
  REFERRAL_CODE_GENERATION_FAILED: 'Unable to generate a unique referral code',
} as const;
