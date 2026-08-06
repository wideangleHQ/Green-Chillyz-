import { registerAs } from '@nestjs/config';

/**
 * Dashboard IAM configuration.
 *
 * Deliberately isolated from `auth.*`: the dashboard is a different audience
 * with different secrets, cookies and lifetimes, so a compromised customer
 * token can never be replayed against a dashboard route (and vice versa).
 */
export const dashboardAuthConfig = registerAs('dashboardAuth', () => ({
  jwtSecret: process.env.DASHBOARD_JWT_SECRET,
  jwtRefreshSecret: process.env.DASHBOARD_JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.DASHBOARD_JWT_EXPIRES_IN || '15m',
  jwtIssuer: process.env.JWT_ISSUER || 'greenchillyz-api',
  jwtAudience: process.env.DASHBOARD_JWT_AUDIENCE || 'greenchillyz-dashboard',
  refreshTokenExpiryDays: parseInt(
    process.env.DASHBOARD_REFRESH_TOKEN_EXPIRY_DAYS || '7',
    10,
  ),

  /// Keys the blind index over store access codes. Rotating it invalidates
  /// every stored lookup value, so codes must be re-issued alongside it.
  codePepper: process.env.DASHBOARD_CODE_PEPPER,
  /// AES-256-GCM key for the recoverable copy of an access code. Optional:
  /// without it the platform still authenticates (hash + lookup are enough),
  /// but code recovery is unavailable. Accepts hex or base64; must be 32 bytes.
  codeEncryptionKey: process.env.DASHBOARD_CODE_ENCRYPTION_KEY,
  codePrefix: process.env.DASHBOARD_CODE_PREFIX || 'GC',
  codeSecretLength: parseInt(
    process.env.DASHBOARD_CODE_SECRET_LENGTH || '8',
    10,
  ),

  cookieDomain: process.env.COOKIE_DOMAIN,
  cookieSecure: process.env.NODE_ENV === 'production',
  accessTokenCookieName: 'gc_dashboard_access_token',
  refreshTokenCookieName: 'gc_dashboard_refresh_token',

  maxFailedAttempts: parseInt(
    process.env.DASHBOARD_MAX_FAILED_ATTEMPTS || '5',
    10,
  ),
  lockDurationMinutes: parseInt(
    process.env.DASHBOARD_LOCK_DURATION_MINUTES || '15',
    10,
  ),
  loginRateLimitWindowSeconds: parseInt(
    process.env.DASHBOARD_LOGIN_RATE_LIMIT_WINDOW_SECONDS || '60',
    10,
  ),
  loginRateLimitMaxAttempts: parseInt(
    process.env.DASHBOARD_LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '10',
    10,
  ),
}));
