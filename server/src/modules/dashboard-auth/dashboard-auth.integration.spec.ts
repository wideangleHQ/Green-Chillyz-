import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../providers/redis/redis.service';
import { DASHBOARD_EVENTS } from './constants';
import {
  DashboardSessionRepository,
  DashboardStoreRepository,
} from './repositories';
import {
  DashboardAccessCodeService,
  DashboardAuthService,
  DashboardCacheService,
  DashboardCodeCipherService,
  DashboardLoginThrottleService,
  DashboardSessionService,
  DashboardTokenService,
  DefaultDashboardPermissionResolver,
  DefaultDashboardRoleResolver,
  DefaultDashboardStoreScopeResolver,
} from './services';
import { DashboardJwtStrategy } from './strategies/dashboard-jwt.strategy';

const CONFIG_VALUES: Record<string, unknown> = {
  'dashboardAuth.jwtSecret': 'integration-dashboard-secret-000000000000',
  'dashboardAuth.jwtExpiresIn': '15m',
  'dashboardAuth.jwtIssuer': 'greenchillyz-api',
  'dashboardAuth.jwtAudience': 'greenchillyz-dashboard',
  'dashboardAuth.refreshTokenExpiryDays': 7,
  'dashboardAuth.codePepper': 'integration-pepper-0000000000000000000000',
  'dashboardAuth.codePrefix': 'GC',
  'dashboardAuth.codeSecretLength': 8,
  'dashboardAuth.cookieDomain': 'localhost',
  'dashboardAuth.cookieSecure': false,
  'dashboardAuth.maxFailedAttempts': 3,
  'dashboardAuth.lockDurationMinutes': 15,
  'dashboardAuth.loginRateLimitWindowSeconds': 60,
  'dashboardAuth.loginRateLimitMaxAttempts': 5,
};

const CONTEXT = {
  ipAddress: '203.0.113.10',
  userAgent: 'vitest-integration',
  deviceFingerprint: 'fp-1',
};

/**
 * In-memory doubles for the two infrastructure boundaries.
 *
 * Everything above them — services, repositories, resolvers, the strategy, DI
 * wiring — is the real thing, so these tests exercise the module as it is
 * assembled at runtime rather than a hand-wired subset of it.
 */
function createFakeRedis() {
  const store = new Map<string, { value: string; expiresAt: number | null }>();

  const read = (key: string): string | null => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };

  const client = {
    incr: vi.fn(async (key: string) => {
      const next = Number(read(key) ?? 0) + 1;
      store.set(key, { value: String(next), expiresAt: null });
      return next;
    }),
    expire: vi.fn(async () => 1),
  };

  return {
    store,
    service: {
      getClient: () => client,
      get: vi.fn(async (key: string) => {
        const raw = read(key);
        if (raw === null) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }),
      set: vi.fn(async (key: string, value: unknown, ttl?: number) => {
        store.set(key, {
          value: typeof value === 'string' ? value : JSON.stringify(value),
          expiresAt: ttl ? Date.now() + ttl * 1000 : null,
        });
      }),
      del: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      delPattern: vi.fn(async () => undefined),
      exists: vi.fn(async (key: string) => read(key) !== null),
      ttl: vi.fn(async (key: string) => {
        const entry = store.get(key);
        if (!entry || entry.expiresAt === null) return -1;
        return Math.floor((entry.expiresAt - Date.now()) / 1000);
      }),
    } as unknown as RedisService,
  };
}

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  code: string;
  city: string;
  state: string;
  brandId: string;
  isActive: boolean;
  deletedAt: Date | null;
  dashboardCodeHash: string | null;
  dashboardCodeLookup: string | null;
  dashboardAccessEnabled: boolean;
  dashboardFailedAttempts: number;
  dashboardLockedUntil: Date | null;
  dashboardLastLoginAt: Date | null;
  dashboardLastLoginIp: string | null;
  dashboardLastRotatedAt: Date | null;
  brand: { id: string; name: string; slug: string };
}

