import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  DeliveryStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationStats } from '../interfaces';

/**
 * Aggregates the notification funnel. Every figure is derived from existing
 * rows, so the upcoming dashboard can read it without new instrumentation.
 */
@Injectable()
export class NotificationAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<NotificationStats> {
    const [sent, read, clicked, unread, channelGroups, templateGroups] =
      await Promise.all([
        this.prisma.notification.count(),
        this.prisma.notification.count({
          where: { status: { in: [NotificationStatus.READ, NotificationStatus.ARCHIVED] } },
        }),
        this.prisma.notification.count({ where: { clickedAt: { not: null } } }),
        this.prisma.notification.count({
          where: { status: NotificationStatus.UNREAD },
        }),
        this.prisma.notificationDeliveryLog.groupBy({
          by: ['channel'],
          where: { status: DeliveryStatus.SENT },
          _count: { _all: true },
        }),
        this.prisma.notification.groupBy({
          by: ['templateKey'],
          where: { templateKey: { not: null } },
          _count: { _all: true },
        }),
      ]);

    // Per-template click and read counts, resolved in two grouped queries
    // rather than one per template (no N+1).
    const [clickGroups, readGroups] = await Promise.all([
      this.prisma.notification.groupBy({
        by: ['templateKey'],
        where: { templateKey: { not: null }, clickedAt: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.notification.groupBy({
        by: ['templateKey'],
        where: {
          templateKey: { not: null },
          status: { in: [NotificationStatus.READ, NotificationStatus.ARCHIVED] },
        },
        _count: { _all: true },
      }),
    ]);

    const clicksByTemplate = new Map(
      clickGroups.map((g) => [g.templateKey as string, g._count._all]),
    );
    const readsByTemplate = new Map(
      readGroups.map((g) => [g.templateKey as string, g._count._all]),
    );

    const mostClicked = [...clicksByTemplate.entries()]
      .map(([templateKey, clicks]) => ({ templateKey, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const mostIgnored = templateGroups
      .map((g) => {
        const templateKey = g.templateKey as string;
        return {
          templateKey,
          sent: g._count._all,
          read: readsByTemplate.get(templateKey) ?? 0,
        };
      })
      .filter((t) => t.sent > 0)
      .sort((a, b) => a.read / a.sent - b.read / b.sent)
      .slice(0, 10);

    return {
      sent,
      read,
      clicked,
      unread,
      readRate: sent > 0 ? Number(((read / sent) * 100).toFixed(2)) : 0,
      clickRate: sent > 0 ? Number(((clicked / sent) * 100).toFixed(2)) : 0,
      channelUsage: channelGroups.map((g) => ({
        channel: g.channel as NotificationChannel,
        count: g._count._all,
      })),
      mostClicked,
      mostIgnored,
    };
  }

  async getUserStats(userId: string): Promise<{
    total: number;
    unread: number;
    read: number;
    clicked: number;
  }> {
    const [total, unread, read, clicked] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, status: NotificationStatus.UNREAD },
      }),
      this.prisma.notification.count({
        where: { userId, status: NotificationStatus.READ },
      }),
      this.prisma.notification.count({
        where: { userId, clickedAt: { not: null } },
      }),
    ]);

    return { total, unread, read, clicked };
  }
}
