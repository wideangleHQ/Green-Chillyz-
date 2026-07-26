import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
} from '@prisma/client';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  NotificationChannelHandler,
  ResolvedNotification,
} from '../interfaces';
import { NOTIFICATION_ERRORS } from '../constants';

const makeChannel = (
  channel: NotificationChannel,
  overrides: Partial<NotificationChannelHandler> = {},
): NotificationChannelHandler => ({
  channel,
  isAvailable: vi.fn().mockReturnValue(true),
  send: vi.fn().mockResolvedValue({
    status: DeliveryStatus.SENT,
    notificationId: 'notif-1',
  }),
  ...overrides,
});

const resolved: ResolvedNotification = {
  userId: 'user-1',
  title: 'You earned 50 coins',
  message: 'Balance is now 550 coins.',
  type: NotificationType.WALLET,
  priority: NotificationPriority.NORMAL,
  templateKey: 'wallet.credited',
};

describe('NotificationDispatcherService', () => {
  let service: NotificationDispatcherService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let templates: Record<string, ReturnType<typeof vi.fn>>;
  let preferences: Record<string, ReturnType<typeof vi.fn>>;
  let inApp: NotificationChannelHandler;
  let eventEmitter: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    prisma = {
      notificationDeliveryLog: { create: vi.fn() },
    };
    templates = { resolve: vi.fn().mockResolvedValue(resolved) };
    preferences = { allows: vi.fn().mockResolvedValue(true) };
    inApp = makeChannel(NotificationChannel.IN_APP);
    eventEmitter = { emit: vi.fn(), emitAsync: vi.fn() };

    service = new NotificationDispatcherService(
      prisma as unknown as PrismaService,
      templates as unknown as NotificationTemplateService,
      preferences as unknown as NotificationPreferencesService,
      eventEmitter as unknown as EventEmitter2,
      [inApp],
    );
  });

  describe('channel registry', () => {
    it('should register injected channels', () => {
      expect(service.getRegisteredChannels()).toEqual([NotificationChannel.IN_APP]);
    });

    it('should let a future channel register at runtime', () => {
      service.registerChannel(makeChannel(NotificationChannel.PUSH));

      expect(service.getRegisteredChannels()).toContain(NotificationChannel.PUSH);
    });

    it('should ignore duplicate channel registration', () => {
      service.registerChannel(makeChannel(NotificationChannel.IN_APP));

      expect(service.getRegisteredChannels()).toEqual([NotificationChannel.IN_APP]);
    });

    it('should tolerate construction with no channels', async () => {
      const bare = new NotificationDispatcherService(
        prisma as unknown as PrismaService,
        templates as unknown as NotificationTemplateService,
        preferences as unknown as NotificationPreferencesService,
        eventEmitter as unknown as EventEmitter2,
      );

      expect(bare.getRegisteredChannels()).toEqual([]);
    });
  });

  describe('dispatch', () => {
    it('should deliver through the in-app channel', async () => {
      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
      });

      expect(result.delivered).toBe(true);
      expect(inApp.send).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'You earned 50 coins' }),
      );
    });

    it('should default to the in-app channel', async () => {
      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
      });

      expect(result.results[0].channel).toBe(NotificationChannel.IN_APP);
    });

    it('should require a recipient', async () => {
      const result = await service.dispatch({ userId: '' });

      expect(result.delivered).toBe(false);
      expect(result.skippedReason).toBe(NOTIFICATION_ERRORS.RECIPIENT_REQUIRED);
    });

    it('should skip an unregistered channel instead of throwing', async () => {
      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
        channels: [NotificationChannel.PUSH],
      });

      expect(result.delivered).toBe(false);
      expect(result.results[0].status).toBe(DeliveryStatus.SKIPPED);
      expect(result.results[0].failureReason).toBe(
        NOTIFICATION_ERRORS.CHANNEL_NOT_REGISTERED,
      );
    });

    it('should skip an unavailable channel', async () => {
      const push = makeChannel(NotificationChannel.PUSH, {
        isAvailable: vi.fn().mockReturnValue(false),
      });
      service.registerChannel(push);

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
        channels: [NotificationChannel.PUSH],
      });

      expect(result.results[0].failureReason).toBe(
        NOTIFICATION_ERRORS.CHANNEL_UNAVAILABLE,
      );
      expect(push.send).not.toHaveBeenCalled();
    });

    it('should respect a user opt-out', async () => {
      preferences.allows.mockResolvedValue(false);

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
      });

      expect(result.delivered).toBe(false);
      expect(result.results[0].failureReason).toBe(NOTIFICATION_ERRORS.USER_OPTED_OUT);
      expect(inApp.send).not.toHaveBeenCalled();
    });

    it('should deliver CRITICAL messages despite an opt-out', async () => {
      preferences.allows.mockResolvedValue(false);
      templates.resolve.mockResolvedValue({
        ...resolved,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.CRITICAL,
      });

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'security.alert',
      });

      expect(result.delivered).toBe(true);
      expect(inApp.send).toHaveBeenCalled();
    });

    it('should honour an explicit force flag', async () => {
      preferences.allows.mockResolvedValue(false);

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
        force: true,
      });

      expect(result.delivered).toBe(true);
    });

    it('should fall back to an override when no template matches', async () => {
      templates.resolve.mockResolvedValue(null);

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'missing.template',
        override: { title: 'Ad-hoc', message: 'Sent from the dashboard' },
      });

      expect(result.delivered).toBe(true);
      expect(inApp.send).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ad-hoc' }),
      );
    });

    it('should report when neither template nor override resolves', async () => {
      templates.resolve.mockResolvedValue(null);

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'missing.template',
      });

      expect(result.delivered).toBe(false);
      expect(result.skippedReason).toBe(NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND);
    });

    it('should send with no template when an override is supplied', async () => {
      const result = await service.dispatch({
        userId: 'user-1',
        override: {
          title: 'Broadcast',
          message: 'Campaign is live',
          type: NotificationType.CAMPAIGN,
        },
      });

      expect(result.delivered).toBe(true);
    });

    it('should pass the dedupe key through to the channel', async () => {
      await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
        dedupeKey: 'wallet.credited:txn-1',
      });

      expect(inApp.send).toHaveBeenCalledWith(
        expect.objectContaining({ dedupeKey: 'wallet.credited:txn-1' }),
      );
    });

    it('should always target the requested recipient', async () => {
      await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
        override: { userId: 'attacker' } as never,
      });

      expect(inApp.send).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('should record a delivery log', async () => {
      await service.dispatch({ userId: 'user-1', templateKey: 'wallet.credited' });

      expect(prisma.notificationDeliveryLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            channel: NotificationChannel.IN_APP,
            status: DeliveryStatus.SENT,
          }),
        }),
      );
    });

    it('should not fail delivery when logging throws', async () => {
      prisma.notificationDeliveryLog.create.mockRejectedValue(new Error('log down'));

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
      });

      expect(result.delivered).toBe(true);
    });

    it('should fan out to every registered channel requested', async () => {
      const push = makeChannel(NotificationChannel.PUSH);
      service.registerChannel(push);

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });

      expect(result.results).toHaveLength(2);
      expect(inApp.send).toHaveBeenCalled();
      expect(push.send).toHaveBeenCalled();
    });

    it('should report a channel failure without throwing', async () => {
      (inApp.send as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: DeliveryStatus.FAILED,
        failureReason: 'db down',
      });

      const result = await service.dispatch({
        userId: 'user-1',
        templateKey: 'wallet.credited',
      });

      expect(result.delivered).toBe(false);
      expect(result.results[0].failureReason).toBe('db down');
    });
  });
});
