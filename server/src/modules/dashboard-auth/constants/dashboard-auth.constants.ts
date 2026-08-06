export const DASHBOARD_RECOVERY_ERRORS = {
  UNAVAILABLE:
    'Access code recovery is not configured. Set DASHBOARD_CODE_ENCRYPTION_KEY.',
  NOT_RECOVERABLE:
    'This store has no recoverable access code. Rotate to issue a new one.',
  STORE_NOT_FOUND: 'Store not found',
} as const;

export const DASHBOARD_AUTH_ERRORS = {
  INVALID_ACCESS_CODE: 'Invalid store access code',
  DASHBOARD_DISABLED: 'Dashboard access is disabled for this store',
  STORE_INACTIVE: 'Store is not active',
  ACCOUNT_LOCKED:
    'Too many failed attempts. Dashboard access is temporarily locked.',
  RATE_LIMITED: 'Too many login attempts. Please try again later.',
  INVALID_TOKEN: 'Invalid or expired dashboard token',
  INVALID_REFRESH_TOKEN: 'Invalid or expired dashboard refresh token',
  REFRESH_TOKEN_MISSING: 'No dashboard refresh token provided',
  TOKEN_REUSE_DETECTED:
    'Dashboard token reuse detected. All sessions have been revoked for security.',
  SESSION_EXPIRED: 'Dashboard session has expired',
  SESSION_NOT_FOUND: 'Dashboard session not found',
  SESSION_REVOKED: 'Dashboard session has been revoked',
} as const;

/**
 * Cookie names are fixed rather than configurable: they are part of the
 * contract with the dashboard frontend, and must never collide with the
 * customer cookies (`gc_access_token` / `gc_refresh_token`).
 */
export const DASHBOARD_COOKIES = {
  ACCESS: 'gc_dashboard_access_token',
  REFRESH: 'gc_dashboard_refresh_token',
  ACCESS_PATH: '/',
  REFRESH_PATH: '/api/v1/dashboard/auth/refresh',
} as const;

export const DASHBOARD_REDIS_PREFIXES = {
  SESSION: 'dashboard:session:',
  STORE_SESSIONS: 'dashboard:store_sessions:',
  STORE_CONTEXT: 'dashboard:store_context:',
  LOGIN_ATTEMPTS: 'dashboard:login_attempts:',
  TOKEN_VERSION: 'dashboard:token_version:',
} as const;

export const DASHBOARD_CACHE_TTL = {
  /** Mirrors the refresh-token lifetime; the durable row remains authoritative. */
  SESSION_SECONDS: 7 * 24 * 60 * 60,
  STORE_CONTEXT_SECONDS: 300,
} as const;

/**
 * Refresh tokens are opaque 64-byte random values stored as SHA-256 digests.
 * The digest — not the token — is what an attacker would find in the database,
 * and a 512-bit random secret needs no slow hash.
 */
export const DASHBOARD_REFRESH_TOKEN_BYTES = 64;

export const DASHBOARD_TOKEN_TYPE = 'dashboard' as const;

/**
 * Argon2id parameters. Deliberately modest — a store access code carries far
 * more entropy than a human password, so the hash exists to slow down an
 * attacker who already has the database, not to compensate for weak secrets.
 */
export const DASHBOARD_ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB — OWASP minimum for Argon2id
  timeCost: 2,
  parallelism: 1,
} as const;

/** Alphabet without the 0/O and 1/I/L look-alikes; codes get read aloud. */
export const DASHBOARD_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const DASHBOARD_CODE_SEGMENT_SEPARATOR = '-';

/** `GC-PAT-X93KL8Q2`: brand prefix, store code, cryptographic secret. */
export const DASHBOARD_CODE_SEGMENTS = 3;

export const DASHBOARD_SESSION_REVOKE_REASONS = {
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  MANUAL_REVOKE: 'MANUAL_REVOKE',
  TOKEN_REUSE: 'TOKEN_REUSE',
  CODE_ROTATED: 'CODE_ROTATED',
  EXPIRED: 'EXPIRED',
} as const;

export type DashboardSessionRevokeReason =
  (typeof DASHBOARD_SESSION_REVOKE_REASONS)[keyof typeof DASHBOARD_SESSION_REVOKE_REASONS];

/**
 * Metadata keys for the dashboard guards. Named apart from the customer keys
 * so a `@Public()` on a customer route can never open a dashboard route.
 */
export const IS_DASHBOARD_PUBLIC_KEY = 'isDashboardPublic';

export const DASHBOARD_JWT_STRATEGY = 'dashboard-jwt';

/**
 * Injection tokens for the permission foundation. Only the default resolvers
 * are bound today; the Permission Engine module will override these providers
 * without touching a single dashboard-auth file.
 */
export const DASHBOARD_PERMISSION_RESOLVER = Symbol(
  'DASHBOARD_PERMISSION_RESOLVER',
);
export const DASHBOARD_ROLE_RESOLVER = Symbol('DASHBOARD_ROLE_RESOLVER');
export const DASHBOARD_STORE_SCOPE_RESOLVER = Symbol(
  'DASHBOARD_STORE_SCOPE_RESOLVER',
);

/**
 * The single profile every store dashboard gets until the Permission Engine
 * lands. Kept as data so the future module replaces a resolver, not a caller.
 */
export const DASHBOARD_DEFAULT_PERMISSIONS_PROFILE = 'STORE_DASHBOARD';

export const DASHBOARD_DEFAULT_ROLE = 'STORE_DASHBOARD';

export const DASHBOARD_EVENTS = {
  LOGIN_SUCCESS: 'dashboard.login.success',
  LOGIN_FAILED: 'dashboard.login.failed',
  LOGOUT: 'dashboard.logout',
  SESSION_CREATED: 'dashboard.session.created',
  SESSION_REVOKED: 'dashboard.session.revoked',
  CODE_ROTATED: 'dashboard.code.rotated',
  CODE_INITIALIZED: 'dashboard.code.initialized',
} as const;

/**
 * AES-256-GCM parameters for the recoverable copy of an access code.
 * 96-bit IV and 128-bit tag are the sizes GCM is specified around.
 */
export const DASHBOARD_CIPHER = {
  ALGORITHM: 'aes-256-gcm',
  KEY_BYTES: 32,
  IV_BYTES: 12,
  TAG_BYTES: 16,
  SEPARATOR: ':',
} as const;

/** Bootstrap reads stores in pages so a large estate never loads at once. */
export const DASHBOARD_BOOTSTRAP = {
  BATCH_SIZE: 50,
} as const;
