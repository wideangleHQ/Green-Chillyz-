import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardCustomerScopeService } from '../common/services/dashboard-customer-scope.service';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import { DashboardNotificationsService } from './dashboard-notifications.service';
import { DashboardNotificationQueryDto } from './dto/dashboard-notification.dto';

function notificationQuery(
  overrides: Partial<DashboardNotificationQueryDto> = {},
): DashboardNotificationQueryDto {
  const query = new DashboardNotificationQueryDto();
  Object.assign(query, overrides);
  return query;
}

describe('DashboardNotificationsService', () => {
  let service: DashboardNotificationsService;
  let prisma: Record<string, any>;
  let opsCache: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  const storeFilter = {
    deletedAt: null,
    customerProfile: { assignedStoreId: 'store-1' },
  };

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
      notification: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(7),
      },
    };
    const scope = {
      storeScopedUserFilter: vi.fn().mockReturnValue(storeFilter),
    };
    opsCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    service = new DashboardNotificationsService(
      prisma as unknown as PrismaService,
      scope as unknown as DashboardCustomerScopeService,
      opsCache as unknown as DashboardOpsCacheService,
    );
  });

  describe('list', () => {
    it('should scope the stream to the store’s customers', async () => {
      await service.list('store-1', notificationQuery());

      const { where } = prisma.notification.findMany.mock.calls[0][0];
      expect(where.user).toEqual(storeFilter);
    });

    it('should apply status, type and date filters', async () => {
      await service.list(
        'store-1',
        notificationQuery({
          status: 'UNREAD' as never,
          type: 'WALLET' as never,
          fromDate: '2026-07-01',
          toDate: '2026-07-28',
        }),
      );

      const { where } = prisma.notification.findMany.mock.calls[0][0];
      expect(where.status).toBe('UNREAD');
      expect(where.type).toBe('WALLET');
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      expect(where.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should return the newest first, paginated', async () => {
      const result = await service.list(
        'store-1',
        notificationQuery({ page: 1, pageSize: 20 }),
      );

      expect(prisma.notification.findMany.mock.calls[0][0].orderBy).toEqual({
        createdAt: 'desc',
      });
      expect(result.meta.totalItems).toBe(7);
    });
  });

  describe('getUnreadCount', () => {
    it('should serve from cache when warm', async () => {
      opsCache.get.mockResolvedValue({ unread: 42 });

      const result = await service.getUnreadCount('store-1');

      expect(result.unread).toBe(42);
      expect(prisma.notification.count).not.toHaveBeenCalled();
    });

    it('should count only unread notifications of store customers', async () => {
      const result = await service.getUnreadCount('store-1');

      expect(result.unread).toBe(7);
      const { where } = prisma.notification.count.mock.calls[0][0];
      expect(where.status).toBe('UNREAD');
      expect(where.user).toEqual(storeFilter);
    });

    it('should cache the freshly computed count', async () => {
      await service.getUnreadCount('store-1');

      expect(opsCache.set).toHaveBeenCalledWith(
        'store-1',
        'notifications-unread',
        { unread: 7 },
        expect.any(Number),
      );
    });
  });
});
