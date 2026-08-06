import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../providers/redis/redis.service';
import { CUSTOMER_JOURNEY_CACHE } from '../constants';

@Injectable()
export class CustomerJourneyCacheService {
  constructor(private readonly redis: RedisService) {}

  getActive<T>(): Promise<T | null> {
    return this.redis.get<T>(CUSTOMER_JOURNEY_CACHE.ACTIVE);
  }

  setActive(value: unknown): Promise<void> {
    return this.redis.set(
      CUSTOMER_JOURNEY_CACHE.ACTIVE,
      value,
      CUSTOMER_JOURNEY_CACHE.TTL_ACTIVE,
    );
  }

  getTriggers<T>(triggerType: string): Promise<T | null> {
    return this.redis.get<T>(`${CUSTOMER_JOURNEY_CACHE.TRIGGERS}${triggerType}`);
  }

  setTriggers(triggerType: string, value: unknown): Promise<void> {
    return this.redis.set(
      `${CUSTOMER_JOURNEY_CACHE.TRIGGERS}${triggerType}`,
      value,
      CUSTOMER_JOURNEY_CACHE.TTL_TRIGGERS,
    );
  }

  getCustomerState<T>(userId: string): Promise<T | null> {
    return this.redis.get<T>(`${CUSTOMER_JOURNEY_CACHE.STATE}${userId}`);
  }

  setCustomerState(userId: string, value: unknown): Promise<void> {
    return this.redis.set(
      `${CUSTOMER_JOURNEY_CACHE.STATE}${userId}`,
      value,
      CUSTOMER_JOURNEY_CACHE.TTL_STATE,
    );
  }

  async invalidateAll(): Promise<void> {
    await this.redis.del(CUSTOMER_JOURNEY_CACHE.ACTIVE);
    await this.redis.delPattern(`${CUSTOMER_JOURNEY_CACHE.TRIGGERS}*`);
    await this.redis.delPattern(`${CUSTOMER_JOURNEY_CACHE.RULES}*`);
  }

  invalidateCustomer(userId: string): Promise<void> {
    return this.redis.del(`${CUSTOMER_JOURNEY_CACHE.STATE}${userId}`);
  }
}
