import { Injectable } from '@nestjs/common';
import { CoinRuleType } from '@prisma/client';
import { RedisService } from '../../../providers/redis/redis.service';
import { COIN_ECONOMY_CACHE } from '../constants';

/**
 * Every read is best-effort: a Redis outage degrades the engine to direct DB
 * reads rather than failing a customer's earn. Writes swallow errors for the
 * same reason.
 */
@Injectable()
export class CoinEconomyCacheService {
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

  // ─── Rules ────────────────────────────────────────

  async getRules<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(COIN_ECONOMY_CACHE.RULES));
  }

  async setRules(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(COIN_ECONOMY_CACHE.RULES, data, COIN_ECONOMY_CACHE.TTL_RULES),
    );
  }

  async getRule<T>(ruleId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${COIN_ECONOMY_CACHE.RULE_ITEM}${ruleId}`),
    );
  }

  async setRule(ruleId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.RULE_ITEM}${ruleId}`,
        data,
        COIN_ECONOMY_CACHE.TTL_RULE_ITEM,
      ),
    );
  }

  async getRuleByType<T>(ruleType: CoinRuleType): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${COIN_ECONOMY_CACHE.RULE_BY_TYPE}${ruleType}`),
    );
  }

  async setRuleByType(ruleType: CoinRuleType, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.RULE_BY_TYPE}${ruleType}`,
        data,
        COIN_ECONOMY_CACHE.TTL_RULE_ITEM,
      ),
    );
  }

  async getGameRules<T>(): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(COIN_ECONOMY_CACHE.GAME_RULES));
  }

  async setGameRules(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        COIN_ECONOMY_CACHE.GAME_RULES,
        data,
        COIN_ECONOMY_CACHE.TTL_GAME_RULES,
      ),
    );
  }

  // ─── Limits ───────────────────────────────────────

  async getLimits<T>(ruleId: string | null): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${COIN_ECONOMY_CACHE.LIMITS}${ruleId ?? 'global'}`),
    );
  }

  async setLimits(ruleId: string | null, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.LIMITS}${ruleId ?? 'global'}`,
        data,
        COIN_ECONOMY_CACHE.TTL_LIMITS,
      ),
    );
  }

  // ─── Multipliers ──────────────────────────────────

  async getMultipliers<T>(scopeKey: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${COIN_ECONOMY_CACHE.MULTIPLIERS}${scopeKey}`),
    );
  }

  async setMultipliers(scopeKey: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.MULTIPLIERS}${scopeKey}`,
        data,
        COIN_ECONOMY_CACHE.TTL_MULTIPLIERS,
      ),
    );
  }

  // ─── Cooldown ─────────────────────────────────────

  /** Written with the cooldown as TTL, so expiry is the cooldown itself. */
  async setCooldown(
    userId: string,
    ruleId: string,
    seconds: number,
    availableAtIso: string,
  ): Promise<void> {
    if (seconds <= 0) return;
    await this.safeWrite(() =>
      this.redis.set(this.cooldownKey(userId, ruleId), availableAtIso, seconds),
    );
  }

  async getCooldownTtl(userId: string, ruleId: string): Promise<number> {
    const ttl = await this.safeGet(async () =>
      this.redis.ttl(this.cooldownKey(userId, ruleId)),
    );
    return ttl !== null && ttl > 0 ? ttl : 0;
  }

  async clearCooldown(userId: string, ruleId: string): Promise<void> {
    await this.safeWrite(() => this.redis.del(this.cooldownKey(userId, ruleId)));
  }

  // ─── Daily markers ────────────────────────────────

  /** Day-scoped markers for the two once-a-day rules the app polls hardest. */
  async getDailyLoginMarker(userId: string, dayKey: string): Promise<boolean> {
    const value = await this.safeGet(() =>
      this.redis.get<string>(`${COIN_ECONOMY_CACHE.DAILY_LOGIN}${userId}:${dayKey}`),
    );
    return value !== null;
  }

  async setDailyLoginMarker(userId: string, dayKey: string): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.DAILY_LOGIN}${userId}:${dayKey}`,
        '1',
        COIN_ECONOMY_CACHE.TTL_MARKER,
      ),
    );
  }

  async getCheckInMarker(userId: string, dayKey: string): Promise<boolean> {
    const value = await this.safeGet(() =>
      this.redis.get<string>(`${COIN_ECONOMY_CACHE.CHECK_IN}${userId}:${dayKey}`),
    );
    return value !== null;
  }

  async setCheckInMarker(userId: string, dayKey: string): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.CHECK_IN}${userId}:${dayKey}`,
        '1',
        COIN_ECONOMY_CACHE.TTL_MARKER,
      ),
    );
  }

  // ─── Usage counters ───────────────────────────────

  async getUsage<T>(key: string): Promise<T | null> {
    return this.safeGet(() => this.redis.get<T>(`${COIN_ECONOMY_CACHE.USAGE}${key}`));
  }

  async setUsage(key: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${COIN_ECONOMY_CACHE.USAGE}${key}`,
        data,
        COIN_ECONOMY_CACHE.TTL_USAGE,
      ),
    );
  }

  async invalidateUsage(userId: string): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${COIN_ECONOMY_CACHE.USAGE}${userId}:*`),
    );
  }

  // ─── Invalidation ─────────────────────────────────

  /** A rule change can shift lists, limits and multipliers, so drop them all. */
  async invalidateRule(ruleId: string, ruleType?: CoinRuleType): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${COIN_ECONOMY_CACHE.RULE_ITEM}${ruleId}`);
      await this.redis.del(COIN_ECONOMY_CACHE.RULES);
      await this.redis.del(COIN_ECONOMY_CACHE.GAME_RULES);
      await this.redis.del(`${COIN_ECONOMY_CACHE.LIMITS}${ruleId}`);
      if (ruleType) {
        await this.redis.del(`${COIN_ECONOMY_CACHE.RULE_BY_TYPE}${ruleType}`);
      }
    });
  }

  async invalidateLimits(ruleId: string | null): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${COIN_ECONOMY_CACHE.LIMITS}${ruleId ?? 'global'}`);
      await this.redis.del(COIN_ECONOMY_CACHE.RULES);
    });
  }

  async invalidateMultipliers(): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${COIN_ECONOMY_CACHE.MULTIPLIERS}*`),
    );
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.delPattern(`${COIN_ECONOMY_CACHE.PREFIX}*`);
      await this.redis.del(COIN_ECONOMY_CACHE.RULES);
    });
  }

  private cooldownKey(userId: string, ruleId: string): string {
    return `${COIN_ECONOMY_CACHE.COOLDOWN}${userId}:${ruleId}`;
  }
}
