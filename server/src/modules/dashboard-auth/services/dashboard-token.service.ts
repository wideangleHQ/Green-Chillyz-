import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, hashSha256 } from '../../../common/helpers/hash.helper';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_COOKIES,
  DASHBOARD_REFRESH_TOKEN_BYTES,
  DASHBOARD_TOKEN_TYPE,
} from '../constants';
import {
  DashboardJwtPayload,
  DashboardStoreScope,
  DashboardTokens,
} from '../interfaces';

export interface DashboardAccessTokenClaims {
  storeId: string;
  sessionId: string;
  slug: string;
  scope: DashboardStoreScope;
  role: string;
  permissionsProfile: string;
  tokenVersion: number;
}

export interface IssuedRefreshToken {
  rawToken: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

/**
 * Mints and clears dashboard credentials.
 *
 * Structurally parallel to the customer TokenService, with one hard rule: a
 * different secret, a different audience and a different cookie name at every
 * point. Nothing signed here can satisfy the customer strategy, and nothing
 * signed there can satisfy the dashboard strategy.
 */
@Injectable()
export class DashboardTokenService {
  private readonly logger = new Logger(DashboardTokenService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtIssuer: string;
  private readonly jwtAudience: string;
  private readonly refreshTokenExpiryDays: number;
  private readonly cookieDomain?: string;
  private readonly cookieSecure: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>(
      'dashboardAuth.jwtSecret',
    );
    this.jwtExpiresIn = this.configService.get<string>(
      'dashboardAuth.jwtExpiresIn',
      '15m',
    );
    this.jwtIssuer = this.configService.get<string>(
      'dashboardAuth.jwtIssuer',
      'greenchillyz-api',
    );
    this.jwtAudience = this.configService.get<string>(
      'dashboardAuth.jwtAudience',
      'greenchillyz-dashboard',
    );
    this.refreshTokenExpiryDays = this.configService.get<number>(
      'dashboardAuth.refreshTokenExpiryDays',
      7,
    );
    this.cookieDomain = this.configService.get<string>(
      'dashboardAuth.cookieDomain',
    );
    this.cookieSecure = this.configService.get<boolean>(
      'dashboardAuth.cookieSecure',
      false,
    );
  }

  signAccessToken(claims: DashboardAccessTokenClaims): string {
    const payload: Omit<DashboardJwtPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: claims.storeId,
      sid: claims.sessionId,
      typ: DASHBOARD_TOKEN_TYPE,
      slug: claims.slug,
      scope: claims.scope,
      role: claims.role,
      permissionsProfile: claims.permissionsProfile,
      tokenVersion: claims.tokenVersion,
    };

    return this.jwtService.sign(payload as Record<string, unknown>, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as never,
      issuer: this.jwtIssuer,
      audience: this.jwtAudience,
    });
  }

  /**
   * Refresh tokens are opaque random bytes, not JWTs: they must be revocable
   * the instant a session ends, which a self-contained token can never be.
   * Only the SHA-256 digest is persisted.
   */
  issueRefreshToken(familyId?: string): IssuedRefreshToken {
    const rawToken = generateToken(DASHBOARD_REFRESH_TOKEN_BYTES);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    return {
      rawToken,
      tokenHash: hashSha256(rawToken),
      familyId: familyId ?? uuidv4(),
      expiresAt,
    };
  }

  hashRefreshToken(rawToken: string): string {
    return hashSha256(rawToken);
  }

  verifyAccessToken(token: string): DashboardJwtPayload {
    try {
      const payload = this.jwtService.verify<DashboardJwtPayload>(token, {
        secret: this.jwtSecret,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      });

      if (payload.typ !== DASHBOARD_TOKEN_TYPE) {
        throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.debug(`Dashboard access token rejected: ${message}`);
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
    }
  }

  refreshTokenExpiryMs(): number {
    return this.refreshTokenExpiryDays * 24 * 60 * 60 * 1000;
  }

  /**
   * Both cookies are HttpOnly so no dashboard script can read them, and Secure
   * in production. SameSite carries the CSRF defence, exactly as the customer
   * cookies do: dashboard.greenchillyz.com and api.greenchillyz.com share a
   * registrable domain, so `strict` still permits the dashboard's own calls
   * while blocking cross-site ones. The refresh cookie is additionally
   * path-scoped, so it is never attached to an ordinary API request.
   */
  setAuthCookies(res: Response, tokens: DashboardTokens): void {
    res.cookie(DASHBOARD_COOKIES.ACCESS, tokens.accessToken, {
      ...this.cookieDomainOption(),
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: DASHBOARD_COOKIES.ACCESS_PATH,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(DASHBOARD_COOKIES.REFRESH, tokens.refreshToken, {
      ...this.cookieDomainOption(),
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      path: DASHBOARD_COOKIES.REFRESH_PATH,
      maxAge: this.refreshTokenExpiryMs(),
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(DASHBOARD_COOKIES.ACCESS, {
      ...this.cookieDomainOption(),
      path: DASHBOARD_COOKIES.ACCESS_PATH,
    });
    res.clearCookie(DASHBOARD_COOKIES.REFRESH, {
      ...this.cookieDomainOption(),
      path: DASHBOARD_COOKIES.REFRESH_PATH,
    });
  }

  private cookieDomainOption(): Pick<CookieOptions, 'domain'> {
    return this.cookieDomain ? { domain: this.cookieDomain } : {};
  }
}
