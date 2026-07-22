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

    // Business modules will be imported here as they are built.
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
