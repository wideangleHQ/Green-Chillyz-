import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { DashboardTokenService } from './dashboard-token.service';
import { DASHBOARD_COOKIES } from '../constants';
import { DashboardStoreScope } from '../interfaces';

const DASHBOARD_SECRET = 'dashboard-secret-that-is-long-enough-for-tests';
const CUSTOMER_SECRET = 'customer-secret-that-is-long-enough-for-test';

const CONFIG_VALUES: Record<string, unknown> = {
  'dashboardAuth.jwtSecret': DASHBOARD_SECRET,
  'dashboardAuth.jwtExpiresIn': '15m',
  'dashboardAuth.jwtIssuer': 'greenchillyz-api',
  'dashboardAuth.jwtAudience': 'greenchillyz-dashboard',
  'dashboardAuth.refreshTokenExpiryDays': 7,
  'dashboardAuth.cookieDomain': undefined,
  'dashboardAuth.cookieSecure': false,
};

const SCOPE: DashboardStoreScope = {
  storeId: 'store-1',
  brandId: 'brand-1',
  scopeType: 'STORE',
};

function buildService(
  overrides: Record<string, unknown> = {},
): DashboardTokenService {
  const values = { ...CONFIG_VALUES, ...overrides };
  const config = {
    get: (key: string, fallback?: unknown) => values[key] ?? fallback,
    getOrThrow: (key: string) => {
      if (values[key] === undefined) {
        throw new Error(`Missing config ${key}`);
      }
      return values[key];
    },
  } as unknown as ConfigService;

  return new DashboardTokenService(new JwtService(), config);
}

function claims() {
  return {
    storeId: 'store-1',
    sessionId: 'session-1',
    slug: 'greenchillyz-patia',
    scope: SCOPE,
    role: 'STORE_DASHBOARD',
    permissionsProfile: 'STORE_DASHBOARD',
    tokenVersion: 0,
  };
}

function mockResponse() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response & {
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
}

