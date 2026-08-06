import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  DASHBOARD_JWT_STRATEGY,
  IS_DASHBOARD_PUBLIC_KEY,
} from '../constants';

/**
 * Authenticates a dashboard request from its access-token cookie.
 *
 * Honours `@DashboardPublic()` — and only that. The customer `@Public()` flag
 * is a different metadata key on purpose, so it can never accidentally open a
 * dashboard route.
 */
@Injectable()
export class DashboardJwtGuard extends AuthGuard(DASHBOARD_JWT_STRATEGY) {
  constructor(protected readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_DASHBOARD_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
