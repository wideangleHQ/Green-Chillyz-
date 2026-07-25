import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType, TransactionSource, TransactionStatus } from '@prisma/client';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../../database/prisma.service';
import { WalletCacheService } from './wallet-cache.service';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: any;
  let cache: any;

  const userId = 'user-uuid-1';
  const walletId = 'wallet-uuid-1';

  const mockWallet = {
    id: walletId,
    userId,
    balance: '100.00',
    pendingBalance: '0.00',
    lifetimeEarned: '500.00',
    lifetimeSpent: '400.00',
    lifetimeExpired: '0.00',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockTransaction = {
    id: 'txn-uuid-1',
    walletId,
    type: TransactionType.CREDIT,
    source: TransactionSource.ORDER_CASHBACK,
    status: TransactionStatus.COMPLETED,
    amount: '50.00',
    balanceBefore: '100.00',
    balanceAfter: '150.00',
    description: 'Order cashback',
    idempotencyKey: null,
    referenceId: 'order-1',
    referenceType: 'ORDER',
    expiresAt: null,
    expiredAt: null,
    ipAddress: '127.0.0.1',
    deviceInfo: null,
    createdBy: null,
    metadata: null,
    createdAt: new Date('2026-01-15'),
  };

  beforeEach(() => {
    prisma = {
      wallet: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      walletTransaction: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
      },
      $transaction: vi.fn((fn) => fn(prisma)),
      $queryRaw: vi.fn().mockResolvedValue([{ balance: '100.00' }]),
    };

    cache = {
      getSummary: vi.fn().mockResolvedValue(null),
      setSummary: vi.fn(),
      getBalance: vi.fn().mockResolvedValue(null),
      setBalance: vi.fn(),
      invalidate: vi.fn(),
      invalidateAll: vi.fn(),
    };

    service = new WalletService(
      prisma as unknown as PrismaService,
      cache as unknown as WalletCacheService,
    );
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getOrCreateWallet(userId);

      expect(result.id).toBe(walletId);
      expect(result.balance).toBe(100);
      expect(prisma.wallet.create).not.toHaveBeenCalled();
    });

    it('should create wallet if not exists', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);
      prisma.wallet.create.mockResolvedValue({
        ...mockWallet,
        balance: '0.00',
        lifetimeEarned: '0.00',
        lifetimeSpent: '0.00',
      });

      const result = await service.getOrCreateWallet(userId);

      expect(prisma.wallet.create).toHaveBeenCalledWith({ data: { userId } });
      expect(result.balance).toBe(0);
    });
  });

  describe('getBalance', () => {
    it('should return cached balance', async () => {
      const cached = { balance: 100, pendingBalance: 0 };
      cache.getBalance.mockResolvedValue(cached);

      const result = await service.getBalance(userId);

      expect(result).toEqual(cached);
      expect(prisma.wallet.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache on miss', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getBalance(userId);

      expect(result.balance).toBe(100);
      expect(cache.setBalance).toHaveBeenCalledWith(userId, { balance: 100, pendingBalance: 0 });
    });

    it('should return zero when no wallet exists', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getBalance(userId);

      expect(result).toEqual({ balance: 0, pendingBalance: 0 });
    });
  });

  describe('getSummary', () => {
    it('should return cached summary', async () => {
      const cached = { balance: 100, todayEarnings: 10, recentTransactions: [] };
      cache.getSummary.mockResolvedValue(cached);

      const result = await service.getSummary(userId);

      expect(result).toEqual(cached);
    });

    it('should compute summary from DB on cache miss', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.walletTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: '25.00' } })
        .mockResolvedValueOnce({ _sum: { amount: '150.00' } });
      prisma.walletTransaction.findMany.mockResolvedValue([mockTransaction]);

      const result = await service.getSummary(userId);

      expect(result.balance).toBe(100);
      expect(result.todayEarnings).toBe(25);
      expect(result.monthEarnings).toBe(150);
      expect(result.recentTransactions).toHaveLength(1);
      expect(cache.setSummary).toHaveBeenCalled();
    });

    it('should return empty summary when no wallet', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getSummary(userId);

      expect(result.balance).toBe(0);
      expect(result.recentTransactions).toEqual([]);
    });
  });

  describe('credit', () => {
    const creditDto = {
      userId,
      amount: 50,
      source: TransactionSource.ORDER_CASHBACK,
      description: 'Order cashback',
    };

    it('should credit wallet and create transaction', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.wallet.update.mockResolvedValue({ ...mockWallet, balance: '150.00' });
      prisma.walletTransaction.create.mockResolvedValue({
        ...mockTransaction,
        balanceBefore: '100.00',
        balanceAfter: '150.00',
      });

      const result = await service.credit(creditDto, 'admin-1', '127.0.0.1');

      expect(result.newBalance).toBe(150);
      expect(result.transaction.type).toBe(TransactionType.CREDIT);
      expect(cache.invalidate).toHaveBeenCalledWith(userId);
    });

    it('should reject credit when wallet does not exist', async () => {
      // Wallets are provisioned at registration by CustomerBootstrapService;
      // credit must never lazily create one.
      prisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.credit(creditDto)).rejects.toThrow(NotFoundException);
      expect(prisma.wallet.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate idempotency key', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.credit({ ...creditDto, idempotencyKey: 'dup-key' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject credit on inactive wallet', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ ...mockWallet, isActive: false });

      await expect(service.credit(creditDto)).rejects.toThrow(BadRequestException);
    });

    it('should store expiresAt when provided', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.walletTransaction.create.mockResolvedValue(mockTransaction);

      await service.credit({
        ...creditDto,
        expiresAt: '2026-12-31T23:59:59.000Z',
      });

      expect(prisma.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: new Date('2026-12-31T23:59:59.000Z'),
          }),
        }),
      );
    });
  });

  describe('debit', () => {
    const debitDto = {
      userId,
      amount: 30,
      source: TransactionSource.ORDER_PAYMENT,
      description: 'Order payment',
    };

    it('should debit wallet and create transaction', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.walletTransaction.create.mockResolvedValue({
        ...mockTransaction,
        type: TransactionType.DEBIT,
        amount: '30.00',
        balanceBefore: '100.00',
        balanceAfter: '70.00',
      });

      const result = await service.debit(debitDto, 'admin-1');

      expect(result.newBalance).toBe(70);
      expect(result.transaction.type).toBe(TransactionType.DEBIT);
      expect(cache.invalidate).toHaveBeenCalledWith(userId);
    });

    it('should throw when wallet not found', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.debit(debitDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw on insufficient balance', async () => {
      prisma.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.$queryRaw.mockResolvedValue([{ balance: '10.00' }]);

      await expect(
        service.debit({ ...debitDto, amount: 200 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate idempotency key', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.debit({ ...debitDto, idempotencyKey: 'dup-key' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject debit on inactive wallet', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ ...mockWallet, isActive: false });

      await expect(service.debit(debitDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: walletId });
      prisma.walletTransaction.findMany.mockResolvedValue([mockTransaction]);
      prisma.walletTransaction.count.mockResolvedValue(1);

      const result = await service.getTransactions(userId, {
        page: 1,
        pageSize: 20,
        get skip() { return 0; },
        get take() { return 20; },
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should apply type filter', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: walletId });
      prisma.walletTransaction.findMany.mockResolvedValue([]);
      prisma.walletTransaction.count.mockResolvedValue(0);

      await service.getTransactions(userId, {
        page: 1,
        pageSize: 20,
        type: TransactionType.CREDIT,
        get skip() { return 0; },
        get take() { return 20; },
      } as any);

      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: TransactionType.CREDIT }),
        }),
      );
    });

    it('should apply date range filter', async () => {
      prisma.wallet.findUnique.mockResolvedValue({ id: walletId });
      prisma.walletTransaction.findMany.mockResolvedValue([]);
      prisma.walletTransaction.count.mockResolvedValue(0);

      await service.getTransactions(userId, {
        page: 1,
        pageSize: 20,
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
        get skip() { return 0; },
        get take() { return 20; },
      } as any);

      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            },
          }),
        }),
      );
    });

    it('should return empty when no wallet exists', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getTransactions(userId, {
        page: 1,
        pageSize: 20,
        get skip() { return 0; },
        get take() { return 20; },
      } as any);

      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('expireCoins', () => {
    it('should return 0 when no expired coins', async () => {
      prisma.walletTransaction.findMany.mockResolvedValue([]);

      const count = await service.expireCoins();
      expect(count).toBe(0);
    });

    it('should expire coins and update balances', async () => {
      const expiredTxn = {
        ...mockTransaction,
        type: TransactionType.CREDIT,
        amount: '25.00',
        expiresAt: new Date('2026-01-01'),
        expiredAt: null,
        wallet: { id: walletId, userId },
      };
      prisma.walletTransaction.findMany.mockResolvedValue([expiredTxn]);
      prisma.walletTransaction.create.mockResolvedValue(mockTransaction);

      const count = await service.expireCoins();

      expect(count).toBe(1);
      expect(cache.invalidate).toHaveBeenCalledWith(userId);
    });
  });
});
