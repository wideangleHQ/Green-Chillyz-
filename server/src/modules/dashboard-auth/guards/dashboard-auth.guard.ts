import {
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { isObservable, lastValueFrom } from 'rxjs';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_PERMISSION_RESOLVER,
  IS_DASHBOARD_PUBLIC_KEY,
} from '../constants';
import {
  DashboardPermissionResolver,
  DashboardPrincipal,
} from '../interfaces';
import { DashboardStoreRepository } from '../repositories';
import { DashboardSessionService } from '../services/dashboard-session.service';
import { DashboardJwtGuard } from './dashboard-jwt.guard';

/**
 * The guard every dashboard route should use.
 *
 * `DashboardJwtGuard` proves the token and session are valid. This adds the
 * two things a long-lived session cannot carry in its token:
 *
 *  1. current store access state — disabling a store's dashboard or
 *     deactivating the store takes effect on the next request, not whenever
 *     the access token happens to expire;
 *  2. resolved permissions — hydrated through the resolver seam, so the
 *     Permission Engine module starts populating `principal.permissions`
 *     without a change here or in any consumer.
 */
@Injectable()
export class DashboardAuthGuard extends DashboardJwtGuard {
  constructor(
    reflector: Reflector,
    private readonly storeRepository: DashboardStoreRepository,
    private readonly sessionService: DashboardSessionService,
    @Inject(DASHBOARD_PERMISSION_RESOLVER)
    private readonly permissionResolver: DashboardPermissionResolver,
  ) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_DASHBOARD_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const base = super.canActivate(context);
    const authenticated = isObservable(base) ? await lastValueFrom(base) : await base;

    if (!authenticated) {
      return false;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: DashboardPrincipal }>();
    const principal = request.user;

    if (!principal) {
      return false;
    }

    const accessState = await this.storeRepository.findAccessStateById(
      principal.storeId,
    );

    if (!accessState || !accessState.isActive || accessState.deletedAt) {
      throw new ForbiddenException(DASHBOARD_AUTH_ERRORS.STORE_INACTIVE);
    }

    if (!accessState.dashboardAccessEnabled) {
      throw new ForbiddenException(DASHBOARD_AUTH_ERRORS.DASHBOARD_DISABLED);
    }

    principal.permissions = await this.permissionResolver.resolvePermissions({
      storeId: principal.storeId,
      brandId: principal.scope.brandId,
      slug: principal.slug,
    });

    // Activity tracking is observational; it must not delay or fail the request.
    void this.sessionService.touch(principal.sessionId);

    return true;
  }
}
