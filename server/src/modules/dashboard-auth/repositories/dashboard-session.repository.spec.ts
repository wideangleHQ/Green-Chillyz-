import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardSessionRepository } from './dashboard-session.repository';
import { DASHBOARD_SESSION_REVOKE_REASONS } from '../constants';

describe('DashboardSessionRepository', () => {
  let repository: DashboardSessionRepository;
  let dashboardSession: Record<string, ReturnType<typeof vi.fn>>;
  let dashboardRefreshToken: Record<string, ReturnType<typeof vi.fn>>;
  let transaction: ReturnType<typeof vi.fn>;
  let prisma: Record<string, unknown>;

  beforeEach(() => {
    dashboardSession = {
      create: vi.fn().mockResolvedValue({ id: 'session-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    dashboardRefreshToken = {
      create: vi.fn().mockResolvedValue({ id: 'token-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    transaction = vi.fn(async (arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: unknown) => Promise<unknown>)(prisma)
        : Promise.all(arg as Promise<unknown>[]),
    );

    prisma = {
      dashboardSession,
      dashboardRefreshToken,
      $transaction: transaction,
    };

    repository = new DashboardSessionRepository(
      prisma as unknown as PrismaService,
    );
  });

  describe('createSessionWithToken', () => {
    it('should write the session and its first token in one transaction', async () => {
      await repository.createSessionWithToken(
        {
          storeId: 'store-1',
          ipAddress: '203.0.113.10',
          userAgent: 'vitest',
          deviceFingerprint: null,
          expiresAt: new Date(),
        },
        {
          storeId: 'store-1',
          tokenHash: 'hash-1',
          familyId: 'family-1',
          expiresAt: new Date(),
        },
      );

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(dashboardSession.create).toHaveBeenCalled();
      expect(dashboardRefreshToken.create).toHaveBeenCalled();
    });

    it('should attach the token to the session it just created', async () => {
      await repository.createSessionWithToken(
        {
          storeId: 'store-1',
          ipAddress: '203.0.113.10',
          userAgent: null,
          deviceFingerprint: null,
          expiresAt: new Date(),
        },
        {
          storeId: 'store-1',
          tokenHash: 'hash-1',
          familyId: 'family-1',
          expiresAt: new Date(),
        },
      );

      expect(dashboardRefreshToken.create.mock.calls[0][0].data.sessionId).toBe(
        'session-1',
      );
    });

    it('should mark the session active from creation', async () => {
      await repository.createSessionWithToken(
        {
          storeId: 'store-1',
          ipAddress: '203.0.113.10',
          userAgent: null,
          deviceFingerprint: null,
          expiresAt: new Date(),
        },
        {
          storeId: 'store-1',
          tokenHash: 'hash-1',
          familyId: 'family-1',
          expiresAt: new Date(),
        },
      );

      expect(
        dashboardSession.create.mock.calls[0][0].data.lastActivityAt,
      ).toBeInstanceOf(Date);
    });
  });

  describe('findActiveSessions', () => {
    it('should exclude revoked and expired sessions', async () => {
      await repository.findActiveSessions('store-1');

      const { where } = dashboardSession.findMany.mock.calls[0][0];
      expect(where.storeId).toBe('store-1');
      expect(where.revokedAt).toBeNull();
      expect(where.expiresAt.gt).toBeInstanceOf(Date);
    });

    it('should order by most recent activity', async () => {
      await repository.findActiveSessions('store-1');

      expect(dashboardSession.findMany.mock.calls[0][0].orderBy).toEqual({
        lastActivityAt: 'desc',
      });
    });
  });

  describe('findRefreshToken', () => {
    it('should look up by digest and include the session in the same query', async () => {
      await repository.findRefreshToken('hash-1');

      expect(dashboardRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: 'hash-1' },
        include: { session: true },
      });
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke, issue and touch atomically', async () => {
      await repository.rotateRefreshToken('token-1', {
        sessionId: 'session-1',
        storeId: 'store-1',
        tokenHash: 'hash-2',
        familyId: 'family-1',
        expiresAt: new Date(),
      });

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(transaction.mock.calls[0][0]).toHaveLength(3);
    });

    it('should keep the successor in the same family', async () => {
      await repository.rotateRefreshToken('token-1', {
        sessionId: 'session-1',
        storeId: 'store-1',
        tokenHash: 'hash-2',
        familyId: 'family-1',
        expiresAt: new Date(),
      });

      expect(dashboardRefreshToken.create.mock.calls[0][0].data.familyId).toBe(
        'family-1',
      );
    });

    it('should revoke the presented token', async () => {
      await repository.rotateRefreshToken('token-1', {
        sessionId: 'session-1',
        storeId: 'store-1',
        tokenHash: 'hash-2',
        familyId: 'family-1',
        expiresAt: new Date(),
      });

      expect(dashboardRefreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('touchSession', () => {
    it('should refuse to revive a revoked session', async () => {
      await repository.touchSession('session-1');

      expect(dashboardSession.updateMany.mock.calls[0][0].where).toEqual({
        id: 'session-1',
        revokedAt: null,
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke the session and its tokens together', async () => {
      await repository.revokeSession(
        'session-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT,
      );

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(dashboardSession.updateMany.mock.calls[0][0].data.revokedReason).toBe(
        'LOGOUT',
      );
      expect(dashboardRefreshToken.updateMany).toHaveBeenCalled();
    });

    it('should not overwrite an earlier revocation timestamp', async () => {
      await repository.revokeSession(
        'session-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT,
      );

      expect(dashboardSession.updateMany.mock.calls[0][0].where.revokedAt).toBeNull();
    });
  });

  describe('revokeAllSessions', () => {
    it('should short-circuit when the store has no live sessions', async () => {
      const revoked = await repository.revokeAllSessions(
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
      );

      expect(revoked).toEqual([]);
      expect(transaction).not.toHaveBeenCalled();
    });

    it('should revoke every live session in one transaction', async () => {
      dashboardSession.findMany.mockResolvedValue([
        { id: 'session-1' },
        { id: 'session-2' },
      ]);

      const revoked = await repository.revokeAllSessions(
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
      );

      expect(revoked).toEqual(['session-1', 'session-2']);
      expect(transaction).toHaveBeenCalledTimes(1);
    });

    it('should update by id set rather than one query per session', async () => {
      dashboardSession.findMany.mockResolvedValue([
        { id: 'session-1' },
        { id: 'session-2' },
      ]);

      await repository.revokeAllSessions(
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
      );

      expect(dashboardSession.updateMany).toHaveBeenCalledTimes(1);
      expect(dashboardSession.updateMany.mock.calls[0][0].where.id.in).toEqual([
        'session-1',
        'session-2',
      ]);
    });
  });

  describe('revokeTokenFamily', () => {
    it('should collect the family’s distinct sessions', async () => {
      dashboardRefreshToken.findMany.mockResolvedValue([
        { sessionId: 'session-1' },
      ]);

      const revoked = await repository.revokeTokenFamily('family-1');

      expect(revoked).toEqual(['session-1']);
      expect(dashboardRefreshToken.findMany.mock.calls[0][0].distinct).toEqual([
        'sessionId',
      ]);
    });

    it('should revoke the tokens and their sessions as a reuse', async () => {
      dashboardRefreshToken.findMany.mockResolvedValue([
        { sessionId: 'session-1' },
      ]);

      await repository.revokeTokenFamily('family-1');

      expect(dashboardSession.updateMany.mock.calls[0][0].data.revokedReason).toBe(
        'TOKEN_REUSE',
      );
    });
  });
});
