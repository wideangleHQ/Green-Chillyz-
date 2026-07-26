import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

import {
  appConfig,
  databaseConfig,
  redisConfig,
  queueConfig,
  storageConfig,
  authConfig,
  mailConfig,
  throttleConfig,
  envValidationSchema,
} from './config';

import { DatabaseModule } from './database/database.module';
import { RedisModule } from './providers/redis/redis.module';
import { QueueModule } from './providers/queue/queue.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { StoreModule } from './modules/store/store.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RewardModule } from './modules/reward/reward.module';
import { GameModule } from './modules/game/game.module';
import { CustomerBootstrapModule } from './modules/customer-bootstrap/customer-bootstrap.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';

import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        queueConfig,
        storageConfig,
        authConfig,
        mailConfig,
        throttleConfig,
      ],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),

    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10),
          },
        ],
      }),
    }),

    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    DatabaseModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    StoreModule,
    WalletModule,
    RewardModule,
    GameModule,
    CustomerBootstrapModule,
    RewardsModule,
    NotificationModule,
    AuditModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
