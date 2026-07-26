import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination/paginator';
import { PaginatedResponse } from '../../../common/interfaces';
import { NotificationCacheService } from './notification-cache.service';
import { NotificationQueryDto } from '../dto';
import { NotificationResponse, UnreadCountResponse } from '../interfaces';
import {
  NOTIFICATION_ERRORS,
  NOTIFICATION_DEFAULTS,
} from '../constants';

const RESPONSE_SELECT = {
  id: true,
  title: true,
  message: true,
  type: true,
  priority: true,
  status: true,
  icon: true,
  image: true,
  actionLabel: true,
  actionUrl: true,
  deepLink: true,
  readAt: true,
  createdAt: true,
  expiresAt: true,
} satisfies Prisma.NotificationSelect;

/**
 * Read-side of the platform: everything the signed-in user sees.
 * Every query is scoped by userId — a notification is never reachable
 * by anyone but its owner.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: NotificationCacheService,
  ) {}

  async list(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedResponse<NotificationResponse>> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      status: query.status ?? { not: NotificationStatus.DELETED },
      ...(query.type && { type: query.type }),
      // Expired notifications stay in the table but drop out of the feed.
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: RESPONSE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.pageSize);
  }

  /** Small, hot payload backing the bell dropdown. */
  async getLatest(userId: string): Promise<NotificationResponse[]> {
    const cached = await this.cache.getLatest<NotificationResponse[]>(userId);
    if (cached) return cached;

    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        status: { in: [NotificationStatus.UNREAD, NotificationStatus.READ] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: RESPONSE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: NOTIFICATION_DEFAULTS.LATEST_LIMIT,
    });

    await this.cache.setLatest(userId, rows);
    return rows;
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const cached = await this.cache.getUnreadCount(userId);
    if (cached !== null) return { unread: cached };

    const unread = await this.prisma.notification.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    await this.cache.setUnreadCount(userId, unread);
    return { unread };
  }

  async getById(userId: string, id: string): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { ...RESPONSE_SELECT, userId: true },
    });

    // Identical error whether missing or someone else's — no enumeration.
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(NOTIFICATION_ERRORS.NOT_FOUND);
    }

    const { userId: _ownerId, ...response } = notification;
    return response;
  }

  async markRead(userId: string, id: string): Promise<NotificationResponse> {
    await this.assertOwnership(userId, id);

    // Conditional update keeps readAt at the first read.
    await this.prisma.notification.updateMany({
      where: { id, userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });

    await this.cache.invalidateUser(userId);
    return this.getById(userId, id);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });

    await this.cache.invalidateUser(userId);
    this.logger.log(`Marked ${result.count} notification(s) read for ${userId}`);

    return { updated: result.count };
  }

  /** Records a click for analytics and marks the item read. */
  async trackClick(userId: string, id: string): Promise<NotificationResponse> {
    await this.assertOwnership(userId, id);

    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: {
        clickedAt: new Date(),
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    await this.cache.invalidateUser(userId);
    return this.getById(userId, id);
  }

  async archive(userId: string, id: string): Promise<NotificationResponse> {
    await this.assertOwnership(userId, id);

    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: NotificationStatus.ARCHIVED },
    });

    await this.cache.invalidateUser(userId);
    return this.getById(userId, id);
  }

  /** Soft delete — the row is retained for analytics. */
  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwnership(userId, id);

    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: NotificationStatus.DELETED },
    });

    await this.cache.invalidateUser(userId);
  }

  private async assertOwnership(userId: string, id: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(NOTIFICATION_ERRORS.NOT_FOUND);
    }
  }
}
