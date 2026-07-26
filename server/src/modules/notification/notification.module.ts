import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationController } from './notification.controller';
import { NOTIFICATION_CHANNELS } from './notification.tokens';
import { InAppChannel } from './channels';
import { NotificationListener } from './listeners';
import { NotificationChannelHandler } from './interfaces';
import {
  NotificationCacheService,
  NotificationService,
  NotificationDispatcherService,
  NotificationTemplateService,
  NotificationPreferencesService,
  NotificationAnalyticsService,
} from './services';

/**
 * Notification Platform.
 *
 * Feature modules emit domain events; this module is the only subscriber that
 * turns them into messages. To add a delivery channel: implement
 * NotificationChannelHandler, provide the class, and add it to the
 * NOTIFICATION_CHANNELS factory below — nothing else changes.
 */
@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [
    NotificationCacheService,
    NotificationTemplateService,
    NotificationPreferencesService,
    NotificationService,
    NotificationAnalyticsService,

    InAppChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      inject: [InAppChannel],
      useFactory: (
        ...channels: NotificationChannelHandler[]
      ): NotificationChannelHandler[] => channels,
    },

    NotificationDispatcherService,
    NotificationListener,
  ],
  exports: [
    NotificationDispatcherService,
    NotificationService,
    NotificationPreferencesService,
  ],
})
export class NotificationModule {}