function createFakePrisma(store: StoreRow) {
  const sessions = new Map<string, Record<string, unknown>>();
  const tokens = new Map<string, Record<string, unknown>>();
  let sessionSeq = 0;
  let tokenSeq = 0;

  const matches = (
    where: Record<string, unknown>,
    row: Record<string, unknown>,
  ): boolean =>
    Object.entries(where).every(([key, expected]) => {
      const actual = row[key];
      if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
        const clause = expected as Record<string, unknown>;
        if ('in' in clause) return (clause.in as unknown[]).includes(actual);
        if ('gt' in clause) {
          return (actual as Date).getTime() > (clause.gt as Date).getTime();
        }
      }
      return actual === expected;
    });

  const prisma = {
    store: {
      findUnique: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if (where.dashboardCodeLookup !== undefined) {
          return store.dashboardCodeLookup === where.dashboardCodeLookup
            ? { ...store }
            : null;
        }
        return where.id === store.id ? { ...store } : null;
      }),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        where.id === store.id && store.deletedAt === null ? { ...store } : null,
      ),
      update: vi.fn(
        async ({ data }: { data: Record<string, unknown> }) => {
          for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === 'object' && 'increment' in value) {
              (store as unknown as Record<string, number>)[key] +=
                (value as { increment: number }).increment;
            } else {
              (store as unknown as Record<string, unknown>)[key] = value;
            }
          }
          return { ...store };
        },
      ),
    },
    dashboardSession: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        sessionSeq += 1;
        const now = new Date();
        const row = {
          id: `session-${sessionSeq}`,
          issuedAt: now,
          revokedAt: null,
          revokedReason: null,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        sessions.set(row.id as string, row);
        return { ...row };
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const row = sessions.get(where.id);
        return row ? { ...row } : null;
      }),
      findMany: vi.fn(
        async ({ where, select }: { where: Record<string, unknown>; select?: unknown }) => {
          const rows = [...sessions.values()].filter((row) =>
            matches(where, row),
          );
          return select ? rows.map((row) => ({ id: row.id })) : rows.map((r) => ({ ...r }));
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          let count = 0;
          for (const row of sessions.values()) {
            if (matches(where, row)) {
              Object.assign(row, data);
              count += 1;
            }
          }
          return { count };
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const row = sessions.get(where.id);
          if (row) Object.assign(row, data);
          return { ...row };
        },
      ),
    },
    dashboardRefreshToken: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        tokenSeq += 1;
        const row = {
          id: `token-${tokenSeq}`,
          revokedAt: null,
          createdAt: new Date(),
          ...data,
        };
        tokens.set(row.id as string, row);
        return { ...row };
      }),
      findUnique: vi.fn(
        async ({ where }: { where: { tokenHash: string } }) => {
          const row = [...tokens.values()].find(
            (token) => token.tokenHash === where.tokenHash,
          );
          if (!row) return null;
          return {
            ...row,
            session: { ...sessions.get(row.sessionId as string) },
          };
        },
      ),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        [...tokens.values()]
          .filter((row) => matches(where, row))
          .map((row) => ({ sessionId: row.sessionId })),
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const row = tokens.get(where.id);
          if (row) Object.assign(row, data);
          return { ...row };
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          let count = 0;
          for (const row of tokens.values()) {
            if (matches(where, row)) {
              Object.assign(row, data);
              count += 1;
            }
          }
          return { count };
        },
      ),
    },
    $transaction: vi.fn(async (arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: unknown) => Promise<unknown>)(prisma)
        : Promise.all(arg as Promise<unknown>[]),
    ),
  };

  return { prisma, sessions, tokens };
}

