import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import {
  DASHBOARD_CACHE_TTL,
  DASHBOARD_REDIS_PREFIXES,
} from '../constants';
import { DashboardSessionData, DashboardStoreContext } from '../interfaces';

/**
 * Redis surface for dashboard IAM.
 *
 * Sessions live here so the guard path costs one Redis read instead of a
 * database round trip; Postgres stays authoritative. Store context is cached
 * separately with a short TTL because it changes on store edits, not logins.
 */
@Injectable()
export class DashboardCacheService {
  constructor(private readonly redis: RedisService) {}

  async setSession(
    session: DashboardSessionData,
    ttlSeconds: number = DASHBOARD_CACHE_TTL.SESSION_SECONDS,
  ): Promise<void> {
    await this.redis.set(
      `${DASHBOARD_REDIS_PREFIXES.SESSION}${session.sessionId}`,
      session,
      ttlSeconds,
    );
    await this.addStoreSession(session.storeId, session.sessionId, ttlSeconds);
  }

  async getSession(sessionId: string): Promise<DashboardSessionData | null> {
    return this.redis.get<DashboardSessionData>(
      `${DASHBOARD_REDIS_PREFIXES.SESSION}${sessionId}`,
    );
  }

  async touchSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return;
    }

    const ttl = await this.redis.ttl(
      `${DASHBOARD_REDIS_PREFIXES.SESSION}${sessionId}`,
    );

    await this.redis.set(
      `${DASHBOARD_REDIS_PREFIXES.SESSION}${sessionId}`,
      { ...session, lastActivityAt: new Date().toISOString() },
      ttl > 0 ? ttl : DASHBOARD_CACHE_TTL.SESSION_SECONDS,
    );
  }

  async deleteSession(sessionId: string, storeId: string): Promise<void> {
    await this.redis.del(`${DASHBOARD_REDIS_PREFIXES.SESSION}${sessionId}`);
    await this.removeStoreSession(storeId, sessionId);
  }

  async deleteStoreSessions(storeId: string): Promise<void> {
    const sessionIds = await this.getStoreSessions(storeId);

    await Promise.all(
      sessionIds.map((sessionId) =>
        this.redis.del(`${DASHBOARD_REDIS_PREFIXES.SESSION}${sessionId}`),
      ),
    );

    await this.redis.del(
      `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}${storeId}`,
    );
  }

  async getStoreSessions(storeId: string): Promise<string[]> {
    const sessions = await this.redis.get<string[]>(
      `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}${storeId}`,
    );
    return sessions ?? [];
  }

  async getStoreContext(
    storeId: string,
  ): Promise<DashboardStoreContext | null> {
    return this.redis.get<DashboardStoreContext>(
      `${DASHBOARD_REDIS_PREFIXES.STORE_CONTEXT}${storeId}`,
    );
  }

  async setStoreContext(context: DashboardStoreContext): Promise<void> {
    await this.redis.set(
      `${DASHBOARD_REDIS_PREFIXES.STORE_CONTEXT}${context.storeId}`,
      context,
      DASHBOARD_CACHE_TTL.STORE_CONTEXT_SECONDS,
    );
  }

  async invalidateStoreContext(storeId: string): Promise<void> {
    await this.redis.del(
      `${DASHBOARD_REDIS_PREFIXES.STORE_CONTEXT}${storeId}`,
    );
  }

  /**
   * Bumped on logout-all and code rotation. Access tokens carry the version
   * they were minted under, so raising it strands every outstanding token
   * without waiting for it to expire.
   */
  async getTokenVersion(storeId: string): Promise<number> {
    const version = await this.redis.get<number>(
      `${DASHBOARD_REDIS_PREFIXES.TOKEN_VERSION}${storeId}`,
    );
    return version ?? 0;
  }

  async incrementTokenVersion(storeId: string): Promise<number> {
    const next = await this.redis
      .getClient()
      .incr(`${DASHBOARD_REDIS_PREFIXES.TOKEN_VERSION}${storeId}`);
    return next;
  }

  private async addStoreSession(
    storeId: string,
    sessionId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}${storeId}`;
    const sessions = await this.getStoreSessions(storeId);

    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId);
    }

    await this.redis.set(key, sessions, ttlSeconds);
  }

  private async removeStoreSession(
    storeId: string,
    sessionId: string,
  ): Promise<void> {
    const key = `${DASHBOARD_REDIS_PREFIXES.STORE_SESSIONS}${storeId}`;
    const remaining = (await this.getStoreSessions(storeId)).filter(
      (id) => id !== sessionId,
    );

    if (remaining.length > 0) {
      await this.redis.set(key, remaining, DASHBOARD_CACHE_TTL.SESSION_SECONDS);
    } else {
      await this.redis.del(key);
    }
  }
}
