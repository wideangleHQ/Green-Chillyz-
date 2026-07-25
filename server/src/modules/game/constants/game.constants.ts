export const GAME_PERMISSIONS = {
  GAME_CREATE: 'GAME_CREATE',
  GAME_UPDATE: 'GAME_UPDATE',
  GAME_DELETE: 'GAME_DELETE',
  GAME_VIEW: 'GAME_VIEW',
  GAME_PLAY: 'GAME_PLAY',
  GAME_ANALYTICS: 'GAME_ANALYTICS',
} as const;

export const GAME_ERRORS = {
  GAME_NOT_FOUND: 'Game not found',
  GAME_INACTIVE: 'This game is currently inactive',
  INSUFFICIENT_LEVEL: 'Your customer tier or level is insufficient to play this game',
  STORE_INELIGIBLE: 'This game is not available at your assigned store',
  CAMPAIGN_INELIGIBLE: 'This game requires an active campaign that is not available to you',
  COOLDOWN_ACTIVE: 'Please wait for the cooldown to expire before playing again',
  DAILY_LIMIT_EXCEEDED: 'You have reached the daily limit for this game',
  DUPLICATE_SESSION: 'An active session for this game already exists',
  CONCURRENT_SESSION: 'Please complete your other active game sessions before starting a new one',
  SESSION_NOT_FOUND: 'Game session not found',
  SESSION_NOT_ACTIVE: 'Game session is not in a playable state',
  SESSION_EXPIRED: 'Game session has expired',
  FRAUD_DETECTED: 'Anti-fraud system flagged this request',
  INVALID_SCORE: 'Game score is invalid or exceeds bounds',
  INVALID_REWARD: 'Selected reward configuration is invalid',
  WALLET_INACTIVE: 'Your wallet is inactive',
} as const;

export const GAME_CACHE = {
  PREFIX: 'game:',
  CONFIG: 'game:config:',
  COOLDOWN: 'game:cooldown:',
  DAILY_COUNT: 'game:daily:',
  STATS: 'game:stats:',
  TTL_CONFIG: 300, // 5 minutes
  TTL_COOLDOWN: 86400, // 24 hours
  TTL_DAILY: 86400, // 24 hours
} as const;
