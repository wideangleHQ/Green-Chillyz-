import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { CHALLENGE_CACHE } from '../constants';

@Injectable()
export class ChallengeCacheService {
  constructor(private readonly redis: RedisService) {}

  private async safeGet<T>(fn: () => Promise<T | null>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private async safeWrite(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch {
      /* cache is advisory */
    }
  }

  // ─── Challenge list ───────────────────────────────

  async getList<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(CHALLENGE_CACHE.LIST));
  }

  async setList(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(CHALLENGE_CACHE.LIST, data, CHALLENGE_CACHE.TTL_LIST),
    );
  }

  async getActive<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(CHALLENGE_CACHE.ACTIVE));
  }

  async setActive(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(CHALLENGE_CACHE.ACTIVE, data, CHALLENGE_CACHE.TTL_ACTIVE),
    );
  }

  // ─── Single challenge ─────────────────────────────

  async getChallenge<T>(id: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${CHALLENGE_CACHE.ITEM}${id}`),
    );
  }

  async setChallenge(id: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${CHALLENGE_CACHE.ITEM}${id}`,
        data,
        CHALLENGE_CACHE.TTL_ITEM,
      ),
    );
  }

  // ─── Customer challenges ──────────────────────────

  async getCustomerChallenges<T>(userId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${CHALLENGE_CACHE.CUSTOMER}${userId}`),
    );
  }

  async setCustomerChallenges(userId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${CHALLENGE_CACHE.CUSTOMER}${userId}`,
        data,
        CHALLENGE_CACHE.TTL_CUSTOMER,
      ),
    );
  }

  // ─── Progress ─────────────────────────────────────

  async getProgress<T>(userId: string, challengeId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${CHALLENGE_CACHE.PROGRESS}${userId}:${challengeId}`),
    );
  }

  async setProgress(
    userId: string,
    challengeId: string,
    data: unknown,
  ): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${CHALLENGE_CACHE.PROGRESS}${userId}:${challengeId}`,
        data,
        CHALLENGE_CACHE.TTL_PROGRESS,
      ),
    );
  }

  // ─── Invalidation ─────────────────────────────────

  async invalidateChallenge(id: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${CHALLENGE_CACHE.ITEM}${id}`);
      await this.redis.del(CHALLENGE_CACHE.LIST);
      await this.redis.del(CHALLENGE_CACHE.ACTIVE);
    });
  }

  async invalidateCustomer(userId: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${CHALLENGE_CACHE.CUSTOMER}${userId}`);
      await this.redis.delPattern(`${CHALLENGE_CACHE.PROGRESS}${userId}:*`);
    });
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${CHALLENGE_CACHE.PREFIX}*`),
    );
  }
}
