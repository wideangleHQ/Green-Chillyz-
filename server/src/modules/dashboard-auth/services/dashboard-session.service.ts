import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DashboardSession } from '@prisma/client';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_SESSION_REVOKE_REASONS,
  DashboardSessionRevokeReason,
} from '../constants';
import {
  DashboardRequestContext,
  DashboardSessionData,
  DashboardSessionSummary,
} from '../interfaces';
import { DashboardSessionRepository } from '../repositories';
import { DashboardCacheService } from './dashboard-cache.service';
import { IssuedRefreshToken } from './dashboard-token.service';

export interface RotationResult {
  session: DashboardSession;
  currentTokenId: string;
  familyId: string;
}

/**
 * Lifecycle of a dashboard session: create, validate, touch, revoke.
 *
 * Reads go to Redis first and fall back to Postgres, repopulating the cache —
 * a cache flush costs latency, never a logout.
 */
@Injectable()
export class DashboardSessionService {
  private readonly logger = new Logger(DashboardSessionService.name);

  constructor(
    private readonly sessionRepository: DashboardSessionRepository,
    private readonly cache: DashboardCacheService,
  ) {}

  async createSession(
    storeId: string,
    context: DashboardRequestContext,
    refreshToken: IssuedRefreshToken,
  ): Promise<DashboardSession> {
    const session = await this.sessionRepository.createSessionWithToken(
      {
        storeId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceFingerprint: context.deviceFingerprint,
        expiresAt: refreshToken.expiresAt,
      },
      {
        storeId,
        tokenHash: refreshToken.tokenHash,
        familyId: refreshToken.familyId,
        expiresAt: refreshToken.expiresAt,
      },
    );

    await this.cache.setSession(
      this.toSessionData(session),
      this.ttlSeconds(session.expiresAt),
    );

    return session;
  }

  /**
   * Guard path. Redis answers the common case; a miss falls through to the
   * database so a revoked session can never be resurrected by an empty cache.
   */
  async assertActiveSession(sessionId: string): Promise<DashboardSessionData> {
    const cached = await this.cache.getSession(sessionId);
    if (cached) {
      if (new Date(cached.expiresAt).getTime() <= Date.now()) {
        await this.cache.deleteSession(sessionId, cached.storeId);
        throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_EXPIRED);
      }
      return cached;
    }

    const session = await this.sessionRepository.findSessionById(sessionId);
    if (!session) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_NOT_FOUND);
    }
    if (session.revokedAt) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_REVOKED);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_EXPIRED);
    }

    const data = this.toSessionData(session);
    await this.cache.setSession(data, this.ttlSeconds(session.expiresAt));
    return data;
  }

  /**
   * Best-effort activity tracking. A failed touch must never fail the request
   * it was decorating, so it is logged and swallowed.
   */
  async touch(sessionId: string): Promise<void> {
    try {
      await Promise.all([
        this.cache.touchSession(sessionId),
        this.sessionRepository.touchSession(sessionId),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to record activity for dashboard session ${sessionId}: ${message}`,
      );
    }
  }

  /**
   * Validates a presented refresh token and reports what to rotate.
   *
   * A token that was already revoked is the signature of a leak: the holder is
   * replaying a value the legitimate client has since exchanged. The entire
   * family and its session are burned rather than merely rejected.
   */
  async validateRefreshToken(tokenHash: string): Promise<RotationResult> {
    const stored = await this.sessionRepository.findRefreshToken(tokenHash);

    if (!stored) {
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.INVALID_REFRESH_TOKEN,
      );
    }

    if (stored.revokedAt) {
      this.logger.warn(
        `Dashboard refresh token reuse detected for family ${stored.familyId}, store ${stored.storeId}`,
      );
      const sessionIds = await this.sessionRepository.revokeTokenFamily(
        stored.familyId,
      );
      await Promise.all(
        sessionIds.map((id) => this.cache.deleteSession(id, stored.storeId)),
      );
      await this.cache.incrementTokenVersion(stored.storeId);
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.TOKEN_REUSE_DETECTED,
      );
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.INVALID_REFRESH_TOKEN,
      );
    }

    if (stored.session.revokedAt) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_REVOKED);
    }

    if (stored.session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_EXPIRED);
    }

    return {
      session: stored.session,
      currentTokenId: stored.id,
      familyId: stored.familyId,
    };
  }

  async rotate(
    rotation: RotationResult,
    nextToken: IssuedRefreshToken,
  ): Promise<void> {
    await this.sessionRepository.rotateRefreshToken(rotation.currentTokenId, {
      sessionId: rotation.session.id,
      storeId: rotation.session.storeId,
      tokenHash: nextToken.tokenHash,
      familyId: rotation.familyId,
      expiresAt: nextToken.expiresAt,
    });

    await this.cache.touchSession(rotation.session.id);
  }

  async revokeSession(
    sessionId: string,
    storeId: string,
    reason: DashboardSessionRevokeReason,
  ): Promise<void> {
    await this.sessionRepository.revokeSession(sessionId, reason);
    await this.cache.deleteSession(sessionId, storeId);
  }

  /**
   * Revokes every session for a store and bumps the token version, so access
   * tokens already in flight stop working immediately instead of surviving
   * until they expire.
   */
  async revokeAllSessions(
    storeId: string,
    reason: DashboardSessionRevokeReason = DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
  ): Promise<string[]> {
    const sessionIds = await this.sessionRepository.revokeAllSessions(
      storeId,
      reason,
    );

    await this.cache.deleteStoreSessions(storeId);
    await this.cache.incrementTokenVersion(storeId);

    return sessionIds;
  }

  /**
   * Ownership is enforced by scoping the lookup to the caller's store: a
   * session belonging to another store is reported as not found, never as
   * forbidden, so ids cannot be probed.
   */
  async revokeSessionForStore(
    sessionId: string,
    storeId: string,
  ): Promise<void> {
    const session = await this.sessionRepository.findSessionById(sessionId);

    if (!session || session.storeId !== storeId) {
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.SESSION_NOT_FOUND,
      );
    }

    await this.revokeSession(
      sessionId,
      storeId,
      DASHBOARD_SESSION_REVOKE_REASONS.MANUAL_REVOKE,
    );
  }

  async listSessions(
    storeId: string,
    currentSessionId: string,
  ): Promise<DashboardSessionSummary[]> {
    const sessions = await this.sessionRepository.findActiveSessions(storeId);

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceFingerprint: session.deviceFingerprint,
      issuedAt: session.issuedAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async getSessionSummary(
    sessionId: string,
    storeId: string,
  ): Promise<DashboardSessionSummary & { storeId: string }> {
    const session = await this.sessionRepository.findSessionById(sessionId);

    if (!session || session.storeId !== storeId) {
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.SESSION_NOT_FOUND);
    }

    return {
      id: session.id,
      storeId: session.storeId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceFingerprint: session.deviceFingerprint,
      issuedAt: session.issuedAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isCurrent: true,
    };
  }

  private toSessionData(session: DashboardSession): DashboardSessionData {
    return {
      sessionId: session.id,
      storeId: session.storeId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceFingerprint: session.deviceFingerprint,
      issuedAt: session.issuedAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  /** Cache entry never outlives the session it mirrors. */
  private ttlSeconds(expiresAt: Date): number {
    const seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    return seconds > 0 ? seconds : 1;
  }
}