describe('DashboardTokenService', () => {
  let service: DashboardTokenService;

  beforeEach(() => {
    service = buildService();
  });

  describe('signAccessToken', () => {
    it('should round-trip the store and session claims', () => {
      const payload = service.verifyAccessToken(
        service.signAccessToken(claims()),
      );

      expect(payload.sub).toBe('store-1');
      expect(payload.sid).toBe('session-1');
      expect(payload.slug).toBe('greenchillyz-patia');
    });

    it('should mark the token as a dashboard token', () => {
      const payload = service.verifyAccessToken(
        service.signAccessToken(claims()),
      );
      expect(payload.typ).toBe('dashboard');
    });

    it('should carry the store scope, role and profile', () => {
      const payload = service.verifyAccessToken(
        service.signAccessToken(claims()),
      );

      expect(payload.scope).toEqual(SCOPE);
      expect(payload.role).toBe('STORE_DASHBOARD');
      expect(payload.permissionsProfile).toBe('STORE_DASHBOARD');
    });

    it('should use the dashboard audience, not the customer one', () => {
      const payload = service.verifyAccessToken(
        service.signAccessToken(claims()),
      );

      expect(payload.aud).toBe('greenchillyz-dashboard');
      expect(payload.aud).not.toBe('greenchillyz-client');
    });

    it('should carry the token version', () => {
      const payload = service.verifyAccessToken(
        service.signAccessToken({ ...claims(), tokenVersion: 7 }),
      );
      expect(payload.tokenVersion).toBe(7);
    });

    it('should set an expiry', () => {
      const payload = service.verifyAccessToken(
        service.signAccessToken(claims()),
      );
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyAccessToken', () => {
    it('should reject a token signed with the customer secret', () => {
      const foreign = buildService({
        'dashboardAuth.jwtSecret': CUSTOMER_SECRET,
        'dashboardAuth.jwtAudience': 'greenchillyz-client',
      });

      expect(() =>
        service.verifyAccessToken(foreign.signAccessToken(claims())),
      ).toThrow(UnauthorizedException);
    });

    it('should reject a token minted for the customer audience', () => {
      const foreign = buildService({
        'dashboardAuth.jwtAudience': 'greenchillyz-client',
      });

      expect(() =>
        service.verifyAccessToken(foreign.signAccessToken(claims())),
      ).toThrow(UnauthorizedException);
    });

    it('should reject a token from another issuer', () => {
      const foreign = buildService({
        'dashboardAuth.jwtIssuer': 'somebody-else',
      });

      expect(() =>
        service.verifyAccessToken(foreign.signAccessToken(claims())),
      ).toThrow(UnauthorizedException);
    });

    it('should reject an expired token', () => {
      const shortLived = buildService({
        'dashboardAuth.jwtExpiresIn': '-1s',
      });

      expect(() =>
        service.verifyAccessToken(shortLived.signAccessToken(claims())),
      ).toThrow(UnauthorizedException);
    });

    it('should reject a structurally invalid token', () => {
      expect(() => service.verifyAccessToken('not.a.jwt')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('issueRefreshToken', () => {
    it('should return an opaque token with its digest', () => {
      const issued = service.issueRefreshToken();

      expect(issued.rawToken).toHaveLength(128);
      expect(issued.tokenHash).toHaveLength(64);
      expect(issued.tokenHash).not.toBe(issued.rawToken);
    });

    it('should hash deterministically, so a presented token can be found', () => {
      const issued = service.issueRefreshToken();
      expect(service.hashRefreshToken(issued.rawToken)).toBe(issued.tokenHash);
    });

    it('should start a new family when none is supplied', () => {
      const first = service.issueRefreshToken();
      const second = service.issueRefreshToken();

      expect(first.familyId).not.toBe(second.familyId);
    });

    it('should stay in the family it is given, so rotation is traceable', () => {
      const first = service.issueRefreshToken();
      const rotated = service.issueRefreshToken(first.familyId);

      expect(rotated.familyId).toBe(first.familyId);
      expect(rotated.rawToken).not.toBe(first.rawToken);
    });

    it('should never repeat a token', () => {
      const tokens = new Set(
        Array.from({ length: 50 }, () => service.issueRefreshToken().rawToken),
      );
      expect(tokens.size).toBe(50);
    });

    it('should expire after the configured number of days', () => {
      const issued = service.issueRefreshToken();
      const days = (issued.expiresAt.getTime() - Date.now()) / 86_400_000;

      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThan(7.1);
    });
  });

  describe('setAuthCookies', () => {
    it('should use dashboard cookie names, never the customer ones', () => {
      const res = mockResponse();
      service.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      const names = res.cookie.mock.calls.map((call) => call[0]);
      expect(names).toEqual([
        DASHBOARD_COOKIES.ACCESS,
        DASHBOARD_COOKIES.REFRESH,
      ]);
      expect(names).not.toContain('gc_access_token');
      expect(names).not.toContain('gc_refresh_token');
    });

    it('should mark both cookies HttpOnly', () => {
      const res = mockResponse();
      service.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      for (const call of res.cookie.mock.calls) {
        expect(call[2].httpOnly).toBe(true);
      }
    });

    it('should scope the refresh cookie to the refresh endpoint only', () => {
      const res = mockResponse();
      service.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      const [, , refreshOptions] = res.cookie.mock.calls[1];
      expect(refreshOptions.path).toBe(DASHBOARD_COOKIES.REFRESH_PATH);
      expect(refreshOptions.sameSite).toBe('strict');
    });

    it('should make the access cookie site-wide with lax same-site', () => {
      const res = mockResponse();
      service.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      const [, , accessOptions] = res.cookie.mock.calls[0];
      expect(accessOptions.path).toBe('/');
      expect(accessOptions.sameSite).toBe('lax');
    });

    it('should set Secure in production', () => {
      const secure = buildService({ 'dashboardAuth.cookieSecure': true });
      const res = mockResponse();

      secure.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      for (const call of res.cookie.mock.calls) {
        expect(call[2].secure).toBe(true);
      }
    });

    it('should give the refresh cookie the refresh token lifetime', () => {
      const res = mockResponse();
      service.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      const [, , refreshOptions] = res.cookie.mock.calls[1];
      expect(refreshOptions.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should use host-only cookies when no domain is configured', () => {
      const res = mockResponse();
      service.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      for (const call of res.cookie.mock.calls) {
        expect(call[2].domain).toBeUndefined();
      }
    });

    it('should set an explicit cookie domain when configured', () => {
      const domainService = buildService({
        'dashboardAuth.cookieDomain': '.greenchillyz.com',
      });
      const res = mockResponse();

      domainService.setAuthCookies(res, { accessToken: 'a', refreshToken: 'r' });

      for (const call of res.cookie.mock.calls) {
        expect(call[2].domain).toBe('.greenchillyz.com');
      }
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear both dashboard cookies on their own paths', () => {
      const res = mockResponse();
      service.clearAuthCookies(res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        DASHBOARD_COOKIES.ACCESS,
        expect.objectContaining({ path: '/' }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        DASHBOARD_COOKIES.REFRESH,
        expect.objectContaining({ path: DASHBOARD_COOKIES.REFRESH_PATH }),
      );
    });

    it('should not touch the customer cookies', () => {
      const res = mockResponse();
      service.clearAuthCookies(res);

      const names = res.clearCookie.mock.calls.map((call) => call[0]);
      expect(names).not.toContain('gc_access_token');
      expect(names).not.toContain('gc_refresh_token');
    });
  });
});
