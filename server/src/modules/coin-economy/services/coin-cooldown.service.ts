import { Injectable } from '@nestjs/common';
import { CoinUsageRepository } from '../repositories';
import { CoinEconomyCacheService } from '../cache';
import { CooldownState } from '../interfaces';

/**
 * Cooldowns live in Redis with the cooldown itself as the TTL. Redis is a
 * cache, not the record — when a key is missing the last wallet grant is
 * consulted, so a flushed Redis cannot hand out a second grant early.
 */
@Injectable()
export class CoinCooldownService {
  constructor(
    private readonly cache: CoinEconomyCacheService,
    private readonly usageRepo: CoinUsageRepository,
  ) {}

  async check(
    userId: string,
    ruleId: string,
    cooldownSeconds: number,
    now: Date,
  ): Promise<CooldownState> {
    if (cooldownSeconds <= 0) {
      return { active: false, secondsRemaining: 0, availableAt: null };
    }

    const ttl = await this.cache.getCooldownTtl(userId, ruleId);
    if (ttl > 0) {
      return {
        active: true,
        secondsRemaining: ttl,
        availableAt: new Date(now.getTime() + ttl * 1000),
      };
    }

    const lastGrantAt = await this.usageRepo.findLastGrantAt(userId, ruleId);
    if (!lastGrantAt) {
      return { active: false, secondsRemaining: 0, availableAt: null };
    }

    const availableAt = new Date(lastGrantAt.getTime() + cooldownSeconds * 1000);
    const remainingMs = availableAt.getTime() - now.getTime();
    if (remainingMs <= 0) {
      return { active: false, secondsRemaining: 0, availableAt: null };
    }

    const secondsRemaining = Math.ceil(remainingMs / 1000);
    // Repopulate so the next check is a single Redis round trip.
    await this.cache.setCooldown(
      userId,
      ruleId,
      secondsRemaining,
      availableAt.toISOString(),
    );

    return { active: true, secondsRemaining, availableAt };
  }

  async start(
    userId: string,
    ruleId: string,
    cooldownSeconds: number,
    now: Date,
  ): Promise<void> {
    if (cooldownSeconds <= 0) return;
    const availableAt = new Date(now.getTime() + cooldownSeconds * 1000);
    await this.cache.setCooldown(
      userId,
      ruleId,
      cooldownSeconds,
      availableAt.toISOString(),
    );
  }

  async clear(userId: string, ruleId: string): Promise<void> {
    await this.cache.clearCooldown(userId, ruleId);
  }
}
