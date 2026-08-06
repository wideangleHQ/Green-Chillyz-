import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { TransactionQueryDto } from '../../wallet/dto';
import { DashboardCustomerScopeService } from '../common/services/dashboard-customer-scope.service';
import { DashboardWalletService } from './dashboard-wallet.service';
import { DashboardWalletQueryDto } from './dto/dashboard-wallet.dto';

function walletQuery(
  overrides: Partial<DashboardWalletQueryDto> = {},
): DashboardWalletQueryDto {
  const query = new DashboardWalletQueryDto();
  Object.assign(query, overrides);
  return query;
}

describe('DashboardWalletService', () => {
  let service: DashboardWalletService;
  let prisma: Record<string, any>;
  let scope: {
    assertCustomerInStore: ReturnType<typeof vi.fn>;
    storeScopedUserFilter: ReturnType<typeof vi.fn>;
  };
  let walletService: {
    getSummary: ReturnType<typeof vi.fn>;
    getTransactions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
      wallet: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    scope = {
      assertCustomerInStore: vi.fn().mockResolvedValue({ userId: 'user-1' }),
      storeScopedUserFilter: vi.fn().mockReturnValue({
        deletedAt: null,
        customerProfile: { assignedStoreId: 'store-1' },
      }),
    };
    walletService = {
      getSummary: vi.fn().mockResolvedValue({ balance: 100 }),
      getTransactions: vi.fn().mockResolvedValue({ items: [], meta: {} }),
    };

    service = new DashboardWalletService(
      prisma as unknown as PrismaService,
      scope as unknown as DashboardCustomerScopeService,
      walletService as unknown as WalletService,
    );
  });

  describe('list', () => {
    it('should scope wallets to the store’s customers', async () => {
      await service.list('store-1', walletQuery());

      const { where } = prisma.wallet.findMany.mock.calls[0][0];
      expect(where.user.customerProfile).toEqual({
        assignedStoreId: 'store-1',
      });
    });

    it('should search across name, email and phone', async () => {
      await service.list('store-1', walletQuery({ search: 'asha' }));

      const { where } = prisma.wallet.findMany.mock.calls[0][0];
      expect(where.user.OR).toHaveLength(3);
    });

    it('should convert every decimal to a number', async () => {
      prisma.wallet.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          balance: '150.50',
          pendingBalance: '0',
          lifetimeEarned: '300',
          lifetimeSpent: '149.50',
          lifetimeExpired: '0',
          isActive: true,
          updatedAt: new Date(),
          user: { fullName: 'Asha Rao', email: 'asha@example.com' },
        },
      ]);
      prisma.wallet.count.mockResolvedValue(1);

      const result = await service.list('store-1', walletQuery());

      expect(result.items[0]).toMatchObject({
        balance: 150.5,
        lifetimeEarned: 300,
        lifetimeSpent: 149.5,
      });
    });

    it('should sort by the requested wallet column', async () => {
      await service.list('store-1', walletQuery({ sortBy: 'balance' }));

      expect(prisma.wallet.findMany.mock.calls[0][0].orderBy).toEqual({
        balance: 'desc',
      });
    });
  });

  describe('getSummary', () => {
    it('should enforce store scope before delegating', async () => {
      await service.getSummary('store-1', 'user-1');

      expect(scope.assertCustomerInStore).toHaveBeenCalledWith(
        'user-1',
        'store-1',
      );
      expect(walletService.getSummary).toHaveBeenCalledWith('user-1');
    });

    it('should not touch the wallet when the customer is out of scope', async () => {
      scope.assertCustomerInStore.mockRejectedValue(new NotFoundException());

      await expect(service.getSummary('store-1', 'user-9')).rejects.toThrow(
        NotFoundException,
      );
      expect(walletService.getSummary).not.toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should pass the ledger query through to WalletService', async () => {
      const query = new TransactionQueryDto();
      await service.getTransactions('store-1', 'user-1', query);

      expect(walletService.getTransactions).toHaveBeenCalledWith(
        'user-1',
        query,
      );
    });
  });
});
