import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination';
import { DashboardCustomerScopeService } from '../common/services/dashboard-customer-scope.service';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import { DASHBOARD_OPS_CACHE } from '../common/constants';
import { DashboardNotificationQueryDto } from './dto/dashboard-notification.dto';

const NOTIFICATION_LIST_SELECT = {
  id: true,
  title: true,
  message: true,
  type: true,
  priority: true,
  status: true,
  createdAt: true,
  readAt: true,
  user: { select: { id: true, fullName: true } },
} satisfies Prisma.NotificationSelect;

/**
 * The store's view over its customers' notification stream — a read-only
 * operational lens. Per-customer notification reads live on the customers
 * controller and delegate to `NotificationService`.
 */
@Injectable()
export class DashboardNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DashboardCustomerScopeService,
    private readonly opsCache: DashboardOpsCacheService,
  ) {}

  private buildWhere(
    storeId: string,
    query: DashboardNotificationQueryDto,
  ): Prisma.NotificationWhereInput {
    return {
      user: this.scope.storeScopedUserFilter(storeId),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.fromDate || query.toDate
        ? {
            createdAt: {
              ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
              ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
            },
          }
        : {}),
    };
  }

  async list(storeId: string, query: DashboardNotificationQueryDto) {
    const where = this.buildWhere(storeId, query);

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: NOTIFICATION_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(rows, totalItems, query.page, query.pageSize);
  }

  async getUnreadCount(storeId: string): Promise<{ unread: number }> {
    const cached = await this.opsCache.get<{ unread: number }>(
      storeId,
      'notifications-unread',
    );
    if (cached) {
      return cached;
    }

    const unread = await this.prisma.notification.count({
      where: {
        status: 'UNREAD',
        user: this.scope.storeScopedUserFilter(storeId),
      },
    });

    const result = { unread };
    await this.opsCache.set(
      storeId,
      'notifications-unread',
      result,
      DASHBOARD_OPS_CACHE.TTL.UNREAD_SECONDS,
    );

    return result;
  }
}
