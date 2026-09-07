import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../providers/redis/redis.service';
import { DashboardStoreRepository } from '../repositories';
import { DASHBOARD_REDIS_PREFIXES } from '../constants';

export interface LockState {
  locked: boolean;
  lockedUntil: Date | null;
  failedAttempts: number;
}

/**
 * Two independent brakes on the login endpoint.
 *
 * The Redis window is keyed by IP and stops an attacker spraying codes at the
 * endpoint — it applies before any store is known, so it also covers codes
 * that match nothing. The per-store lock is persisted on the store row and
 * survives a Redis flush, so a targeted attack on one store's code cannot be
 * reset by restarting the cache.
 */
@Injectable()
export class DashboardLoginThrottleService {
  private readonly windowSeconds: number;
  private readonly maxWindowAttempts: number;
  private readonly maxFailedAttempts: number;
  private readonly lockDurationMinutes: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly storeRepository: DashboardStoreRepository,
  ) {
    this.windowSeconds = this.configService.get<number>(
      'dashboardAuth.loginRateLimitWindowSeconds',
      60,
    );
    this.maxWindowAttempts = this.configService.get<number>(
      'dashboardAuth.loginRateLimitMaxAttempts',
      10,
    );
    this.maxFailedAttempts = this.configService.get<number>(
      'dashboardAuth.maxFailedAttempts',
      5,
    );
    this.lockDurationMinutes = this.configService.get<number>(
      'dashboardAuth.lockDurationMinutes',
      15,
    );
  }

  /**
   * Counts this attempt and reports whether the caller has exceeded the
   * window. INCR + EXPIRE keeps the counter correct under concurrent logins;
   * the TTL is only set on the first hit so the window is fixed, not sliding
   * forward with every request an attacker makes.
   */
  async consumeAttempt(ipAddress: string): Promise<boolean> {
    const key = `${DASHBOARD_REDIS_PREFIXES.LOGIN_ATTEMPTS}${ipAddress}`;
    const client = this.redis.getClient();

    try {
      const attempts = await client.incr(key);
      if (attempts === 1) {
        await client.expire(key, this.windowSeconds);
      }
      return attempts <= this.maxWindowAttempts;
    } catch {
      // Redis unavailable — fail open so login is not blocked when cache is down
      return true;
    }
  }

  async resetAttempts(ipAddress: string): Promise<void> {
    await this.redis.del(
      `${DASHBOARD_REDIS_PREFIXES.LOGIN_ATTEMPTS}${ipAddress}`,
    );
  }

  isLocked(lockedUntil: Date | null): boolean {
    return lockedUntil !== null && lockedUntil.getTime() > Date.now();
  }

  /**
   * Records a failure against the store and locks it once the threshold is
   * crossed. Returns the resulting state so the caller can publish it.
   */
  async registerFailure(storeId: string): Promise<LockState> {
    const { dashboardFailedAttempts } =
      await this.storeRepository.incrementFailedAttempts(storeId);

    if (dashboardFailedAttempts < this.maxFailedAttempts) {
      return {
        locked: false,
        lockedUntil: null,
        failedAttempts: dashboardFailedAttempts,
      };
    }

    const lockedUntil = new Date(
      Date.now() + this.lockDurationMinutes * 60 * 1000,
    );
    await this.storeRepository.applyLock(storeId, lockedUntil);

    return {
      locked: true,
      lockedUntil,
      failedAttempts: dashboardFailedAttempts,
    };
  }

  /** A correct code clears the counter — locks punish failure, not history. */
  async registerSuccess(storeId: string, ipAddress: string): Promise<void> {
    await Promise.all([
      this.storeRepository.recordSuccessfulLogin(storeId, ipAddress),
      this.resetAttempts(ipAddress),
    ]);
  }
}
