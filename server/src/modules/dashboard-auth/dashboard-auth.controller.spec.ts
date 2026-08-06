import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Response } from 'express';
import { DashboardAuthController } from './dashboard-auth.controller';
import { DashboardAuthService, DashboardTokenService } from './services';
import { DashboardPrincipal, DashboardRequestContext } from './interfaces';

const CONTEXT: DashboardRequestContext = {
  ipAddress: '203.0.113.10',
  userAgent: 'vitest',
  deviceFingerprint: null,
};

const PRINCIPAL: DashboardPrincipal = {
  storeId: 'store-1',
  sessionId: 'session-1',
  slug: 'greenchillyz-patia',
  scope: { storeId: 'store-1', brandId: 'brand-1', scopeType: 'STORE' },
  role: 'STORE_DASHBOARD',
  permissionsProfile: 'STORE_DASHBOARD',
  permissions: [],
};

const STORE_CONTEXT = {
  storeId: 'store-1',
  storeName: 'GreenChillyz Patia',
  storeSlug: 'greenchillyz-patia',
  storeCode: 'PAT',
  storeType: 'greenchillyz',
  brandId: 'brand-1',
  brandName: 'GreenChillyz',
  brandSlug: 'greenchillyz',
  city: 'Bhubaneswar',
  state: 'Odisha',
  isActive: true,
  dashboardAccessEnabled: true,
  scope: { storeId: 'store-1', brandId: 'brand-1', scopeType: 'STORE' as const },
  role: 'STORE_DASHBOARD',
  permissionsProfile: 'STORE_DASHBOARD',
  permissions: [],
};

describe('DashboardAuthController', () => {
  let controller: DashboardAuthController;
  let authService: Record<string, ReturnType<typeof vi.fn>>;
  let tokenService: {
    setAuthCookies: ReturnType<typeof vi.fn>;
    clearAuthCookies: ReturnType<typeof vi.fn>;
  };
  let res: Response;

  beforeEach(() => {
    authService = {
      login: vi.fn().mockResolvedValue({
        tokens: { accessToken: 'access', refreshToken: 'refresh' },
        store: STORE_CONTEXT,
        sessionId: 'session-1',
      }),
      refresh: vi
        .fn()
        .mockResolvedValue({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
      logout: vi.fn().mockResolvedValue(undefined),
      logoutAll: vi.fn().mockResolvedValue({ revokedSessions: 3 }),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      getCurrentStore: vi.fn().mockResolvedValue(STORE_CONTEXT),
      getCurrentSession: vi.fn().mockResolvedValue({ id: 'session-1' }),
      listSessions: vi.fn().mockResolvedValue([{ id: 'session-1' }]),
    };
    tokenService = {
      setAuthCookies: vi.fn(),
      clearAuthCookies: vi.fn(),
    };
    res = {} as Response;

    controller = new DashboardAuthController(
      authService as unknown as DashboardAuthService,
      tokenService as unknown as DashboardTokenService,
    );
  });

  describe('login', () => {
    it('should delegate the whole decision to the service', async () => {
      await controller.login({ accessCode: 'GC-PAT-X93KL8Q2' }, CONTEXT, res);

      expect(authService.login).toHaveBeenCalledWith(
        'GC-PAT-X93KL8Q2',
        CONTEXT,
      );
    });

    it('should set the dashboard cookies', async () => {
      await controller.login({ accessCode: 'GC-PAT-X93KL8Q2' }, CONTEXT, res);

      expect(tokenService.setAuthCookies).toHaveBeenCalledWith(res, {
        accessToken: 'access',
        refreshToken: 'refresh',
      });
    });

    it('should return the store context and session id', async () => {
      const result = await controller.login(
        { accessCode: 'GC-PAT-X93KL8Q2' },
        CONTEXT,
        res,
      );

      expect(result.store.storeId).toBe('store-1');
      expect(result.sessionId).toBe('session-1');
    });

    it('should never put tokens in the response body', async () => {
      const result = await controller.login(
        { accessCode: 'GC-PAT-X93KL8Q2' },
        CONTEXT,
        res,
      );

      expect(JSON.stringify(result)).not.toContain('access');
      expect(JSON.stringify(result)).not.toContain('refresh');
    });

    it('should not set cookies when the service rejects', async () => {
      authService.login.mockRejectedValue(new Error('nope'));

      await expect(
        controller.login({ accessCode: 'GC-PAT-BAD' }, CONTEXT, res),
      ).rejects.toThrow();
      expect(tokenService.setAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should pass the guard-supplied token to the service', async () => {
      await controller.refresh('raw-refresh', CONTEXT, res);

      expect(authService.refresh).toHaveBeenCalledWith('raw-refresh', CONTEXT);
    });

    it('should write the rotated cookies', async () => {
      await controller.refresh('raw-refresh', CONTEXT, res);

      expect(tokenService.setAuthCookies).toHaveBeenCalledWith(res, {
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      });
    });

    it('should not leak the new tokens in the body', async () => {
      const result = await controller.refresh('raw-refresh', CONTEXT, res);

      expect(Object.keys(result)).toEqual(['message']);
    });
  });

  describe('logout', () => {
    it('should end the current session and clear the cookies', async () => {
      await controller.logout(PRINCIPAL, CONTEXT, res);

      expect(authService.logout).toHaveBeenCalledWith(PRINCIPAL, CONTEXT);
      expect(tokenService.clearAuthCookies).toHaveBeenCalledWith(res);
    });

    it('should not clear cookies when the service fails', async () => {
      authService.logout.mockRejectedValue(new Error('boom'));

      await expect(
        controller.logout(PRINCIPAL, CONTEXT, res),
      ).rejects.toThrow();
      expect(tokenService.clearAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should report how many sessions were revoked', async () => {
      const result = await controller.logoutAll(PRINCIPAL, CONTEXT, res);

      expect(result.revokedSessions).toBe(3);
      expect(tokenService.clearAuthCookies).toHaveBeenCalledWith(res);
    });
  });

  describe('me', () => {
    it('should return the store context for the authenticated store', async () => {
      const result = await controller.getCurrentStore(PRINCIPAL);

      expect(authService.getCurrentStore).toHaveBeenCalledWith(PRINCIPAL);
      expect(result.storeId).toBe('store-1');
    });
  });

  describe('sessions', () => {
    it('should list the store’s sessions', async () => {
      const result = await controller.listSessions(PRINCIPAL);

      expect(authService.listSessions).toHaveBeenCalledWith(PRINCIPAL);
      expect(result).toHaveLength(1);
    });

    it('should return the current session', async () => {
      await controller.getCurrentSession(PRINCIPAL);

      expect(authService.getCurrentSession).toHaveBeenCalledWith(PRINCIPAL);
    });

    it('should revoke a session by id', async () => {
      await controller.revokeSession(PRINCIPAL, 'session-9', CONTEXT);

      expect(authService.revokeSession).toHaveBeenCalledWith(
        PRINCIPAL,
        'session-9',
        CONTEXT,
      );
    });
  });

  describe('thinness', () => {
    it('should hold no state beyond its two collaborators', () => {
      const injected = Object.keys(
        controller as unknown as Record<string, unknown>,
      );

      expect(injected).toEqual(['dashboardAuthService', 'tokenService']);
    });
  });
});
