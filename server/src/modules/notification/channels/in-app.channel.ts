import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  NotificationChannel,
  DeliveryStatus,
  NotificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationCacheService } from '../services/notification-cache.service';
import {
  NotificationChannelHandler,
  ResolvedNotification,
  ChannelSendResult,
} from '../interfaces';

/**
 * The only channel implemented today: persists the notification so the
 * client can read it from the bell/drawer.
 */
@Injectable()
export class InAppChannel implements NotificationChannelHandler {
  readonly channel = NotificationChannel.IN_APP;

  private readonly logger = new Logger(InAppChannel.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: NotificationCacheService,
  ) {}

  isAvailable(): boolean {
    return true;
  }

  async send(notification: ResolvedNotification): Promise<ChannelSendResult> {
    // Cheap pre-check for the common replay case. The unique constraint below
    // remains the authoritative guard for a genuine race; this just keeps the
    // ordinary path from generating constraint-violation noise.
    if (notification.dedupeKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { dedupeKey: notification.dedupeKey },
        select: { id: true },
      });
      if (existing) {
        this.logger.debug(
          `Duplicate notification suppressed (dedupeKey=${notification.dedupeKey})`,
        );
        return {
          status: DeliveryStatus.SKIPPED,
          failureReason: 'Duplicate notification suppressed',
        };
      }
    }

    try {
      const created = await this.prisma.notification.create({
        data: {
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.UNREAD,
          icon: notification.icon,
          image: notification.image,
          actionLabel: notification.actionLabel,
          actionUrl: notification.actionUrl,
          deepLink: notification.deepLink,
          templateKey: notification.templateKey,
          groupKey: notification.groupKey,
          dedupeKey: notification.dedupeKey,
          referenceId: notification.referenceId,
          expiresAt: notification.expiresAt,
          metadata: notification.metadata
            ? (notification.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        select: { id: true },
      });

      // The badge and drawer must reflect this immediately.
      await this.cache.invalidateUser(notification.userId);

      return { status: DeliveryStatus.SENT, notificationId: created.id };
    } catch (error) {
      // A duplicate dedupeKey means this logical event was already delivered.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `Duplicate notification suppressed (dedupeKey=${notification.dedupeKey})`,
        );
        return {
          status: DeliveryStatus.SKIPPED,
          failureReason: 'Duplicate notification suppressed',
        };
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `In-app delivery failed for user ${notification.userId}: ${message}`,
      );
      return { status: DeliveryStatus.FAILED, failureReason: message.slice(0, 500) };
    }
  }
}
