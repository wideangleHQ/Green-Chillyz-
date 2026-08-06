import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SortOrder } from '../../../common/dto';
import { WalletService } from '../../wallet/services';
import { RewardRedemptionService } from '../../rewards/services/reward-redemption.service';
import { GameSessionService } from '../../game/services/game-session.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationQueryDto } from '../../notification/dto';
import { VoucherQueryDto } from '../../rewards/dto';
import { GameSessionQueryDto } from '../../game/dto';
import { DashboardCustomerScopeService } from '../common/services/dashboard-customer-scope.service';
import { DashboardCustomersService } from './dashboard-customers.service';
import {
  DashboardActivityQueryDto,
  DashboardCustomerQueryDto,
} from './dto/dashboard-customer.dto';

function customerQuery(
  overrides: Partial<DashboardCustomerQueryDto> = {},
): DashboardCustomerQueryDto {
  const query = new DashboardCustomerQueryDto();
  Object.assign(query, overrides);
  return query;
}

describe('DashboardCustomersService', () => {
  let service: DashboardCustomersService;
  let prisma: Record<string, any>;
  let scope: {
    assertCustomerInStore: ReturnType<typeof vi.fn>;
    storeScopedUserFilter: ReturnType<typeof vi.fn>;
  };
  let walletService: { getSummary: ReturnType<typeof vi.fn> };
  let redemptionService: { listUserRedemptions: ReturnType<typeof vi.fn> };
  let gameSessionService: { listSessions: ReturnType<typeof vi.fn> };
  let notificationService: { list: ReturnType<typeof vi.fn> };

  const storeFilter = {
    deletedAt: null,
    customerProfile: { assignedStoreId: 'store-1' },
  };

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUniqueOrThrow: vi.fn(),
      },
      walletTransaction: { findMany: vi.fn().mockResolvedValue([]) },
      rewardRedemption: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      rewardVoucher: { count: vi.fn().mockResolvedValue(0) },
      gameSession: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      notification: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    scope = {
      assertCustomerInStore: vi.fn().mockResolvedValue({
        userId: 'user-1',
        customerProfileId: 'profile-1',
        assignedStoreId: 'store-1',
        fullName: 'Asha Rao',
      }),
      storeScopedUserFilter: vi.fn().mockReturnValue(storeFilter),
    };
    walletService = { getSummary: vi.fn().mockResolvedValue({ balance: 10 }) };
    redemptionService = {
      listUserRedemptions: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    };
    gameSessionService = {
      listSessions: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    };
    notificationService = {
      list: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    };

    service = new DashboardCustomersService(
      prisma as unknown as PrismaService,
      scope as unknown as DashboardCustomerScopeService,
      walletService as unknown as WalletService,
      redemptionService as unknown as RewardRedemptionService,
      gameSessionService as unknown as GameSessionService,
      notificationService as unknown as NotificationService,
    );
  });

  describe('search', () => {
    it('should always scope to the store', async () => {
      await service.search('store-1', customerQuery());

      const { where } = prisma.user.findMany.mock.calls[0][0];
      expect(where).toEqual(storeFilter);
    });

    it('should search by id alone when given a UUID', async () => {
      const uuid = '4fa6be2c-91d8-4a3a-9c39-1f1a1e1b2c3d';
      await service.search('store-1', customerQuery({ search: uuid }));

      const { where } = prisma.user.findMany.mock.calls[0][0];
      expect(where.id).toBe(uuid);
      expect(where.OR).toBeUndefined();
      expect(where.customerProfile).toEqual(storeFilter.customerProfile);
    });

    it('should search name, email, username, phone and voucher code for free text', async () => {
      await service.search('store-1', customerQuery({ search: 'asha' }));

      const { where } = prisma.user.findMany.mock.calls[0][0];
      expect(where.OR).toHaveLength(5);
      expect(where.OR[4]).toEqual({
        rewardVouchers: { some: { code: 'ASHA' } },
      });
    });

    it('should paginate and sort as requested', async () => {
      await service.search(
        'store-1',
        customerQuery({
          page: 3,
          pageSize: 10,
          sortBy: 'fullName',
          sortOrder: SortOrder.ASC,
        }),
      );

      const args = prisma.user.findMany.mock.calls[0][0];
      expect(args.skip).toBe(20);
      expect(args.take).toBe(10);
      expect(args.orderBy).toEqual({ fullName: 'asc' });
    });

    it('should run the page and the count in one transaction', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(41);

      const result = await service.search(
        'store-1',
        customerQuery({ page: 2, pageSize: 20 }),
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.meta.totalItems).toBe(41);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should flatten wallet figures onto each row', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          fullName: 'Asha Rao',
          email: 'asha@example.com',
          username: 'asha',
          phone: null,
          avatarUrl: null,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date('2026-01-01'),
          customerProfile: {
            referralCode: 'REF1',
            createdAt: new Date('2026-01-02'),
          },
          wallet: { balance: '150.00', lifetimeEarned: '200', lifetimeSpent: '50' },
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.search('store-1', customerQuery());

      expect(result.items[0]).toMatchObject({
        walletBalance: 150,
        lifetimeEarned: 200,
        lifetimeSpent: 50,
        referralCode: 'REF1',
      });
    });

    it('should tolerate customers without a wallet yet', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-2',
          fullName: 'New Customer',
          email: 'new@example.com',
          username: null,
          phone: null,
          avatarUrl: null,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          customerProfile: null,
          wallet: null,
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.search('store-1', customerQuery());

      expect(result.items[0].walletBalance).toBe(0);
      expect(result.items[0].referralCode).toBeNull();
    });
  });

  describe('scope enforcement on per-customer reads', () => {
    it.each([
      ['getWallet', () => service.getWallet('store-1', 'user-1')],
      [
        'getRewards',
        () => service.getRewards('store-1', 'user-1', new VoucherQueryDto()),
      ],
      [
        'getGames',
        () => service.getGames('store-1', 'user-1', new GameSessionQueryDto()),
      ],
      [
        'getNotifications',
        () =>
          service.getNotifications(
            'store-1',
            'user-1',
            new NotificationQueryDto(),
          ),
      ],
      [
        'getActivity',
        () =>
          service.getActivity(
            'store-1',
            'user-1',
            new DashboardActivityQueryDto(),
          ),
      ],
    ])('%s should assert store scope first', async (_name, call) => {
      await call();

      expect(scope.assertCustomerInStore).toHaveBeenCalledWith(
        'user-1',
        'store-1',
      );
    });

    it('should propagate the not-found rejection unchanged', async () => {
      scope.assertCustomerInStore.mockRejectedValue(new NotFoundException());

      await expect(service.getWallet('store-1', 'user-9')).rejects.toThrow(
        NotFoundException,
      );
      expect(walletService.getSummary).not.toHaveBeenCalled();
    });
  });

  describe('delegation to owning services', () => {
    it('should read wallet summaries through WalletService', async () => {
      await service.getWallet('store-1', 'user-1');

      expect(walletService.getSummary).toHaveBeenCalledWith('user-1');
    });

    it('should read redemptions through RewardRedemptionService', async () => {
      const query = new VoucherQueryDto();
      await service.getRewards('store-1', 'user-1', query);

      expect(redemptionService.listUserRedemptions).toHaveBeenCalledWith(
        'user-1',
        query,
      );
    });

    it('should pin the session query to the customer, ignoring a spoofed userId', async () => {
      const query = new GameSessionQueryDto();
      query.userId = 'someone-else';

      await service.getGames('store-1', 'user-1', query);

      expect(gameSessionService.listSessions).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('should read notifications through NotificationService', async () => {
      const query = new NotificationQueryDto();
      await service.getNotifications('store-1', 'user-1', query);

      expect(notificationService.list).toHaveBeenCalledWith('user-1', query);
    });
  });

  describe('getActivity', () => {
    it('should merge all sources newest-first and truncate to the limit', async () => {
      prisma.walletTransaction.findMany.mockResolvedValue([
        {
          id: 'txn-1',
          type: 'CREDIT',
          amount: '50',
          description: 'Game reward',
          createdAt: new Date('2026-07-28T10:00:00Z'),
        },
      ]);
      prisma.rewardRedemption.findMany.mockResolvedValue([
        {
          id: 'red-1',
          status: 'COMPLETED',
          coinsSpent: 100,
          createdAt: new Date('2026-07-28T12:00:00Z'),
          reward: { title: 'Free Momos' },
        },
      ]);
      prisma.gameSession.findMany.mockResolvedValue([
        {
          id: 'game-1',
          status: 'COMPLETED',
          score: 80,
          createdAt: new Date('2026-07-28T08:00:00Z'),
          game: { name: 'Spin Wheel' },
        },
      ]);
      prisma.notification.findMany.mockResolvedValue([
        {
          id: 'ntf-1',
          title: 'Coins credited',
          type: 'WALLET',
          createdAt: new Date('2026-07-28T11:00:00Z'),
        },
      ]);

      const query = new DashboardActivityQueryDto();
      query.limit = 3;
      const items = await service.getActivity('store-1', 'user-1', query);

      expect(items).toHaveLength(3);
      expect(items.map((i) => i.type)).toEqual([
        'REDEMPTION',
        'NOTIFICATION',
        'WALLET',
      ]);
    });
  });
});
