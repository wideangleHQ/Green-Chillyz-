import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../../database/prisma.service';
import { DashboardOpsCacheService } from '../services/dashboard-ops-cache.service';
import { DashboardCacheListener } from './dashboard-cache.listener';

describe('DashboardCacheListener', () => {
  let listener: DashboardCacheListener;
  let prisma: { customerProfile: { findUnique: ReturnType<typeof vi.fn> } };
  let cache: { invalidateStore: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      customerProfile: {
        findUnique: vi.fn().mockResolvedValue({ assignedStoreId: 'store-1' }),
      },
    };
    cache = { invalidateStore: vi.fn().mockResolvedValue(undefined) };

    listener = new DashboardCacheListener(
      prisma as unknown as PrismaService,
      cache as unknown as DashboardOpsCacheService,
    );
  });

  it('should map a wallet movement to the customer’s store and invalidate it', async () => {
    await listener.onWalletMovement({ userId: 'user-1' });

    expect(prisma.customerProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { assignedStoreId: true },
    });
    expect(cache.invalidateStore).toHaveBeenCalledWith('store-1');
  });

  it('should invalidate directly when the voucher event carries the store', async () => {
    await listener.onVoucherRedeemed({ storeId: 'store-2' });

    expect(cache.invalidateStore).toHaveBeenCalledWith('store-2');
    expect(prisma.customerProfile.findUnique).not.toHaveBeenCalled();
  });

  it('should fall back to the customer’s store when the voucher has none', async () => {
    await listener.onVoucherRedeemed({ storeId: null, customerId: 'user-1' });

    expect(cache.invalidateStore).toHaveBeenCalledWith('store-1');
  });

  it('should do nothing for a user without a customer profile', async () => {
    prisma.customerProfile.findUnique.mockResolvedValue(null);

    await listener.onWalletMovement({ userId: 'staff-1' });

    expect(cache.invalidateStore).not.toHaveBeenCalled();
  });

  it('should swallow lookup failures — cache invalidation must never break the write path', async () => {
    prisma.customerProfile.findUnique.mockRejectedValue(new Error('db down'));

    await expect(
      listener.onWalletMovement({ userId: 'user-1' }),
    ).resolves.toBeUndefined();
  });

  it('should swallow redis failures the same way', async () => {
    cache.invalidateStore.mockRejectedValue(new Error('redis down'));

    await expect(
      listener.onVoucherRedeemed({ storeId: 'store-1' }),
    ).resolves.toBeUndefined();
  });
});
