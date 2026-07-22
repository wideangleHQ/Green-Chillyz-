export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  TOKEN_REUSE_DETECTED: 'Token reuse detected. All sessions have been revoked for security.',
  USER_DEACTIVATED: 'Account has been deactivated',
  SESSION_EXPIRED: 'Session has expired',
  DEVICE_NOT_FOUND: 'Device not found',
  OTP_EXPIRED: 'OTP has expired',
  OTP_INVALID: 'Invalid OTP',
  OTP_MAX_ATTEMPTS: 'Maximum OTP attempts exceeded',
  OTP_RATE_LIMITED: 'Too many OTP requests. Please try again later.',
  SUPABASE_AUTH_FAILED: 'Authentication with Google failed',
} as const;

export const REDIS_PREFIXES = {
  SESSION: 'session:',
  TOKEN_VERSION: 'token_version:',
  PERMISSIONS_VERSION: 'permissions_version:',
  OTP_RATE_LIMIT: 'otp_rate_limit:',
  USER_SESSIONS: 'user_sessions:',
} as const;

export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW_SECONDS: 60,
  MAX_REQUESTS_PER_WINDOW: 3,
} as const;

export const REFRESH_TOKEN_BYTES = 64;
