import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const MAX_RETRY_ATTEMPTS = 10;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const tlsEnabled = this.configService.get<boolean>('redis.tls');
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db'),
      tls: tlsEnabled ? {} : undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > MAX_RETRY_ATTEMPTS) {
          this.logger.error(
            `Redis reconnect gave up after ${MAX_RETRY_ATTEMPTS} attempts`,
          );
          return null;
        }
        return Math.min(times * 200, 5000);
      },
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: NodeJS.ErrnoException) => {
      this.logger.error(
        `Redis error [${err.code ?? 'UNKNOWN'}]: ${err.message}`,
      );
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (err) {
      this.logger.warn(
        `Redis get failed for key "${key}": ${(err as Error).message}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger.warn(
        `Redis set failed for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(
        `Redis del failed for key "${key}": ${(err as Error).message}`,
      );
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.warn(
        `Redis delPattern failed for pattern "${pattern}": ${(err as Error).message}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      this.logger.warn(
        `Redis exists failed for key "${key}": ${(err as Error).message}`,
      );
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (err) {
      this.logger.warn(
        `Redis ttl failed for key "${key}": ${(err as Error).message}`,
      );
      return -1;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }
}
