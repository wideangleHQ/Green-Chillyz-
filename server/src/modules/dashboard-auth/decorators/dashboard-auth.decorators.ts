import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { IS_DASHBOARD_PUBLIC_KEY } from '../constants';
import {
  DashboardPrincipal,
  DashboardRequestContext as RequestContext,
} from '../interfaces';

/**
 * Opens a dashboard route to unauthenticated callers (login, refresh).
 *
 * Deliberately distinct from the customer `@Public()`: the two live on
 * different metadata keys so neither guard can be relaxed by the other's flag.
 */
export const DashboardPublic = () =>
  SetMetadata(IS_DASHBOARD_PUBLIC_KEY, true);

/**
 * Injects the authenticated store — the dashboard's principal.
 *
 * `@DashboardCurrentStore()` yields the whole principal;
 * `@DashboardCurrentStore('storeId')` yields one field, which is what a
 * store-scoped query usually wants.
 */
export const DashboardCurrentStore = createParamDecorator(
  (data: keyof DashboardPrincipal | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: DashboardPrincipal }>();
    const principal = request.user;
    return data ? principal?.[data] : principal;
  },
);

/** Injects the current session id, for session-scoped operations. */
export const DashboardSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: DashboardPrincipal }>();
    return request.user?.sessionId;
  },
);

/**
 * Injects the caller's network identity: IP, user agent and the optional
 * device fingerprint header.
 *
 * Every login, logout and revocation records this, so extracting it here keeps
 * the parsing (`x-forwarded-for` behind Railway's proxy) in one place instead
 * of a private helper on each controller.
 */
export const DashboardRequestMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const forwarded = request.headers['x-forwarded-for'];

    const ipAddress =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : (request.ip ?? '0.0.0.0');

    const fingerprint = request.headers['x-device-fingerprint'];

    return {
      ipAddress,
      userAgent: request.headers['user-agent'] ?? null,
      deviceFingerprint: typeof fingerprint === 'string' ? fingerprint : null,
    };
  },
);

/**
 * Injects the raw refresh token that `DashboardRefreshGuard` accepted, so the
 * controller never touches `req.cookies` itself.
 */
export const DashboardRefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { dashboardRefreshToken?: string }>();
    return request.dashboardRefreshToken;
  },
);
