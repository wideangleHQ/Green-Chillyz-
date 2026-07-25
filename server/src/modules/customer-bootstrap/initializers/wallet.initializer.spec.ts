import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletInitializer } from './wallet.initializer';
import { PrismaService } from '../../../database/prisma.service';
import { WalletCacheService } from '../../wallet/services';
import { UserRegisteredEvent } from '../events';
import { BOOTSTRAP_PRIORITY, BOOTSTRAP_INITIALIZER_NAMES } from '../constants';

describe('WalletInitializer', () => {
  let initializer: WalletInitializer;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  const userId = 'user-uuid-1';
  const event = new UserRegisteredEvent(userId, 'user@test.com', 'credentials');
  const createdAt = new Date('2026-07-25T10:00:00Z');

  beforeEach(() => {
    prisma = {
      wallet: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({
          id: 'wallet-1',
          createdAt,
          updatedAt: createdAt,
        }),
      },
    };
    cache = { invalidate: vi.fn(), invalidateAll: vi.fn() };

    initializer = new WalletInitializer(
      prisma as unknown as PrismaService,
      cache as unknown as WalletCacheService,
    );
  });

  it('should expose a stable name and wallet-first priority', () => {
    expect(initializer.name).toBe(BOOTSTRAP_INITIALIZER_NAMES.WALLET);
    expect(initializer.priority).toBe(BOOTSTRAP_PRIORITY.WALLET);
  });

  it('should create a wallet with zeroed balances and active flag', async () => {
    const result = await initializer.initialize(event);

    expect(result.created).toBe(true);
    expect(result.alreadyExisted).toBe(false);
    expect(prisma.wallet.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        create: {
          userId,
          balance: 0,
          pendingBalance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
          lifetimeExpired: 0,
          isActive: true,
        },
        update: {},
      }),
    );
  });

  it('should invalidate the wallet cache after provisioning', async () => {
    await initializer.initialize(event);

    expect(cache.invalidate).toHaveBeenCalledWith(userId);
  });

  it('should be idempotent: skip when a wallet already exists', async () => {
    prisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1' });

    const result = await initializer.initialize(event);

    expect(result.created).toBe(false);
    expect(result.alreadyExisted).toBe(true);
    expect(prisma.wallet.upsert).not.toHaveBeenCalled();
  });

  it('should never create a duplicate wallet under concurrency', async () => {
    // Racing bootstrap already inserted the row: upsert takes the update
    // branch, which advances updatedAt past createdAt.
    prisma.wallet.upsert.mockResolvedValue({
      id: 'wallet-1',
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 500),
    });

    const result = await initializer.initialize(event);

    expect(result.created).toBe(false);
    expect(result.alreadyExisted).toBe(true);
    expect(prisma.wallet.upsert).toHaveBeenCalledTimes(1);
  });

  it('should produce exactly one wallet across repeated runs', async () => {
    await initializer.initialize(event);

    prisma.wallet.findUnique.mockResolvedValue({ id: 'wallet-1' });
    await initializer.initialize(event);
    await initializer.initialize(event);

    expect(prisma.wallet.upsert).toHaveBeenCalledTimes(1);
  });
});
