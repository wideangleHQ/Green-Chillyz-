import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Prisma,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  NotificationChannelHandler,
  ResolvedNotification,
  DispatchRequest,
  DispatchResult,
} from '../interfaces';
import { NOTIFICATION_CHANNELS } from '../notification.tokens';
import { NOTIFICATION_ERRORS } from '../constants';
import { AUDIT_EVENTS } from '../../audit/constants';
import { NotificationAuditEvent } from '../../audit/events';

/**
 * Resolves a dispatch request into a message and fans it out to channels.
 *
 * Channels are injected as a collection, so Push/Email/WhatsApp/SMS/Webhook
 * join simply by being provided under the NOTIFICATION_CHANNELS token. The
 * dispatcher itself never changes.
 */
@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);
  private readonly handlers = new Map<
    NotificationChannel,
    NotificationChannelHandler
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: NotificationTemplateService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly eventEmitter: EventEmitter2,
    @Optional()
    @Inject(NOTIFICATION_CHANNELS)
    channels?: NotificationChannelHandler[],
  ) {
    for (const handler of channels ?? []) {
      this.registerChannel(handler);
    }
  }

  /** Runtime registration for channels provided by other modules. */
  registerChannel(handler: NotificationChannelHandler): void {
    if (this.handlers.has(handler.channel)) {
      this.logger.warn(
        `Channel ${handler.channel} already registered; ignoring duplicate`,
      );
      return;
    }
    this.handlers.set(handler.channel, handler);
  }

  getRegisteredChannels(): NotificationChannel[] {
    return [...this.handlers.keys()];
  }

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    if (!request.userId) {
      return {
        delivered: false,
        skippedReason: NOTIFICATION_ERRORS.RECIPIENT_REQUIRED,
        results: [],
      };
    }

    const notification = await this.buildNotification(request);
    if (!notification) {
      return {
        delivered: false,
        skippedReason: NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND,
        results: [],
      };
    }

    // Default to every registered channel the template/request permits.
    const targetChannels =
      request.channels && request.channels.length > 0
        ? request.channels
        : [NotificationChannel.IN_APP];

    const results: DispatchResult['results'] = [];

    for (const channel of targetChannels) {
      const handler = this.handlers.get(channel);

      if (!handler) {
        results.push({
          channel,
          status: DeliveryStatus.SKIPPED,
          failureReason: NOTIFICATION_ERRORS.CHANNEL_NOT_REGISTERED,
        });
        continue;
      }

      if (!handler.isAvailable()) {
        results.push({
          channel,
          status: DeliveryStatus.SKIPPED,
          failureReason: NOTIFICATION_ERRORS.CHANNEL_UNAVAILABLE,
        });
        continue;
      }

      // CRITICAL messages (security) bypass opt-outs.
      const bypass =
        request.force === true ||
        notification.priority === NotificationPriority.CRITICAL;

      if (!bypass) {
        const allowed = await this.preferencesService.allows(
          request.userId,
          notification.type,
          channel,
        );
        if (!allowed) {
          results.push({
            channel,
            status: DeliveryStatus.SKIPPED,
            failureReason: NOTIFICATION_ERRORS.USER_OPTED_OUT,
          });
          await this.log(request.userId, channel, DeliveryStatus.SKIPPED, {
            templateKey: notification.templateKey,
            failureReason: NOTIFICATION_ERRORS.USER_OPTED_OUT,
          });
          continue;
        }
      }

      const result = await handler.send(notification);
      results.push({
        channel,
        status: result.status,
        notificationId: result.notificationId,
        failureReason: result.failureReason,
      });

      await this.log(request.userId, channel, result.status, {
        notificationId: result.notificationId,
        templateKey: notification.templateKey,
        failureReason: result.failureReason,
      });

      // Audit records what actually went out, not what was attempted.
      if (result.status === DeliveryStatus.SENT) {
        this.eventEmitter.emit(
          AUDIT_EVENTS.NOTIFICATION_SENT,
          new NotificationAuditEvent(
            request.userId,
            notification.templateKey ?? null,
            channel,
            result.notificationId ?? null,
          ),
        );
      }
    }

    const delivered = results.some((r) => r.status === DeliveryStatus.SENT);

    return { delivered, results };
  }

  private async buildNotification(
    request: DispatchRequest,
  ): Promise<ResolvedNotification | null> {
    let base: ResolvedNotification | null = null;

    if (request.templateKey) {
      base = await this.templateService.resolve(
        request.templateKey,
        request.userId,
        request.variables ?? {},
      );
    }

    // An override alone is enough — the dashboard can send ad-hoc messages.
    if (!base) {
      const override = request.override;
      if (!override?.title || !override?.message) return null;

      base = {
        userId: request.userId,
        title: override.title,
        message: override.message,
        type: override.type ?? NotificationType.SYSTEM,
        priority: override.priority ?? NotificationPriority.NORMAL,
      };
    }

    const merged: ResolvedNotification = {
      ...base,
      ...(request.override ?? {}),
      userId: request.userId,
      dedupeKey: request.dedupeKey ?? request.override?.dedupeKey ?? null,
      referenceId: request.referenceId ?? request.override?.referenceId ?? null,
    };

    return merged;
  }

  private async log(
    userId: string,
    channel: NotificationChannel,
    status: DeliveryStatus,
    extra: {
      notificationId?: string | null;
      templateKey?: string | null;
      failureReason?: string | null;
    },
  ): Promise<void> {
    try {
      await this.prisma.notificationDeliveryLog.create({
        data: {
          userId,
          channel,
          status,
          notificationId: extra.notificationId ?? null,
          templateKey: extra.templateKey ?? null,
          failureReason: extra.failureReason ?? null,
          deliveredAt: status === DeliveryStatus.SENT ? new Date() : null,
          metadata: Prisma.JsonNull,
        },
      });
    } catch (error) {
      // Telemetry must never break delivery.
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Delivery log write failed: ${message}`);
    }
  }
}
