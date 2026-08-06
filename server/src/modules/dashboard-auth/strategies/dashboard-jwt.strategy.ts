import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_COOKIES,
  DASHBOARD_JWT_STRATEGY,
  DASHBOARD_TOKEN_TYPE,
} from '../constants';
import { DashboardJwtPayload, DashboardPrincipal } from '../interfaces';
import { DashboardCacheService } from '../services/dashboard-cache.service';
import { DashboardSessionService } from '../services/dashboard-session.service';

/**
 * Validates `gc_dashboard_access_token`.
 *
 * Registered under its own strategy name with its own secret and audience, so
 * it lives beside the customer `jwt` strategy without either being able to
 * accept the other's tokens.
 *
 * The token is only the claim; the session is the authority. A signature that
 * verifies but whose session was revoked, expired, or predates a token-version
 * bump is rejected here — that is what makes logout immediate.
 */
@Injectable()
export class DashboardJwtStrategy extends PassportStrategy(
  Strategy,
  DASHBOARD_JWT_STRATEGY,
) {
  constructor(
    configService: ConfigService,
    private readonly sessionService: DashboardSessionService,
    private readonly cache: DashboardCacheService,
  ) {
    super({
      // Cookie only. No Authorization-header fallback: the dashboard is a
      // browser client, and a bearer path would reintroduce token-in-JS risk.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[DASHBOARD_COOKIES.ACCESS] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('dashboardAuth.jwtSecret'),
      issuer: configService.get<string>(
        'dashboardAuth.jwtIssuer',
        'greenchillyz-api',
      ),
      audience: configService.get<string>(
        'dashboardAuth.jwtAudience',
        'greenchillyz-dashboard',
      ),
    });
  }

  async validate(payload: DashboardJwtPayload): Promise<DashboardPrincipal> {
    if (payload.typ !== DASHBOARD_TOKEN_TYPE) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
    }

    const session = await this.sessionService.assertActiveSession(payload.sid);

    if (session.storeId !== payload.sub) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
    }

    const currentTokenVersion = await this.cache.getTokenVersion(payload.sub);
    if (payload.tokenVersion < currentTokenVersion) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
    }

    return {
      storeId: payload.sub,
      sessionId: payload.sid,
      slug: payload.slug,
      scope: payload.scope,
      role: payload.role,
      permissionsProfile: payload.permissionsProfile,
      permissions: [],
    };
  }
}
