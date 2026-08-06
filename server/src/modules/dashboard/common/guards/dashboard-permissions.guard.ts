import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DashboardPrincipal } from '../../../dashboard-auth/interfaces';
import {
  DASHBOARD_OPS_ERRORS,
  DASHBOARD_PERMISSIONS_KEY,
} from '../constants';

/**
 * Permission seam for the future Permission Engine.
 *
 * Routes may declare `@DashboardPermissions('X')`; the guard checks the
 * permissions the Dashboard IAM resolvers hydrated onto the principal.
 * Undecorated routes pass — store scoping, not permissions, is today's
 * authorization model — so binding a real resolver later tightens routes
 * without touching this guard or any controller.
 */
@Injectable()
export class DashboardPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      DASHBOARD_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: DashboardPrincipal }>();
    const granted = request.user?.permissions ?? [];

    const missing = required.filter((p) => !granted.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `${DASHBOARD_OPS_ERRORS.PERMISSION_DENIED}: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
