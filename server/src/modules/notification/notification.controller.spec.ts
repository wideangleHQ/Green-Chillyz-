import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationController } from './notification.controller';
import {
  NotificationService,
  NotificationDispatcherService,
  NotificationTemplateService,
  NotificationPreferencesService,
  NotificationAnalyticsService,
} from './services';

const mockUser = {
  sub: 'user-uuid-1',
  email: 'user@test.com',
  roles: [{ role: 'customer', storeId: null }],
  permissions: [],
  tokenVersion: 1,
  permissionsVersion: 1,
  sessionId: 'session-1',
};

const pageQuery = { page: 1, pageSize: 20, skip: 0, take: 20 } as never;

describe('NotificationController', () => {
  let controller: NotificationController;
  let notifications: Record<string, ReturnType<typeof vi.fn>>;
  let dispatcher: Record<string, ReturnType<typeof vi.fn>>;
  let templates: Record<string, ReturnType<typeof vi.fn>>;
  let preferences: Record<string, ReturnType<typeof vi.fn>>;
  let analytics: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    notifications = {
      list: vi.fn().mockResolvedValue({ items: [], meta: {} }),
      getLatest: vi.fn().mockResolvedValue([]),
      getUnreadCount: vi.fn().mockResolvedValue({ unread: 3 }),
      getById: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      markRead: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      markAllRead: vi.fn().mockResolvedValue({ updated: 5 }),
      trackClick: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      archive: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    dispatcher = {
      dispatch: vi.fn().mockResolvedValue({ delivered: true, results: [] }),
      getRegisteredChannels: vi.fn().mockReturnValue(['IN_APP']),
    };
    templates = {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ key: 'x' }),
      update: vi.fn().mockResolvedValue({ key: 'x' }),
    };
    preferences = {
      get: vi.fn().mockResolvedValue({ wallet: true }),
      update: vi.fn().mockResolvedValue({ wallet: false }),
    };
    analytics = {
      getStats: vi.fn().mockResolvedValue({ sent: 10 }),
      getUserStats: vi.fn().mockResolvedValue({ total: 4 }),
    };

    controller = new NotificationController(
      notifications as unknown as NotificationService,
      dispatcher as unknown as NotificationDispatcherService,
      templates as unknown as NotificationTemplateService,
      preferences as unknown as NotificationPreferencesService,
      analytics as unknown as NotificationAnalyticsService,
    );
  });

  describe('ownership scoping', () => {
    it('should list only the caller notifications', async () => {
      await controller.list(mockUser as never, pageQuery);

      expect(notifications.list).toHaveBeenCalledWith(mockUser.sub, pageQuery);
    });

    it('should scope latest to the caller', async () => {
      await controller.latest(mockUser as never);

      expect(notifications.getLatest).toHaveBeenCalledWith(mockUser.sub);
    });

    it('should scope the unread count to the caller', async () => {
      const result = await controller.unreadCount(mockUser as never);

      expect(result.unread).toBe(3);
      expect(notifications.getUnreadCount).toHaveBeenCalledWith(mockUser.sub);
    });

    it('should scope a single fetch to the caller', async () => {
      await controller.getOne(mockUser as never, 'notif-1');

      expect(notifications.getById).toHaveBeenCalledWith(mockUser.sub, 'notif-1');
    });

    it('should scope mark-read to the caller', async () => {
      await controller.markRead(mockUser as never, 'notif-1');

      expect(notifications.markRead).toHaveBeenCalledWith(mockUser.sub, 'notif-1');
    });

    it('should scope mark-all-read to the caller', async () => {
      const result = await controller.markAllRead(mockUser as never);

      expect(result.updated).toBe(5);
      expect(notifications.markAllRead).toHaveBeenCalledWith(mockUser.sub);
    });

    it('should scope click tracking to the caller', async () => {
      await controller.trackClick(mockUser as never, 'notif-1');

      expect(notifications.trackClick).toHaveBeenCalledWith(mockUser.sub, 'notif-1');
    });

    it('should scope archive to the caller', async () => {
      await controller.archive(mockUser as never, 'notif-1');

      expect(notifications.archive).toHaveBeenCalledWith(mockUser.sub, 'notif-1');
    });

    it('should scope delete to the caller', async () => {
      const result = await controller.remove(mockUser as never, 'notif-1');

      expect(result.message).toBe('Notification deleted successfully');
      expect(notifications.remove).toHaveBeenCalledWith(mockUser.sub, 'notif-1');
    });
  });

  describe('preferences', () => {
    it('should read the caller preferences', async () => {
      await controller.getPreferences(mockUser as never);

      expect(preferences.get).toHaveBeenCalledWith(mockUser.sub);
    });

    it('should update the caller preferences', async () => {
      await controller.updatePreferences(mockUser as never, { marketing: false });

      expect(preferences.update).toHaveBeenCalledWith(mockUser.sub, {
        marketing: false,
      });
    });
  });

  describe('admin', () => {
    it('should send to a named user', async () => {
      await controller.send({
        userId: 'target-user',
        templateKey: 'wallet.credited',
        variables: { amount: 10 },
      } as never);

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'target-user',
          templateKey: 'wallet.credited',
        }),
      );
    });

    it('should broadcast to many users', async () => {
      const result = await controller.broadcast({
        userIds: ['u1', 'u2', 'u3'],
        title: 'Campaign',
        message: 'Live now',
      } as never);

      expect(dispatcher.dispatch).toHaveBeenCalledTimes(3);
      expect(result.requested).toBe(3);
      expect(result.delivered).toBe(3);
    });

    it('should count only delivered broadcasts', async () => {
      dispatcher.dispatch
        .mockResolvedValueOnce({ delivered: true, results: [] })
        .mockResolvedValueOnce({ delivered: false, results: [] });

      const result = await controller.broadcast({
        userIds: ['u1', 'u2'],
        title: 'X',
        message: 'Y',
      } as never);

      expect(result.delivered).toBe(1);
    });

    it('should expose registered channels', async () => {
      const result = await controller.channels();

      expect(result.channels).toEqual(['IN_APP']);
    });

    it('should return analytics', async () => {
      const result = await controller.analytics();

      expect(result.sent).toBe(10);
    });

    it('should list templates', async () => {
      await controller.listTemplates();

      expect(templates.findAll).toHaveBeenCalled();
    });

    it('should create a template', async () => {
      await controller.createTemplate({ key: 'x' } as never);

      expect(templates.create).toHaveBeenCalled();
    });

    it('should update a template by key', async () => {
      await controller.updateTemplate('wallet.credited', { name: 'N' } as never);

      expect(templates.update).toHaveBeenCalledWith('wallet.credited', { name: 'N' });
    });
  });
});
