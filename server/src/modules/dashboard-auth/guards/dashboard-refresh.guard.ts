import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DASHBOARD_AUTH_ERRORS, DASHBOARD_COOKIES } from '../constants';

/**
 * Gate for the refresh endpoint.
 *
 * The refresh cookie is opaque and revocable, so it cannot be validated by
 * signature the way an access token can. This guard only proves one was
 * presented and hands it to the service, which does the real validation
 * against the database. Keeping the check here means the controller never
 * reads a cookie itself.
 */
@Injectable()
export class DashboardRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const rawToken = request.cookies?.[DASHBOARD_COOKIES.REFRESH];

    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.REFRESH_TOKEN_MISSING,
      );
    }

    (request as Request & { dashboardRefreshToken?: string })
      .dashboardRefreshToken = rawToken;

    return true;
  }
}
