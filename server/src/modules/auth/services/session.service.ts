import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REDIS_PREFIXES, SESSION_TTL_SECONDS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  userId: string;
  deviceId: string | null;
  ipAddress: string;
  createdAt: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly redisService: RedisService) {}

  async createSession(
    userId: string,
    deviceId: string | null,
    ipAddress: string,
  ): Promise<string> {
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      userId,
      deviceId,
      ipAddress,
      createdAt: new Date().toISOString(),
    };

    await this.redisService.set(
      `${REDIS_PREFIXES.SESSION}${sessionId}`,
      sessionData,
      SESSION_TTL_SECONDS,
    );

    await this.addUserSession(userId, sessionId);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.redisService.get<SessionData>(
      `${REDIS_PREFIXES.SESSION}${sessionId}`,
    );
  }

  async destroySession(sessionId: string, userId: string): Promise<void> {
    await this.redisService.del(`${REDIS_PREFIXES.SESSION}${sessionId}`);
    await this.removeUserSession(userId, sessionId);
  }

  async destroyAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.getUserSessions(userId);

    for (const sessionId of sessionIds) {
      await this.redisService.del(`${REDIS_PREFIXES.SESSION}${sessionId}`);
    }

    await this.redisService.del(`${REDIS_PREFIXES.USER_SESSIONS}${userId}`);
  }

  async getTokenVersion(userId: string): Promise<number> {
    const version = await this.redisService.get<number>(
      `${REDIS_PREFIXES.TOKEN_VERSION}${userId}`,
    );
    return version ?? 0;
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    const current = await this.getTokenVersion(userId);
    const next = current + 1;
    await this.redisService.set(
      `${REDIS_PREFIXES.TOKEN_VERSION}${userId}`,
      next,
    );
    return next;
  }

  async getPermissionsVersion(userId: string): Promise<number> {
    const version = await this.redisService.get<number>(
      `${REDIS_PREFIXES.PERMISSIONS_VERSION}${userId}`,
    );
    return version ?? 0;
  }

  async incrementPermissionsVersion(userId: string): Promise<number> {
    const current = await this.getPermissionsVersion(userId);
    const next = current + 1;
    await this.redisService.set(
      `${REDIS_PREFIXES.PERMISSIONS_VERSION}${userId}`,
      next,
    );
    return next;
  }

  private async addUserSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const key = `${REDIS_PREFIXES.USER_SESSIONS}${userId}`;
    const sessions = await this.getUserSessions(userId);
    sessions.push(sessionId);
    await this.redisService.set(key, sessions, SESSION_TTL_SECONDS);
  }

  private async removeUserSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const key = `${REDIS_PREFIXES.USER_SESSIONS}${userId}`;
    const sessions = await this.getUserSessions(userId);
    const filtered = sessions.filter((s) => s !== sessionId);
    if (filtered.length > 0) {
      await this.redisService.set(key, filtered, SESSION_TTL_SECONDS);
    } else {
      await this.redisService.del(key);
    }
  }

  private async getUserSessions(userId: string): Promise<string[]> {
    const sessions = await this.redisService.get<string[]>(
      `${REDIS_PREFIXES.USER_SESSIONS}${userId}`,
    );
    return sessions ?? [];
  }
}
