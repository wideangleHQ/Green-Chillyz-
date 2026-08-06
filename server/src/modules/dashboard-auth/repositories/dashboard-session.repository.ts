import { Injectable } from '@nestjs/common';
import { DashboardRefreshToken, DashboardSession } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardSessionRevokeReason } from '../constants';

export interface CreateDashboardSessionInput {
  storeId: string;
  ipAddress: string;
  userAgent: string | null;
  deviceFingerprint: string | null;
  expiresAt: Date;
}

export interface CreateDashboardRefreshTokenInput {
  sessionId: string;
  storeId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

/**
 * Durable persistence for dashboard sessions and their rotating refresh
 * tokens. Redis caches sessions; this is the record of truth.
 */
@Injectable()
export class DashboardSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A login writes the session and its first refresh token together — an
   * orphan session with no token would be an unusable, unrevocable row.
   */
  async createSessionWithToken(
    session: CreateDashboardSessionInput,
    token: Omit<CreateDashboardRefreshTokenInput, 'sessionId'>,
  ): Promise<DashboardSession> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.dashboardSession.create({
        data: {
          storeId: session.storeId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          deviceFingerprint: session.deviceFingerprint,
          lastActivityAt: new Date(),
          expiresAt: session.expiresAt,
        },
      });

      await tx.dashboardRefreshToken.create({
        data: {
          sessionId: created.id,
          storeId: token.storeId,
          tokenHash: token.tokenHash,
          familyId: token.familyId,
          expiresAt: token.expiresAt,
        },
      });

      return created;
    });
  }

  async findSessionById(sessionId: string): Promise<DashboardSession | null> {
    return this.prisma.dashboardSession.findUnique({
      where: { id: sessionId },
    });
  }

  async findActiveSessions(storeId: string): Promise<DashboardSession[]> {
    return this.prisma.dashboardSession.findMany({
      where: { storeId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async findRefreshToken(
    tokenHash: string,
  ): Promise<(DashboardRefreshToken & { session: DashboardSession }) | null> {
    return this.prisma.dashboardRefreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  }

  /**
   * Rotation: revoke the presented token and mint its successor in the same
   * family, in one transaction. A crash between the two would either strand
   * the caller without a token or leave two live tokens — both unacceptable.
   */
  async rotateRefreshToken(
    currentTokenId: string,
    next: CreateDashboardRefreshTokenInput,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.dashboardRefreshToken.update({
        where: { id: currentTokenId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.dashboardRefreshToken.create({
        data: {
          sessionId: next.sessionId,
          storeId: next.storeId,
          tokenHash: next.tokenHash,
          familyId: next.familyId,
          expiresAt: next.expiresAt,
        },
      }),
      this.prisma.dashboardSession.update({
        where: { id: next.sessionId },
        data: { lastActivityAt: new Date() },
      }),
    ]);
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.dashboardSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { lastActivityAt: new Date() },
    });
  }

  async revokeSession(
    sessionId: string,
    reason: DashboardSessionRevokeReason,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.dashboardSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: now, revokedReason: reason },
      }),
      this.prisma.dashboardRefreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  async revokeAllSessions(
    storeId: string,
    reason: DashboardSessionRevokeReason,
  ): Promise<string[]> {
    const now = new Date();

    const sessions = await this.prisma.dashboardSession.findMany({
      where: { storeId, revokedAt: null },
      select: { id: true },
    });

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((session) => session.id);

    await this.prisma.$transaction([
      this.prisma.dashboardSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { revokedAt: now, revokedReason: reason },
      }),
      this.prisma.dashboardRefreshToken.updateMany({
        where: { sessionId: { in: sessionIds }, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return sessionIds;
  }

  /** Burns a leaked token's whole lineage, and the session behind it. */
  async revokeTokenFamily(familyId: string): Promise<string[]> {
    const now = new Date();

    const tokens = await this.prisma.dashboardRefreshToken.findMany({
      where: { familyId },
      select: { sessionId: true },
      distinct: ['sessionId'],
    });

    const sessionIds = tokens.map((token) => token.sessionId);

    await this.prisma.$transaction([
      this.prisma.dashboardRefreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.dashboardSession.updateMany({
        where: { id: { in: sessionIds }, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'TOKEN_REUSE' },
      }),
    ]);

    return sessionIds;
  }
}
