import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination';
import { PaginatedResponse } from '../../../common/interfaces';
import { SortOrder } from '../../../common/dto';
import { WalletService } from '../../wallet/services';
import { RewardRedemptionService } from '../../rewards/services/reward-redemption.service';
import { GameSessionService } from '../../game/services/game-session.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationQueryDto } from '../../notification/dto';
import { VoucherQueryDto } from '../../rewards/dto';
import { GameSessionQueryDto } from '../../game/dto';
import { DashboardCustomerScopeService } from '../common/services/dashboard-customer-scope.service';
import {
  DashboardActivityQueryDto,
  DashboardCustomerQueryDto,
} from './dto/dashboard-customer.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CUSTOMER_LIST_SELECT = {
  id: true,
  fullName: true,
  email: true,
  username: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  customerProfile: {
    select: { referralCode: true, createdAt: true },
  },
  wallet: {
    select: { balance: true, lifetimeEarned: true, lifetimeSpent: true },
  },
} satisfies Prisma.UserSelect;

export interface DashboardCustomerListItem {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  joinedAt: Date;
  referralCode: string | null;
  walletBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface DashboardActivityItem {
  type: 'WALLET' | 'REDEMPTION' | 'GAME' | 'NOTIFICATION';
  occurredAt: Date;
  title: string;
  detail: string | null;
  referenceId: string;
}

/**
 * Orchestrates the store's view of its customers.
 *
 * Search is the one read implemented here (no customer-facing service lists
 * customers); every per-customer panel delegates to the owning module's
 * service after the scope check, so wallet, rewards, games and notification
 * rules stay exactly where they already live.
 */
@Injectable()
export class DashboardCustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DashboardCustomerScopeService,
    private readonly walletService: WalletService,
    private readonly redemptionService: RewardRedemptionService,
    private readonly gameSessionService: GameSessionService,
    private readonly notificationService: NotificationService,
  ) {}

  async search(
    storeId: string,
    query: DashboardCustomerQueryDto,
  ): Promise<PaginatedResponse<DashboardCustomerListItem>> {
    const where = this.buildSearchWhere(storeId, query.search);

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: CUSTOMER_LIST_SELECT,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      rows.map((row) => this.toListItem(row)),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  async getProfile(storeId: string, customerId: string) {
    await this.scope.assertCustomerInStore(customerId, storeId);

    const [user, walletSummary, counts] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: customerId },
        select: {
          ...CUSTOMER_LIST_SELECT,
          customerProfile: {
            select: {
              referralCode: true,
              dateOfBirth: true,
              gender: true,
              createdAt: true,
              referredBy: {
                select: { user: { select: { id: true, fullName: true } } },
              },
            },
          },
        },
      }),
      this.walletService.getSummary(customerId),
      this.getCustomerCounts(customerId),
    ]);

    const { wallet: _wallet, ...identity } = user;
    return { ...identity, wallet: walletSummary, counts };
  }

  async getWallet(storeId: string, customerId: string) {
    await this.scope.assertCustomerInStore(customerId, storeId);
    return this.walletService.getSummary(customerId);
  }

  async getRewards(storeId: string, customerId: string, query: VoucherQueryDto) {
    await this.scope.assertCustomerInStore(customerId, storeId);
    return this.redemptionService.listUserRedemptions(customerId, query);
  }

  async getGames(storeId: string, customerId: string, query: GameSessionQueryDto) {
    await this.scope.assertCustomerInStore(customerId, storeId);
    query.userId = customerId;
    return this.gameSessionService.listSessions(query);
  }

  async getNotifications(
    storeId: string,
    customerId: string,
    query: NotificationQueryDto,
  ) {
    await this.scope.assertCustomerInStore(customerId, storeId);
    return this.notificationService.list(customerId, query);
  }

  /**
   * Chronological merge of the customer's latest movements across modules.
   * Four indexed reads in parallel, merged and truncated in memory.
   */
  async getActivity(
    storeId: string,
    customerId: string,
    query: DashboardActivityQueryDto,
  ): Promise<DashboardActivityItem[]> {
    await this.scope.assertCustomerInStore(customerId, storeId);
    const take = query.limit;

    const [transactions, redemptions, sessions, notifications] =
      await Promise.all([
        this.prisma.walletTransaction.findMany({
          where: { wallet: { userId: customerId } },
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.rewardRedemption.findMany({
          where: { userId: customerId },
          select: {
            id: true,
            status: true,
            coinsSpent: true,
            createdAt: true,
            reward: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.gameSession.findMany({
          where: { userId: customerId },
          select: {
            id: true,
            status: true,
            score: true,
            createdAt: true,
            game: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take,
        }),
        this.prisma.notification.findMany({
          where: { userId: customerId },
          select: { id: true, title: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take,
        }),
      ]);

    const items: DashboardActivityItem[] = [
      ...transactions.map((t) => ({
        type: 'WALLET' as const,
        occurredAt: t.createdAt,
        title: `${t.type === 'CREDIT' ? 'Credited' : 'Debited'} ${Number(t.amount)} coins`,
        detail: t.description,
        referenceId: t.id,
      })),
      ...redemptions.map((r) => ({
        type: 'REDEMPTION' as const,
        occurredAt: r.createdAt,
        title: `Redeemed "${r.reward.title}" (${r.coinsSpent} coins)`,
        detail: r.status,
        referenceId: r.id,
      })),
      ...sessions.map((s) => ({
        type: 'GAME' as const,
        occurredAt: s.createdAt,
        title: `Played ${s.game.name}`,
        detail: `${s.status} · score ${s.score}`,
        referenceId: s.id,
      })),
      ...notifications.map((n) => ({
        type: 'NOTIFICATION' as const,
        occurredAt: n.createdAt,
        title: n.title,
        detail: n.type,
        referenceId: n.id,
      })),
    ];

    return items
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, take);
  }

  private buildSearchWhere(
    storeId: string,
    search?: string,
  ): Prisma.UserWhereInput {
    const base = this.scope.storeScopedUserFilter(storeId);
    if (!search) {
      return base;
    }

    if (UUID_PATTERN.test(search)) {
      return { ...base, id: search };
    }

    return {
      ...base,
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { rewardVouchers: { some: { code: search.toUpperCase() } } },
      ],
    };
  }

  private async getCustomerCounts(customerId: string) {
    const [redemptions, activeVouchers, gameSessions, unreadNotifications] =
      await this.prisma.$transaction([
        this.prisma.rewardRedemption.count({ where: { userId: customerId } }),
        this.prisma.rewardVoucher.count({
          where: { userId: customerId, status: 'ACTIVE' },
        }),
        this.prisma.gameSession.count({ where: { userId: customerId } }),
        this.prisma.notification.count({
          where: { userId: customerId, status: 'UNREAD' },
        }),
      ]);

    return { redemptions, activeVouchers, gameSessions, unreadNotifications };
  }

  private toListItem(
    row: Prisma.UserGetPayload<{ select: typeof CUSTOMER_LIST_SELECT }>,
  ): DashboardCustomerListItem {
    return {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      username: row.username,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      joinedAt: row.customerProfile?.createdAt ?? row.createdAt,
      referralCode: row.customerProfile?.referralCode ?? null,
      walletBalance: Number(row.wallet?.balance ?? 0),
      lifetimeEarned: Number(row.wallet?.lifetimeEarned ?? 0),
      lifetimeSpent: Number(row.wallet?.lifetimeSpent ?? 0),
    };
  }
}
