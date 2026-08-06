import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { REWARD_RULE_CACHE } from '../constants';

@Injectable()
export class RewardRulesCacheService {
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
    } catch {}
  }

  async getProfileRules<T>(profileId: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_RULE_CACHE.PROFILE_RULES}${profileId}`),
    );
  }

  async setProfileRules(profileId: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(
        `${REWARD_RULE_CACHE.PROFILE_RULES}${profileId}`,
        data,
        REWARD_RULE_CACHE.TTL_LIST,
      ),
    );
  }

  async getItem<T>(id: string): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(`${REWARD_RULE_CACHE.ITEM}${id}`),
    );
  }

  async setItem(id: string, data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(`${REWARD_RULE_CACHE.ITEM}${id}`, data, REWARD_RULE_CACHE.TTL_ITEM),
    );
  }

  async getMilestones<T>(): Promise<T | null> {
    return this.safeGet(() =>
      this.redis.get<T>(REWARD_RULE_CACHE.MILESTONES),
    );
  }

  async setMilestones(data: unknown): Promise<void> {
    await this.safeWrite(() =>
      this.redis.set(REWARD_RULE_CACHE.MILESTONES, data, REWARD_RULE_CACHE.TTL_MILESTONES),
    );
  }

  async invalidateRule(ruleId: string, profileId: string): Promise<void> {
    await this.safeWrite(async () => {
      await this.redis.del(`${REWARD_RULE_CACHE.ITEM}${ruleId}`);
      await this.redis.del(`${REWARD_RULE_CACHE.PROFILE_RULES}${profileId}`);
      await this.redis.del(REWARD_RULE_CACHE.MILESTONES);
    });
  }

  async invalidateAll(): Promise<void> {
    await this.safeWrite(() =>
      this.redis.delPattern(`${REWARD_RULE_CACHE.PREFIX}*`),
    );
  }
}
