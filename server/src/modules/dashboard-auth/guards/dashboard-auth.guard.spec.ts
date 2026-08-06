import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_DASHBOARD_PUBLIC_KEY } from '../constants';
import { DashboardStoreRepository } from '../repositories';
import { DashboardSessionService } from '../services/dashboard-session.service';
import { DashboardPermissionResolver, DashboardPrincipal } from '../interfaces';
import { DASHBOARD_AUTH_ERRORS } from '../constants';
import { DashboardAuthGuard } from './dashboard-auth.guard';
import { DashboardJwtGuard } from './dashboard-jwt.guard';
import { DashboardRefreshGuard } from './dashboard-refresh.guard';

function principal(
  overrides: Partial<DashboardPrincipal> = {},
): DashboardPrincipal {
  return {
    storeId: 'store-1',
    sessionId: 'session-1',
    slug: 'greenchillyz-patia',
    scope: { storeId: 'store-1', brandId: 'brand-1', scopeType: 'STORE' },
    role: 'STORE_DASHBOARD',
    permissionsProfile: 'STORE_DASHBOARD',
    permissions: [],
    ...overrides,
  };
}

function buildContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('DashboardAuthGuard', () => {
  let guard: DashboardAuthGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let storeRepository: { findAccessStateById: ReturnType<typeof vi.fn> };
  let sessionService: { touch: ReturnType<typeof vi.fn> };
  let permissionResolver: DashboardPermissionResolver & {
    resolvePermissions: ReturnType<typeof vi.fn>;
  };
  let superCanActivate: MockInstance<DashboardJwtGuard['canActivate']>;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    storeRepository = {
      findAccessStateById: vi.fn().mockResolvedValue({
        id: 'store-1',
        isActive: true,
        deletedAt: null,
        dashboardAccessEnabled: true,
      }),
    };
    sessionService = { touch: vi.fn().mockResolvedValue(undefined) };
    permissionResolver = {
      resolvePermissions: vi.fn().mockResolvedValue(['DASHBOARD_VIEW']),
    };

    guard = new DashboardAuthGuard(
      reflector as unknown as Reflector,
      storeRepository as unknown as DashboardStoreRepository,
      sessionService as unknown as DashboardSessionService,
      permissionResolver,
    );

    // The Passport half is exercised by the strategy spec; here we isolate the
    // authorisation layer this guard adds on top of it.
    superCanActivate = vi
      .spyOn(DashboardJwtGuard.prototype, 'canActivate')
      .mockReturnValue(true);
  });

  afterEach(() => {
    superCanActivate.mockRestore();
  });

  it('should let a valid principal through', async () => {
    const context = buildContext({ user: principal() });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should skip every check for a @DashboardPublic route', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(await guard.canActivate(buildContext({}))).toBe(true);
    expect(storeRepository.findAccessStateById).not.toHaveBeenCalled();
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it('should reject when authentication fails', async () => {
    superCanActivate.mockReturnValue(false);

    expect(await guard.canActivate(buildContext({}))).toBe(false);
  });

  it('should reject when no principal was attached', async () => {
    expect(await guard.canActivate(buildContext({}))).toBe(false);
  });

  it('should re-check store access state on every request', async () => {
    await guard.canActivate(buildContext({ user: principal() }));

    expect(storeRepository.findAccessStateById).toHaveBeenCalledWith('store-1');
  });

  it('should reject once dashboard access is disabled mid-session', async () => {
    storeRepository.findAccessStateById.mockResolvedValue({
      id: 'store-1',
      isActive: true,
      deletedAt: null,
      dashboardAccessEnabled: false,
    });

    await expect(
      guard.canActivate(buildContext({ user: principal() })),
    ).rejects.toThrow(DASHBOARD_AUTH_ERRORS.DASHBOARD_DISABLED);
  });

  it('should reject once the store is deactivated mid-session', async () => {
    storeRepository.findAccessStateById.mockResolvedValue({
      id: 'store-1',
      isActive: false,
      deletedAt: null,
      dashboardAccessEnabled: true,
    });

    await expect(
      guard.canActivate(buildContext({ user: principal() })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject once the store is soft-deleted mid-session', async () => {
    storeRepository.findAccessStateById.mockResolvedValue({
      id: 'store-1',
      isActive: true,
      deletedAt: new Date(),
      dashboardAccessEnabled: true,
    });

    await expect(
      guard.canActivate(buildContext({ user: principal() })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject when the store row has vanished', async () => {
    storeRepository.findAccessStateById.mockResolvedValue(null);

    await expect(
      guard.canActivate(buildContext({ user: principal() })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should hydrate permissions from the resolver seam', async () => {
    const request = { user: principal() };

    await guard.canActivate(buildContext(request));

    expect(permissionResolver.resolvePermissions).toHaveBeenCalledWith({
      storeId: 'store-1',
      brandId: 'brand-1',
      slug: 'greenchillyz-patia',
    });
    expect(request.user.permissions).toEqual(['DASHBOARD_VIEW']);
  });

  it('should record session activity', async () => {
    await guard.canActivate(buildContext({ user: principal() }));

    expect(sessionService.touch).toHaveBeenCalledWith('session-1');
  });

  it('should resolve an observable authentication result', async () => {
    const { of } = await import('rxjs');
    superCanActivate.mockReturnValue(of(true) as never);

    expect(await guard.canActivate(buildContext({ user: principal() }))).toBe(
      true,
    );
  });
});

describe('DashboardJwtGuard', () => {
  /** The Passport mixin sitting directly beneath the dashboard guard. */
  const passportBase = Object.getPrototypeOf(
    DashboardJwtGuard.prototype,
  ) as { canActivate: (context: ExecutionContext) => boolean };

  let authenticate: MockInstance<(context: ExecutionContext) => boolean>;

  beforeEach(() => {
    authenticate = vi
      .spyOn(passportBase, 'canActivate')
      .mockReturnValue(false);
  });

  afterEach(() => {
    authenticate.mockRestore();
  });

  it('should honour @DashboardPublic without authenticating', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(true),
    } as unknown as Reflector;

    expect(new DashboardJwtGuard(reflector).canActivate(buildContext({}))).toBe(
      true,
    );
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('should read the dashboard public key, not the customer one', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    } as unknown as Reflector;

    new DashboardJwtGuard(reflector).canActivate(buildContext({}));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_DASHBOARD_PUBLIC_KEY,
      expect.any(Array),
    );
  });

  it('should not be opened by the customer @Public flag', () => {
    const reflector = {
      getAllAndOverride: vi.fn((key: string) => key === 'isPublic'),
    } as unknown as Reflector;

    expect(new DashboardJwtGuard(reflector).canActivate(buildContext({}))).toBe(
      false,
    );
    expect(authenticate).toHaveBeenCalled();
  });
});

describe('DashboardRefreshGuard', () => {
  let guard: DashboardRefreshGuard;

  beforeEach(() => {
    guard = new DashboardRefreshGuard();
  });

  it('should accept a request carrying the refresh cookie', () => {
    const request = {
      cookies: { gc_dashboard_refresh_token: 'raw-token' },
    } as Record<string, unknown>;

    expect(guard.canActivate(buildContext(request))).toBe(true);
  });

  it('should attach the raw token for the controller', () => {
    const request = {
      cookies: { gc_dashboard_refresh_token: 'raw-token' },
    } as Record<string, unknown>;

    guard.canActivate(buildContext(request));

    expect(request.dashboardRefreshToken).toBe('raw-token');
  });

  it('should reject when the cookie is absent', () => {
    expect(() => guard.canActivate(buildContext({ cookies: {} }))).toThrow(
      DASHBOARD_AUTH_ERRORS.REFRESH_TOKEN_MISSING,
    );
  });

  it('should reject when the request carries no cookies at all', () => {
    expect(() => guard.canActivate(buildContext({}))).toThrow(
      DASHBOARD_AUTH_ERRORS.REFRESH_TOKEN_MISSING,
    );
  });

  it('should reject an empty cookie value', () => {
    expect(() =>
      guard.canActivate(
        buildContext({ cookies: { gc_dashboard_refresh_token: '' } }),
      ),
    ).toThrow(DASHBOARD_AUTH_ERRORS.REFRESH_TOKEN_MISSING);
  });

  it('should ignore the customer refresh cookie', () => {
    expect(() =>
      guard.canActivate(
        buildContext({ cookies: { gc_refresh_token: 'customer-token' } }),
      ),
    ).toThrow(DASHBOARD_AUTH_ERRORS.REFRESH_TOKEN_MISSING);
  });
});
