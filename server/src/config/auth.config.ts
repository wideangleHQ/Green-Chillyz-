import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtIssuer: process.env.JWT_ISSUER || 'greenchillyz-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'greenchillyz-client',
  refreshTokenExpiryDays: parseInt(
    process.env.REFRESH_TOKEN_EXPIRY_DAYS || '30',
    10,
  ),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieSameSiteAccess: 'lax' as const,
  cookieSameSiteRefresh: 'strict' as const,
  accessTokenCookieName: 'gc_access_token',
  refreshTokenCookieName: 'gc_refresh_token',
}));
