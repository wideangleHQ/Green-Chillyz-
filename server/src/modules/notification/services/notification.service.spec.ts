import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { NotificationService } from './notification.service';
import { NotificationCacheService } from './notification-cache.service';
import { PrismaService } from '../../../database/prisma.service';
import { NOTIFICATION_ERRORS } from '../constants';

const OWNER = 'user-1';
const OTHER = 'user-2';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'notif-1',
  title: 'You earned 50 coins',
  message: 'Balance is now 550.',
  type: NotificationType.WALLET,
  priority: 'NORMAL',
  status: NotificationStatus.UNREAD,
  icon: 'coins',
  image: null,
  actionLabel: 'View Wallet',
  actionUrl: '/wallet',
  deepLink: null,
  readAt: null,
  createdAt: new Date('2026-07-25'),
  expiresAt: null,
  ...overrides,
});

const query = (extra: Record<string, unknown> = {}) =>
  ({
    page: 1,
    pageSize: 20,
    get skip() { return 0; },
    get take() { return 20; },
    ...extra,
  }) as never;

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: vi.fn().mockResolvedValue([makeRow()]),
        findUnique: vi.fn().mockResolvedValue({ ...makeRow(), userId: OWNER }),
        count: vi.fn().mockResolvedValue(1),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    cache = {
      getUnreadCount: vi.fn().mockResolvedValue(null),
      setUnreadCount: vi.fn(),
      getLatest: vi.fn().mockResolvedValue(null),
      setLatest: vi.fn(),
      invalidateUser: vi.fn(),
    };

    service = new NotificationService(
      prisma as unknown as PrismaService,
      cache as unknown as NotificationCacheService,
    );
  });

  describe('list', () => {
    it('should return a paginated feed', async () => {
      const result = await service.list(OWNER, query());

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should always scope the query to the caller', async () => {
      await service.list(OWNER, query());

      expect(prisma.notification.findMany.mock.calls[0][0].where.userId).toBe(OWNER);
    });

    it('should exclude deleted notifications by default', async () => {
      await service.list(OWNER, query());

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.status).toEqual({ not: NotificationStatus.DELETED });
    });

    it('should exclude expired notifications', async () => {
      await service.list(OWNER, query());

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
    });

    it('should filter by type', async () => {
      await service.list(OWNER, query({ type: NotificationType.GAME }));

      expect(prisma.notification.findMany.mock.calls[0][0].where.type).toBe(
        NotificationType.GAME,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should serve a cached count without querying', async () => {
      cache.getUnreadCount.mockResolvedValue(7);

      const result = await service.getUnreadCount(OWNER);

      expect(result.unread).toBe(7);
      expect(prisma.notification.count).not.toHaveBeenCalled();
    });

    it('should compute and cache on a miss', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(OWNER);

      expect(result.unread).toBe(3);
      expect(cache.setUnreadCount).toHaveBeenCalledWith(OWNER, 3);
    });

    it('should treat a cached zero as a hit', async () => {
      cache.getUnreadCount.mockResolvedValue(0);

      const result = await service.getUnreadCount(OWNER);

      expect(result.unread).toBe(0);
      expect(prisma.notification.count).not.toHaveBeenCalled();
    });
  });

  describe('getLatest', () => {
    it('should serve cached items', async () => {
      cache.getLatest.mockResolvedValue([makeRow()]);

      const result = await service.getLatest(OWNER);

      expect(result).toHaveLength(1);
      expect(prisma.notification.findMany).not.toHaveBeenCalled();
    });

    it('should cache on a miss', async () => {
      await service.getLatest(OWNER);

      expect(cache.setLatest).toHaveBeenCalled();
    });
  });

  describe('ownership', () => {
    it('should return the caller own notification', async () => {
      const result = await service.getById(OWNER, 'notif-1');

      expect(result.id).toBe('notif-1');
    });

    it('should not leak the owner id in the response', async () => {
      const result = await service.getById(OWNER, 'notif-1');

      expect(result).not.toHaveProperty('userId');
    });

    it('should hide another user notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        ...makeRow(),
        userId: OTHER,
      });

      await expect(service.getById(OWNER, 'notif-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use the same error for missing and forbidden', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.getById(OWNER, 'nope')).rejects.toThrow(
        NOTIFICATION_ERRORS.NOT_FOUND,
      );
    });

    it('should refuse to mark another user notification read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        ...makeRow(),
        userId: OTHER,
      });

      await expect(service.markRead(OWNER, 'notif-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    });

    it('should refuse to delete another user notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        ...makeRow(),
        userId: OTHER,
      });

      await expect(service.remove(OWNER, 'notif-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markRead', () => {
    it('should transition only an unread notification', async () => {
      await service.markRead(OWNER, 'notif-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: OWNER, status: NotificationStatus.UNREAD },
        data: { status: NotificationStatus.READ, readAt: expect.any(Date) },
      });
    });

    it('should invalidate the badge cache', async () => {
      await service.markRead(OWNER, 'notif-1');

      expect(cache.invalidateUser).toHaveBeenCalledWith(OWNER);
    });
  });

  describe('markAllRead', () => {
    it('should report how many were updated', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllRead(OWNER);

      expect(result.updated).toBe(5);
      expect(cache.invalidateUser).toHaveBeenCalledWith(OWNER);
    });

    it('should only touch the caller unread rows', async () => {
      await service.markAllRead(OWNER);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: OWNER, status: NotificationStatus.UNREAD },
        data: { status: NotificationStatus.READ, readAt: expect.any(Date) },
      });
    });
  });

  describe('trackClick', () => {
    it('should record the click and mark read', async () => {
      await service.trackClick(OWNER, 'notif-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clickedAt: expect.any(Date),
            status: NotificationStatus.READ,
          }),
        }),
      );
    });
  });

  describe('archive and remove', () => {
    it('should archive', async () => {
      await service.archive(OWNER, 'notif-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: NotificationStatus.ARCHIVED },
        }),
      );
    });

    it('should soft-delete rather than destroy the row', async () => {
      await service.remove(OWNER, 'notif-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: NotificationStatus.DELETED },
        }),
      );
    });
  });
});