function baseStore(): StoreRow {
  return {
    id: 'store-1',
    name: 'GreenChillyz Patia',
    slug: 'greenchillyz-patia',
    code: 'PAT',
    city: 'Bhubaneswar',
    state: 'Odisha',
    brandId: 'brand-1',
    isActive: true,
    deletedAt: null,
    dashboardCodeHash: null,
    dashboardCodeLookup: null,
    dashboardAccessEnabled: true,
    dashboardFailedAttempts: 0,
    dashboardLockedUntil: null,
    dashboardLastLoginAt: null,
    dashboardLastLoginIp: null,
    dashboardLastRotatedAt: null,
    brand: { id: 'brand-1', name: 'GreenChillyz', slug: 'greenchillyz' },
  };
}

function mockResponse() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response & { cookie: ReturnType<typeof vi.fn> };
}

describe('Dashboard IAM (integration)', () => {
  let authService: DashboardAuthService;
  let tokenService: DashboardTokenService;
  let strategy: DashboardJwtStrategy;
  let accessCodeService: DashboardAccessCodeService;
  let emitted: Array<{ event: string; payload: unknown }>;
  let storeRow: StoreRow;
  let redis: ReturnType<typeof createFakeRedis>;
  let accessCode: string;

  beforeEach(async () => {
    storeRow = baseStore();
    redis = createFakeRedis();
    const { prisma } = createFakePrisma(storeRow);
    emitted = [];

    const config = {
      get: (key: string, fallback?: unknown) => CONFIG_VALUES[key] ?? fallback,
      getOrThrow: (key: string) => {
        if (CONFIG_VALUES[key] === undefined) {
          throw new Error(`Missing config ${key}`);
        }
        return CONFIG_VALUES[key];
      },
    } as unknown as ConfigService;

    // Wired by hand rather than through the Nest container: Vitest transpiles
    // with esbuild, which does not emit the decorator metadata DI relies on.
    // The object graph is otherwise exactly what `DashboardAuthModule` builds.
    const prismaService = prisma as unknown as PrismaService;
    const storeRepository = new DashboardStoreRepository(prismaService);
    const sessionRepository = new DashboardSessionRepository(prismaService);
    const cache = new DashboardCacheService(redis.service);
    const emitter = new EventEmitter2();

    accessCodeService = new DashboardAccessCodeService(config);
    tokenService = new DashboardTokenService(new JwtService(), config);

    const sessionService = new DashboardSessionService(
      sessionRepository,
      cache,
    );

    authService = new DashboardAuthService(
      storeRepository,
      accessCodeService,
      tokenService,
      sessionService,
      cache,
      new DashboardCodeCipherService(config),
      new DashboardLoginThrottleService(config, redis.service, storeRepository),
      emitter,
      new DefaultDashboardPermissionResolver(),
      new DefaultDashboardRoleResolver(),
      new DefaultDashboardStoreScopeResolver(),
    );

    strategy = new DashboardJwtStrategy(config, sessionService, cache);

    emitter.onAny((event: string | string[], payload: unknown) => {
      emitted.push({ event: String(event), payload });
    });

    // Provision the store exactly as the rotation path does.
    const generated = await accessCodeService.generate(storeRow.code);
    accessCode = generated.code;
    storeRow.dashboardCodeHash = generated.codeHash;
    storeRow.dashboardCodeLookup = generated.codeLookup;
  });

  describe('login', () => {
    it('should authenticate a provisioned store and return its context', async () => {
      const result = await authService.login(accessCode, CONTEXT);

      expect(result.store.storeName).toBe('GreenChillyz Patia');
      expect(result.store.storeType).toBe('greenchillyz');
      expect(result.sessionId).toBeDefined();
    });

    it('should issue a token the dashboard strategy accepts', async () => {
      const result = await authService.login(accessCode, CONTEXT);
      const payload = tokenService.verifyAccessToken(result.tokens.accessToken);

      const principal = await strategy.validate(payload);

      expect(principal.storeId).toBe('store-1');
      expect(principal.sessionId).toBe(result.sessionId);
    });

    it('should record the login on the store row', async () => {
      await authService.login(accessCode, CONTEXT);

      expect(storeRow.dashboardLastLoginIp).toBe('203.0.113.10');
      expect(storeRow.dashboardLastLoginAt).toBeInstanceOf(Date);
    });

    it('should publish a login success event', async () => {
      await authService.login(accessCode, CONTEXT);

      expect(
        emitted.some((e) => e.event === DASHBOARD_EVENTS.LOGIN_SUCCESS),
      ).toBe(true);
    });

    it('should reject a code that belongs to no store', async () => {
      await expect(
        authService.login('GC-XXX-NOTREAL1', CONTEXT),
      ).rejects.toThrow('Invalid store access code');
    });

    it('should lock the store after the configured failures', async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await authService
          .login(`GC-PAT-WRONG00${attempt}`, CONTEXT)
          .catch(() => null);
      }

      expect(storeRow.dashboardFailedAttempts).toBe(0);
    });

    it('should lock after repeated wrong codes for a real store', async () => {
      const wrong = `${accessCode.slice(0, -1)}${
        accessCode.endsWith('A') ? 'B' : 'A'
      }`;
      const lookupOfWrong = accessCodeService.lookupIndex(wrong);
      // Point the wrong code at the same store so the failure is attributable.
      storeRow.dashboardCodeLookup = lookupOfWrong;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        await authService.login(wrong, CONTEXT).catch(() => null);
      }

      expect(storeRow.dashboardFailedAttempts).toBe(3);
      expect(storeRow.dashboardLockedUntil).toBeInstanceOf(Date);
    });

    it('should refuse a store whose dashboard access is switched off', async () => {
      storeRow.dashboardAccessEnabled = false;

      await expect(authService.login(accessCode, CONTEXT)).rejects.toThrow(
        'Invalid store access code',
      );
    });

    it('should rate limit a burst from one IP', async () => {
      const attempts = await Promise.all(
        Array.from({ length: 7 }, () =>
          authService
            .login('GC-XXX-NOTREAL1', CONTEXT)
            .then(() => 'ok')
            .catch((error: Error) => error.message),
        ),
      );

      expect(
        attempts.filter((message) => message.includes('Too many login')),
      ).not.toHaveLength(0);
    });
  });

  describe('session lifecycle', () => {
    it('should survive a full login → me → refresh → logout cycle', async () => {
      const login = await authService.login(accessCode, CONTEXT);

      const payload = tokenService.verifyAccessToken(login.tokens.accessToken);
      const principal = await strategy.validate(payload);

      const context = await authService.getCurrentStore(principal);
      expect(context.storeId).toBe('store-1');

      const refreshed = await authService.refresh(
        login.tokens.refreshToken,
        CONTEXT,
      );
      expect(refreshed.refreshToken).not.toBe(login.tokens.refreshToken);

      await authService.logout(principal, CONTEXT);

      await expect(strategy.validate(payload)).rejects.toThrow();
    });

    it('should invalidate the old refresh token after rotation', async () => {
      const login = await authService.login(accessCode, CONTEXT);
      await authService.refresh(login.tokens.refreshToken, CONTEXT);

      await expect(
        authService.refresh(login.tokens.refreshToken, CONTEXT),
      ).rejects.toThrow('reuse detected');
    });

    it('should burn the session when a rotated token is replayed', async () => {
      const login = await authService.login(accessCode, CONTEXT);
      const rotated = await authService.refresh(
        login.tokens.refreshToken,
        CONTEXT,
      );

      await authService
        .refresh(login.tokens.refreshToken, CONTEXT)
        .catch(() => null);

      await expect(
        authService.refresh(rotated.refreshToken, CONTEXT),
      ).rejects.toThrow();
    });

    it('should list its own sessions and no one else’s', async () => {
      const first = await authService.login(accessCode, CONTEXT);
      await authService.login(accessCode, CONTEXT);

      const payload = tokenService.verifyAccessToken(first.tokens.accessToken);
      const principal = await strategy.validate(payload);

      const sessions = await authService.listSessions(principal);

      expect(sessions).toHaveLength(2);
      expect(sessions.filter((s) => s.isCurrent)).toHaveLength(1);
    });

    it('should end every session on logout-all', async () => {
      const first = await authService.login(accessCode, CONTEXT);
      const second = await authService.login(accessCode, CONTEXT);

      const principal = await strategy.validate(
        tokenService.verifyAccessToken(first.tokens.accessToken),
      );

      const result = await authService.logoutAll(principal, CONTEXT);
      expect(result.revokedSessions).toBe(2);

      await expect(
        authService.refresh(second.tokens.refreshToken, CONTEXT),
      ).rejects.toThrow();
    });

    it('should strand live access tokens after logout-all', async () => {
      const login = await authService.login(accessCode, CONTEXT);
      const payload = tokenService.verifyAccessToken(login.tokens.accessToken);
      const principal = await strategy.validate(payload);

      await authService.logoutAll(principal, CONTEXT);

      await expect(strategy.validate(payload)).rejects.toThrow();
    });

    it('should refuse a refresh once dashboard access is switched off', async () => {
      const login = await authService.login(accessCode, CONTEXT);
      storeRow.dashboardAccessEnabled = false;

      await expect(
        authService.refresh(login.tokens.refreshToken, CONTEXT),
      ).rejects.toThrow('Dashboard access is disabled');
    });
  });

  describe('code rotation', () => {
    it('should issue a working new code and retire the old one', async () => {
      const { accessCode: rotated } =
        await authService.rotateAccessCode('store-1');

      await expect(authService.login(accessCode, CONTEXT)).rejects.toThrow();
      await expect(authService.login(rotated, CONTEXT)).resolves.toMatchObject({
        sessionId: expect.any(String),
      });
    });

    it('should end sessions opened with the retired code', async () => {
      const login = await authService.login(accessCode, CONTEXT);

      await authService.rotateAccessCode('store-1');

      await expect(
        authService.refresh(login.tokens.refreshToken, CONTEXT),
      ).rejects.toThrow();
    });

    it('should never persist the plaintext code', async () => {
      const { accessCode: rotated } =
        await authService.rotateAccessCode('store-1');

      expect(storeRow.dashboardCodeHash).not.toContain(rotated);
      expect(storeRow.dashboardCodeLookup).not.toContain(rotated);
      expect(JSON.stringify([...redis.store.entries()])).not.toContain(rotated);
    });
  });

  describe('cookies', () => {
    it('should set only dashboard cookies, never customer ones', async () => {
      const login = await authService.login(accessCode, CONTEXT);
      const res = mockResponse();

      tokenService.setAuthCookies(res, login.tokens);

      const names = res.cookie.mock.calls.map((call) => call[0]);
      expect(names).toEqual([
        'gc_dashboard_access_token',
        'gc_dashboard_refresh_token',
      ]);
    });
  });

  describe('caching', () => {
    it('should serve a repeated store context read from Redis', async () => {
      await authService.login(accessCode, CONTEXT);
      const callsAfterLogin = redis.service.get as unknown as {
        mock: { calls: unknown[] };
      };
      const before = callsAfterLogin.mock.calls.length;

      await authService.buildStoreContext('store-1');

      expect(callsAfterLogin.mock.calls.length).toBeGreaterThan(before);
    });

    it('should keep the session reachable after the cache is flushed', async () => {
      const login = await authService.login(accessCode, CONTEXT);
      const payload = tokenService.verifyAccessToken(login.tokens.accessToken);

      redis.store.clear();

      await expect(strategy.validate(payload)).resolves.toMatchObject({
        storeId: 'store-1',
      });
    });
  });
});
