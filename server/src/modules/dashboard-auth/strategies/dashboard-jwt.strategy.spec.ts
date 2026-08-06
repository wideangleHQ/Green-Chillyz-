import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { DashboardCacheService } from '../services/dashboard-cache.service';
import { DashboardSessionService } from '../services/dashboard-session.service';
import { DashboardJwtStrategy } from './dashboard-jwt.strategy';
import { DASHBOARD_AUTH_ERRORS } from '../constants';
import { DashboardJwtPayload } from '../interfaces';

const CONFIG_VALUES: Record<string, unknown> = {
  'dashboardAuth.jwtSecret': 'dashboard-secret-long-enough-for-tests-000',
  'dashboardAuth.jwtIssuer': 'greenchillyz-api',
  'dashboardAuth.jwtAudience': 'greenchillyz-dashboard',
};

function payload(
  overrides: Partial<DashboardJwtPayload> = {},
): DashboardJwtPayload {
  return {
    sub: 'store-1',
    sid: 'session-1',
    typ: 'dashboard',
    slug: 'greenchillyz-patia',
    scope: { storeId: 'store-1', brandId: 'brand-1', scopeType: 'STORE' },
    role: 'STORE_DASHBOARD',
    permissionsProfile: 'STORE_DASHBOARD',
    tokenVersion: 0,
    ...overrides,
  };
}

describe('DashboardJwtStrategy', () => {
  let strategy: DashboardJwtStrategy;
  let sessionService: { assertActiveSession: ReturnType<typeof vi.fn> };
  let cache: { getTokenVersion: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionService = {
      assertActiveSession: vi.fn().mockResolvedValue({
        sessionId: 'session-1',
        storeId: 'store-1',
        ipAddress: '203.0.113.10',
        userAgent: null,
        deviceFingerprint: null,
        issuedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    };
    cache = { getTokenVersion: vi.fn().mockResolvedValue(0) };

    const config = {
      get: (key: string, fallback?: unknown) => CONFIG_VALUES[key] ?? fallback,
      getOrThrow: (key: string) => CONFIG_VALUES[key],
    } as unknown as ConfigService;

    strategy = new DashboardJwtStrategy(
      config,
      sessionService as unknown as DashboardSessionService,
      cache as unknown as DashboardCacheService,
    );
  });

  it('should build the principal from a valid payload', async () => {
    const principal = await strategy.validate(payload());

    expect(principal.storeId).toBe('store-1');
    expect(principal.sessionId).toBe('session-1');
    expect(principal.slug).toBe('greenchillyz-patia');
    expect(principal.role).toBe('STORE_DASHBOARD');
  });

  it('should start the principal with no permissions, leaving them to the guard', async () => {
    const principal = await strategy.validate(payload());

    expect(principal.permissions).toEqual([]);
  });

  it('should reject a token that is not marked as a dashboard token', async () => {
    await expect(
      strategy.validate(payload({ typ: 'customer' as never })),
    ).rejects.toThrow(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
  });

  it('should not consult the session for a non-dashboard token', async () => {
    await expect(
      strategy.validate(payload({ typ: 'customer' as never })),
    ).rejects.toThrow();

    expect(sessionService.assertActiveSession).not.toHaveBeenCalled();
  });

  it('should require a live session, not merely a valid signature', async () => {
    sessionService.assertActiveSession.mockRejectedValue(
      new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_REVOKED),
    );

    await expect(strategy.validate(payload())).rejects.toThrow(
      DASHBOARD_AUTH_ERRORS.SESSION_REVOKED,
    );
  });

  it('should reject a token whose session belongs to another store', async () => {
    sessionService.assertActiveSession.mockResolvedValue({
      sessionId: 'session-1',
      storeId: 'store-2',
      ipAddress: '203.0.113.10',
      userAgent: null,
      deviceFingerprint: null,
      issuedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await expect(strategy.validate(payload())).rejects.toThrow(
      DASHBOARD_AUTH_ERRORS.INVALID_TOKEN,
    );
  });

  it('should reject a token issued before a logout-all', async () => {
    cache.getTokenVersion.mockResolvedValue(2);

    await expect(
      strategy.validate(payload({ tokenVersion: 1 })),
    ).rejects.toThrow(DASHBOARD_AUTH_ERRORS.INVALID_TOKEN);
  });

  it('should accept a token at the current version', async () => {
    cache.getTokenVersion.mockResolvedValue(2);

    await expect(
      strategy.validate(payload({ tokenVersion: 2 })),
    ).resolves.toMatchObject({ storeId: 'store-1' });
  });

  it('should accept a token ahead of the cached version, so a flushed cache locks nobody out', async () => {
    cache.getTokenVersion.mockResolvedValue(0);

    await expect(
      strategy.validate(payload({ tokenVersion: 3 })),
    ).resolves.toMatchObject({ storeId: 'store-1' });
  });
});
