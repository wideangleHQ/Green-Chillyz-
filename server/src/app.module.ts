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
  dashboardAuthConfig,
  mailConfig,
  throttleConfig,
  envValidationSchema,
} from './config';

import { DatabaseModule } from './database/database.module';
import { RedisModule } from './providers/redis/redis.module';
import { QueueModule } from './providers/queue/queue.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardAuthModule } from './modules/dashboard-auth/dashboard-auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StoreModule } from './modules/store/store.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RewardModule } from './modules/reward/reward.module';
import { GameModule } from './modules/game/game.module';
import { CustomerBootstrapModule } from './modules/customer-bootstrap/customer-bootstrap.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { MenuModule } from './modules/menu/menu.module';
import { RewardProfileModule } from './modules/reward-profile/reward-profile.module';
import { RewardRulesModule } from './modules/reward-rules/reward-rules.module';
import { RewardAssignmentModule } from './modules/reward-assignment/reward-assignment.module';
import { RewardOverridesModule } from './modules/reward-overrides/reward-overrides.module';
import { CoinEconomyModule } from './modules/coin-economy/coin-economy.module';
import { DashboardRewardsModule } from './modules/dashboard-rewards/dashboard-rewards.module';
import { RewardResolutionModule } from './modules/reward-resolution/reward-resolution.module';
import { ChallengesModule } from './modules/challenges/challenges.module';

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
        dashboardAuthConfig,
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
    DashboardAuthModule,
    StoreModule,
    WalletModule,
    RewardModule,
    GameModule,
    CustomerBootstrapModule,
    RewardsModule,
    NotificationModule,
    AuditModule,
    DashboardModule,
    MenuModule,
    RewardProfileModule,
    RewardRulesModule,
    RewardAssignmentModule,
    RewardOverridesModule,
    DashboardRewardsModule,
    CoinEconomyModule,
    RewardResolutionModule,
    ChallengesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
