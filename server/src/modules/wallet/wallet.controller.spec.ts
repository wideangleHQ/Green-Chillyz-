import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletController } from './wallet.controller';
import { WalletService } from './services/wallet.service';

const mockUser = {
  sub: 'user-uuid',
  email: 'test@test.com',
  roles: [{ role: 'ADMIN', storeId: null }],
  permissions: ['WALLET_CREDIT', 'WALLET_DEBIT', 'WALLET_VIEW_ANY', 'WALLET_ADJUST'],
  tokenVersion: 1,
  permissionsVersion: 1,
  sessionId: 'session-1',
};

const mockReq = {
  ip: '127.0.0.1',
  headers: { 'user-agent': 'TestAgent/1.0' },
} as any;

describe('WalletController', () => {
  let controller: WalletController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = {
      getOrCreateWallet: vi.fn(),
      getBalance: vi.fn(),
      getSummary: vi.fn(),
      credit: vi.fn(),
      debit: vi.fn(),
      getTransactions: vi.fn(),
      expireCoins: vi.fn(),
    };
    controller = new WalletController(service as unknown as WalletService);
  });

  describe('getMySummary', () => {
    it('should return current user wallet summary', async () => {
      const summary = { balance: 100, todayEarnings: 10 };
      service.getSummary.mockResolvedValue(summary);

      const result = await controller.getMySummary(mockUser as any);

      expect(service.getSummary).toHaveBeenCalledWith('user-uuid');
      expect(result.balance).toBe(100);
    });
  });

  describe('getMyBalance', () => {
    it('should return current user balance', async () => {
      service.getBalance.mockResolvedValue({ balance: 50, pendingBalance: 0 });

      const result = await controller.getMyBalance(mockUser as any);

      expect(result.balance).toBe(50);
    });
  });

  describe('getMyTransactions', () => {
    it('should delegate to service with user sub', async () => {
      const paginated = { items: [], meta: { totalItems: 0 } };
      service.getTransactions.mockResolvedValue(paginated);

      const query = { page: 1, pageSize: 20 } as any;
      const result = await controller.getMyTransactions(mockUser as any, query);

      expect(service.getTransactions).toHaveBeenCalledWith('user-uuid', query);
      expect(result.items).toEqual([]);
    });
  });

  describe('getUserSummary', () => {
    it('should return any user summary for admin', async () => {
      const summary = { balance: 200 };
      service.getSummary.mockResolvedValue(summary);

      const result = await controller.getUserSummary('other-user-uuid');

      expect(service.getSummary).toHaveBeenCalledWith('other-user-uuid');
      expect(result.balance).toBe(200);
    });
  });

  describe('credit', () => {
    it('should credit and pass ip/device', async () => {
      const creditResult = { transaction: { id: 'txn-1' }, newBalance: 150 };
      service.credit.mockResolvedValue(creditResult);

      const dto = { userId: 'target', amount: 50, source: 'ORDER_CASHBACK', description: 'Test' };
      const result = await controller.credit(dto as any, mockUser as any, mockReq);

      expect(service.credit).toHaveBeenCalledWith(
        dto,
        'user-uuid',
        '127.0.0.1',
        'TestAgent/1.0',
      );
      expect(result.newBalance).toBe(150);
    });
  });

  describe('debit', () => {
    it('should debit and pass ip/device', async () => {
      const debitResult = { transaction: { id: 'txn-2' }, newBalance: 70 };
      service.debit.mockResolvedValue(debitResult);

      const dto = { userId: 'target', amount: 30, source: 'ORDER_PAYMENT', description: 'Payment' };
      const result = await controller.debit(dto as any, mockUser as any, mockReq);

      expect(service.debit).toHaveBeenCalledWith(
        dto,
        'user-uuid',
        '127.0.0.1',
        'TestAgent/1.0',
      );
      expect(result.newBalance).toBe(70);
    });
  });

  describe('expireCoins', () => {
    it('should return expired count', async () => {
      service.expireCoins.mockResolvedValue(5);

      const result = await controller.expireCoins();

      expect(result).toEqual({ expiredCount: 5 });
    });
  });
});
