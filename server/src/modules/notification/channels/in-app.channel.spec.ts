import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Prisma,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  DeliveryStatus,
} from '@prisma/client';
import { InAppChannel } from './in-app.channel';
import { NotificationCacheService } from '../services/notification-cache.service';
import { PrismaService } from '../../../database/prisma.service';
import { ResolvedNotification } from '../interfaces';

const notification: ResolvedNotification = {
  userId: 'user-1',
  title: 'You earned 50 coins',
  message: 'Balance is now 550 coins.',
  type: NotificationType.WALLET,
  priority: NotificationPriority.NORMAL,
  icon: 'coins',
  actionLabel: 'View Wallet',
  actionUrl: '/wallet',
  templateKey: 'wallet.credited',
  dedupeKey: 'wallet.credited:txn-1',
};

describe('InAppChannel', () => {
  let channel: InAppChannel;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    prisma = {
      notification: {
        create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    cache = { invalidateUser: vi.fn() };

    channel = new InAppChannel(
      prisma as unknown as PrismaService,
      cache as unknown as NotificationCacheService,
    );
  });

  it('should declare the IN_APP channel', () => {
    expect(channel.channel).toBe(NotificationChannel.IN_APP);
  });

  it('should always be available', () => {
    expect(channel.isAvailable()).toBe(true);
  });

  it('should persist the notification as unread', async () => {
    const result = await channel.send(notification);

    expect(result.status).toBe(DeliveryStatus.SENT);
    expect(result.notificationId).toBe('notif-1');
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
          channel: NotificationChannel.IN_APP,
        }),
      }),
    );
  });

  it('should invalidate the badge and drawer caches', async () => {
    await channel.send(notification);

    expect(cache.invalidateUser).toHaveBeenCalledWith('user-1');
  });

  it('should store the dedupe key', async () => {
    await channel.send(notification);

    const data = prisma.notification.create.mock.calls[0][0].data;
    expect(data.dedupeKey).toBe('wallet.credited:txn-1');
  });

  it('should suppress a replay via the dedupe pre-check', async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await channel.send(notification);

    expect(result.status).toBe(DeliveryStatus.SKIPPED);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('should suppress a duplicate instead of failing', async () => {
    prisma.notification.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    const result = await channel.send(notification);

    expect(result.status).toBe(DeliveryStatus.SKIPPED);
    expect(result.failureReason).toContain('Duplicate');
  });

  it('should not invalidate caches when a duplicate is suppressed', async () => {
    prisma.notification.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await channel.send(notification);

    expect(cache.invalidateUser).not.toHaveBeenCalled();
  });

  it('should report a write failure without throwing', async () => {
    prisma.notification.create.mockRejectedValue(new Error('db down'));

    const result = await channel.send(notification);

    expect(result.status).toBe(DeliveryStatus.FAILED);
    expect(result.failureReason).toBe('db down');
  });

  it('should write JsonNull when metadata is absent', async () => {
    await channel.send(notification);

    const data = prisma.notification.create.mock.calls[0][0].data;
    expect(data.metadata).toBe(Prisma.JsonNull);
  });
});
