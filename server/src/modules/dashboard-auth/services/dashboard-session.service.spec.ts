import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { DashboardSession } from '@prisma/client';
import { DashboardSessionRepository } from '../repositories';
import { DashboardCacheService } from './dashboard-cache.service';
import { DashboardSessionService } from './dashboard-session.service';
import { IssuedRefreshToken } from './dashboard-token.service';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_SESSION_REVOKE_REASONS,
} from '../constants';

function buildSession(
  overrides: Partial<DashboardSession> = {},
): DashboardSession {
  const now = new Date();
  return {
    id: 'session-1',
    storeId: 'store-1',
    ipAddress: '203.0.113.10',
    userAgent: 'vitest',
    deviceFingerprint: null,
    issuedAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + 3_600_000),
    revokedAt: null,
    revokedReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as DashboardSession;
}

function buildToken(
  overrides: Partial<IssuedRefreshToken> = {},
): IssuedRefreshToken {
  return {
    rawToken: 'raw-token',
    tokenHash: 'hash-1',
    familyId: 'family-1',
    expiresAt: new Date(Date.now() + 604_800_000),
    ...overrides,
  };
}

describe('DashboardSessionService', () => {
  let service: DashboardSessionService;
  let repository: {
    createSessionWithToken: ReturnType<typeof vi.fn>;
    findSessionById: ReturnType<typeof vi.fn>;
    findActiveSessions: ReturnType<typeof vi.fn>;
    findRefreshToken: ReturnType<typeof vi.fn>;
    rotateRefreshToken: ReturnType<typeof vi.fn>;
    touchSession: ReturnType<typeof vi.fn>;
    revokeSession: ReturnType<typeof vi.fn>;
    revokeAllSessions: ReturnType<typeof vi.fn>;
    revokeTokenFamily: ReturnType<typeof vi.fn>;
  };
  let cache: {
    setSession: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    touchSession: ReturnType<typeof vi.fn>;
    deleteSession: ReturnType<typeof vi.fn>;
    deleteStoreSessions: ReturnType<typeof vi.fn>;
    incrementTokenVersion: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      createSessionWithToken: vi.fn(),
      findSessionById: vi.fn(),
      findActiveSessions: vi.fn().mockResolvedValue([]),
      findRefreshToken: vi.fn(),
      rotateRefreshToken: vi.fn().mockResolvedValue(undefined),
      touchSession: vi.fn().mockResolvedValue(undefined),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      revokeAllSessions: vi.fn().mockResolvedValue([]),
      revokeTokenFamily: vi.fn().mockResolvedValue([]),
    };
    cache = {
      setSession: vi.fn().mockResolvedValue(undefined),
      getSession: vi.fn().mockResolvedValue(null),
      touchSession: vi.fn().mockResolvedValue(undefined),
      deleteSession: vi.fn().mockResolvedValue(undefined),
      deleteStoreSessions: vi.fn().mockResolvedValue(undefined),
      incrementTokenVersion: vi.fn().mockResolvedValue(1),
    };

    service = new DashboardSessionService(
      repository as unknown as DashboardSessionRepository,
      cache as unknown as DashboardCacheService,
    );
  });

  describe('createSession', () => {
    it('should persist the session together with its first refresh token', async () => {
      const session = buildSession();
      repository.createSessionWithToken.mockResolvedValue(session);

      await service.createSession(
        'store-1',
        {
          ipAddress: '203.0.113.10',
          userAgent: 'vitest',
          deviceFingerprint: 'fp-1',
        },
        buildToken(),
      );

      expect(repository.createSessionWithToken).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store-1',
          ipAddress: '203.0.113.10',
          deviceFingerprint: 'fp-1',
        }),
        expect.objectContaining({ tokenHash: 'hash-1', familyId: 'family-1' }),
      );
    });

    it('should warm the cache with the new session', async () => {
      repository.createSessionWithToken.mockResolvedValue(buildSession());

      await service.createSession(
        'store-1',
        { ipAddress: '203.0.113.10', userAgent: null, deviceFingerprint: null },
        buildToken(),
      );

      expect(cache.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'session-1' }),
        expect.any(Number),
      );
    });

    it('should never cache a session for longer than it lives', async () => {
      repository.createSessionWithToken.mockResolvedValue(
        buildSession({ expiresAt: new Date(Date.now() + 10_000) }),
      );

      await service.createSession(
        'store-1',
        { ipAddress: '203.0.113.10', userAgent: null, deviceFingerprint: null },
        buildToken(),
      );

      const ttl = cache.setSession.mock.calls[0][1] as number;
      expect(ttl).toBeLessThanOrEqual(10);
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe('assertActiveSession', () => {
    it('should serve a cached session without touching the database', async () => {
      cache.getSession.mockResolvedValue({
        sessionId: 'session-1',
        storeId: 'store-1',
        ipAddress: '203.0.113.10',
        userAgent: null,
        deviceFingerprint: null,
        issuedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });

      const session = await service.assertActiveSession('session-1');

      expect(session.storeId).toBe('store-1');
      expect(repository.findSessionById).not.toHaveBeenCalled();
    });

    it('should reject and evict an expired cached session', async () => {
      cache.getSession.mockResolvedValue({
        sessionId: 'session-1',
        storeId: 'store-1',
        ipAddress: '203.0.113.10',
        userAgent: null,
        deviceFingerprint: null,
        issuedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
      });

      await expect(service.assertActiveSession('session-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.SESSION_EXPIRED,
      );
      expect(cache.deleteSession).toHaveBeenCalledWith('session-1', 'store-1');
    });

    it('should fall back to the database on a cache miss', async () => {
      repository.findSessionById.mockResolvedValue(buildSession());

      const session = await service.assertActiveSession('session-1');

      expect(session.sessionId).toBe('session-1');
      expect(cache.setSession).toHaveBeenCalled();
    });

    it('should reject an unknown session', async () => {
      repository.findSessionById.mockResolvedValue(null);

      await expect(service.assertActiveSession('nope')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject a revoked session even when the cache is empty', async () => {
      repository.findSessionById.mockResolvedValue(
        buildSession({ revokedAt: new Date() }),
      );

      await expect(service.assertActiveSession('session-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.SESSION_REVOKED,
      );
    });

    it('should reject an expired session from the database', async () => {
      repository.findSessionById.mockResolvedValue(
        buildSession({ expiresAt: new Date(Date.now() - 1_000) }),
      );

      await expect(service.assertActiveSession('session-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.SESSION_EXPIRED,
      );
    });
  });

  describe('touch', () => {
    it('should record activity in both the cache and the database', async () => {
      await service.touch('session-1');

      expect(cache.touchSession).toHaveBeenCalledWith('session-1');
      expect(repository.touchSession).toHaveBeenCalledWith('session-1');
    });

    it('should swallow failures so a request is never broken by bookkeeping', async () => {
      repository.touchSession.mockRejectedValue(new Error('db down'));

      await expect(service.touch('session-1')).resolves.toBeUndefined();
    });
  });

  describe('validateRefreshToken', () => {
    it('should accept a live token and report what to rotate', async () => {
      const session = buildSession();
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        session,
      });

      const rotation = await service.validateRefreshToken('hash-1');

      expect(rotation.currentTokenId).toBe('token-1');
      expect(rotation.familyId).toBe('family-1');
      expect(rotation.session.id).toBe('session-1');
    });

    it('should reject an unknown token', async () => {
      repository.findRefreshToken.mockResolvedValue(null);

      await expect(service.validateRefreshToken('hash-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.INVALID_REFRESH_TOKEN,
      );
    });

    it('should treat a revoked token as a leak and burn the family', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        session: buildSession(),
      });
      repository.revokeTokenFamily.mockResolvedValue(['session-1', 'session-2']);

      await expect(service.validateRefreshToken('hash-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.TOKEN_REUSE_DETECTED,
      );
      expect(repository.revokeTokenFamily).toHaveBeenCalledWith('family-1');
    });

    it('should evict every session of a burnt family from the cache', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        session: buildSession(),
      });
      repository.revokeTokenFamily.mockResolvedValue(['session-1', 'session-2']);

      await expect(
        service.validateRefreshToken('hash-1'),
      ).rejects.toThrow();

      expect(cache.deleteSession).toHaveBeenCalledWith('session-1', 'store-1');
      expect(cache.deleteSession).toHaveBeenCalledWith('session-2', 'store-1');
    });

    it('should strand outstanding access tokens after a detected reuse', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        session: buildSession(),
      });

      await expect(service.validateRefreshToken('hash-1')).rejects.toThrow();

      expect(cache.incrementTokenVersion).toHaveBeenCalledWith('store-1');
    });

    it('should reject an expired token', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        session: buildSession(),
      });

      await expect(service.validateRefreshToken('hash-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.INVALID_REFRESH_TOKEN,
      );
    });

    it('should reject a live token whose session was revoked', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        session: buildSession({ revokedAt: new Date() }),
      });

      await expect(service.validateRefreshToken('hash-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.SESSION_REVOKED,
      );
    });

    it('should reject a live token whose session expired', async () => {
      repository.findRefreshToken.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-1',
        storeId: 'store-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        session: buildSession({ expiresAt: new Date(Date.now() - 1_000) }),
      });

      await expect(service.validateRefreshToken('hash-1')).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.SESSION_EXPIRED,
      );
    });
  });

  describe('rotate', () => {
    it('should replace the token within the same family and session', async () => {
      const session = buildSession();

      await service.rotate(
        { session, currentTokenId: 'token-1', familyId: 'family-1' },
        buildToken({ tokenHash: 'hash-2' }),
      );

      expect(repository.rotateRefreshToken).toHaveBeenCalledWith('token-1', {
        sessionId: 'session-1',
        storeId: 'store-1',
        tokenHash: 'hash-2',
        familyId: 'family-1',
        expiresAt: expect.any(Date),
      });
    });

    it('should refresh the cached session activity', async () => {
      await service.rotate(
        {
          session: buildSession(),
          currentTokenId: 'token-1',
          familyId: 'family-1',
        },
        buildToken({ tokenHash: 'hash-2' }),
      );

      expect(cache.touchSession).toHaveBeenCalledWith('session-1');
    });
  });

  describe('revokeSession', () => {
    it('should revoke in the database and evict from the cache', async () => {
      await service.revokeSession(
        'session-1',
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT,
      );

      expect(repository.revokeSession).toHaveBeenCalledWith(
        'session-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT,
      );
      expect(cache.deleteSession).toHaveBeenCalledWith('session-1', 'store-1');
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke every session for the store', async () => {
      repository.revokeAllSessions.mockResolvedValue(['session-1', 'session-2']);

      const revoked = await service.revokeAllSessions('store-1');

      expect(revoked).toEqual(['session-1', 'session-2']);
      expect(cache.deleteStoreSessions).toHaveBeenCalledWith('store-1');
    });

    it('should bump the token version so live access tokens stop working', async () => {
      await service.revokeAllSessions('store-1');

      expect(cache.incrementTokenVersion).toHaveBeenCalledWith('store-1');
    });

    it('should default to the logout-all reason', async () => {
      await service.revokeAllSessions('store-1');

      expect(repository.revokeAllSessions).toHaveBeenCalledWith(
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
      );
    });
  });

  describe('revokeSessionForStore', () => {
    it('should revoke a session the store owns', async () => {
      repository.findSessionById.mockResolvedValue(buildSession());

      await service.revokeSessionForStore('session-1', 'store-1');

      expect(repository.revokeSession).toHaveBeenCalledWith(
        'session-1',
        DASHBOARD_SESSION_REVOKE_REASONS.MANUAL_REVOKE,
      );
    });

    it("should refuse to revoke another store's session", async () => {
      repository.findSessionById.mockResolvedValue(
        buildSession({ storeId: 'store-2' }),
      );

      await expect(
        service.revokeSessionForStore('session-1', 'store-1'),
      ).rejects.toThrow(DASHBOARD_AUTH_ERRORS.SESSION_NOT_FOUND);
      expect(repository.revokeSession).not.toHaveBeenCalled();
    });

    it('should not distinguish a foreign session from a missing one', async () => {
      repository.findSessionById.mockResolvedValueOnce(null);
      const missing = await service
        .revokeSessionForStore('session-1', 'store-1')
        .catch((error: Error) => error.message);

      repository.findSessionById.mockResolvedValueOnce(
        buildSession({ storeId: 'store-2' }),
      );
      const foreign = await service
        .revokeSessionForStore('session-1', 'store-1')
        .catch((error: Error) => error.message);

      expect(missing).toBe(foreign);
    });
  });

  describe('listSessions', () => {
    it('should flag the caller’s own session', async () => {
      repository.findActiveSessions.mockResolvedValue([
        buildSession({ id: 'session-1' }),
        buildSession({ id: 'session-2' }),
      ]);

      const sessions = await service.listSessions('store-1', 'session-2');

      expect(sessions.find((s) => s.id === 'session-1')?.isCurrent).toBe(false);
      expect(sessions.find((s) => s.id === 'session-2')?.isCurrent).toBe(true);
    });

    it('should return an empty list when nothing is active', async () => {
      expect(await service.listSessions('store-1', 'session-1')).toEqual([]);
    });
  });

  describe('getSessionSummary', () => {
    it('should return the session for its own store', async () => {
      repository.findSessionById.mockResolvedValue(buildSession());

      const summary = await service.getSessionSummary('session-1', 'store-1');

      expect(summary.id).toBe('session-1');
      expect(summary.storeId).toBe('store-1');
    });

    it("should refuse to read another store's session", async () => {
      repository.findSessionById.mockResolvedValue(
        buildSession({ storeId: 'store-2' }),
      );

      await expect(
        service.getSessionSummary('session-1', 'store-1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
