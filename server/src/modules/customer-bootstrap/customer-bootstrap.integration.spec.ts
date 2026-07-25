import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { WalletCacheService } from '../wallet/services';
import { CustomerBootstrapService } from './services';
import { UserRegisteredListener } from './listeners';
import { WalletInitializer, CustomerProfileInitializer } from './initializers';
import { UserRegisteredEvent } from './events';
import { BOOTSTRAP_EVENTS } from './constants';

/**
 * Exercises the full pipeline the way runtime does:
 * AuthService emits -> EventEmitter2 -> listener -> bootstrap service ->
 * real initializers, against an in-memory Prisma double.
 */
describe('Customer Bootstrap (integration)', () => {
  let emitter: EventEmitter2;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let bootstrapService: CustomerBootstrapService;

  const userId = 'user-uuid-1';
  const createdAt = new Date('2026-07-25T10:00:00Z');

  // In-memory stores standing in for the unique-constrained tables.
  let wallets: Map<string, { id: string; isActive: boolean }>;
  let profiles: Map<string, { id: string }>;

  const emitRegistration = async (
    provider: 'credentials' | 'google' = 'credentials',
  ): Promise<void> => {
    await emitter.emitAsync(
      BOOTSTRAP_EVENTS.USER_REGISTERED,
      new UserRegisteredEvent(userId, 'user@test.com', provider, new Date(), '127.0.0.1'),
    );
  };

  beforeEach(() => {
    wallets = new Map();
    profiles = new Map();

    prisma = {
      wallet: {
        findUnique: vi.fn(async ({ where }: { where: { userId: string } }) =>
          wallets.get(where.userId) ?? null,
        ),
        upsert: vi.fn(async ({ where }: { where: { userId: string } }) => {
          const existing = wallets.get(where.userId);
          if (existing) {
            return { ...existing, createdAt, updatedAt: new Date(createdAt.getTime() + 500) };
          }
          const wallet = { id: `wallet-${where.userId}`, isActive: true };
          wallets.set(where.userId, wallet);
          return { ...wallet, createdAt, updatedAt: createdAt };
        }),
      },
      customerProfile: {
        findUnique: vi.fn(async ({ where }: { where: { userId?: string; referralCode?: string } }) => {
          if (where.userId) return profiles.get(where.userId) ?? null;
          return null; // referral codes never collide in this double
        }),
        create: vi.fn(async ({ data }: { data: { userId: string } }) => {
          if (profiles.has(data.userId)) {
            throw new Error('Unique constraint failed on user_id');
          }
          const profile = { id: `profile-${data.userId}` };
          profiles.set(data.userId, profile);
          return profile;
        }),
      },
      store: {
        findFirst: vi.fn().mockResolvedValue({ id: 'store-1' }),
      },
    };

    cache = { invalidate: vi.fn(), invalidateAll: vi.fn() };

    const walletInit = new WalletInitializer(
      prisma as unknown as PrismaService,
      cache as unknown as WalletCacheService,
    );
    const profileInit = new CustomerProfileInitializer(
      prisma as unknown as PrismaService,
    );

    bootstrapService = new CustomerBootstrapService([walletInit, profileInit]);
    const listener = new UserRegisteredListener(bootstrapService);

    emitter = new EventEmitter2();
    emitter.on(BOOTSTRAP_EVENTS.USER_REGISTERED, (event: UserRegisteredEvent) =>
      listener.handleUserRegistered(event),
    );
  });

  describe('registration provisions the customer ecosystem', () => {
    it('should give a new customer a wallet and a profile', async () => {
      await emitRegistration();

      expect(wallets.has(userId)).toBe(true);
      expect(profiles.has(userId)).toBe(true);
    });

    it('should provision for google registrations too', async () => {
      await emitRegistration('google');

      expect(wallets.has(userId)).toBe(true);
      expect(profiles.has(userId)).toBe(true);
    });

    it('should invalidate the wallet cache so the wallet page reads fresh state', async () => {
      await emitRegistration();

      expect(cache.invalidate).toHaveBeenCalledWith(userId);
    });

    it('should create the wallet before the profile', async () => {
      const order: string[] = [];
      prisma.wallet.upsert.mockImplementation(async () => {
        order.push('wallet');
        return { id: 'w', createdAt, updatedAt: createdAt };
      });
      prisma.customerProfile.create.mockImplementation(async () => {
        order.push('profile');
        return { id: 'p' };
      });

      await emitRegistration();

      expect(order).toEqual(['wallet', 'profile']);
    });
  });

  describe('downstream module compatibility', () => {
    it('games can assume an active wallet exists immediately after registration', async () => {
      await emitRegistration();

      const wallet = wallets.get(userId);
      expect(wallet).toBeDefined();
      expect(wallet?.isActive).toBe(true);
    });

    it('reward engine never needs to create a wallet', async () => {
      await emitRegistration();

      // Reward evaluation reads the wallet; provisioning already happened.
      const walletCountBefore = wallets.size;
      const wallet = await prisma.wallet.findUnique({ where: { userId } });

      expect(wallet).not.toBeNull();
      expect(wallets.size).toBe(walletCountBefore);
    });
  });

  describe('idempotency', () => {
    it('should not duplicate resources when bootstrap runs twice', async () => {
      await emitRegistration();
      await emitRegistration();

      expect(wallets.size).toBe(1);
      expect(profiles.size).toBe(1);
      expect(prisma.customerProfile.create).toHaveBeenCalledTimes(1);
    });

    it('should report alreadyExisted on a repeat bootstrap', async () => {
      await emitRegistration();

      const result = await bootstrapService.bootstrap(
        new UserRegisteredEvent(userId, 'user@test.com', 'credentials'),
      );

      expect(result.succeeded).toBe(true);
      expect(result.results.every((r) => r.alreadyExisted)).toBe(true);
      expect(result.results.every((r) => !r.created)).toBe(true);
    });

    it('should hold to one wallet and one profile across many runs', async () => {
      await Promise.all([
        emitRegistration(),
        emitRegistration(),
        emitRegistration(),
      ]);

      expect(wallets.size).toBe(1);
      expect(profiles.size).toBe(1);
    });
  });

  describe('resilience', () => {
    it('should still provision the wallet when profile creation fails', async () => {
      prisma.store.findFirst.mockResolvedValue(null);

      await emitRegistration();

      expect(wallets.has(userId)).toBe(true);
      expect(profiles.has(userId)).toBe(false);
    });

    it('should report failure without throwing when the wallet write fails', async () => {
      prisma.wallet.upsert.mockRejectedValue(new Error('DB down'));

      const result = await bootstrapService.bootstrap(
        new UserRegisteredEvent(userId, 'user@test.com', 'credentials'),
      );

      expect(result.succeeded).toBe(false);
      expect(result.results.find((r) => r.name === 'wallet')?.error).toBe('DB down');
      // The profile initializer still ran.
      expect(profiles.has(userId)).toBe(true);
    });
  });

  describe('extensibility', () => {
    it('should let a future module join the pipeline at runtime', async () => {
      const loyaltyInit = {
        name: 'loyalty',
        priority: 30,
        initialize: vi.fn().mockResolvedValue({ created: true, alreadyExisted: false }),
      };

      bootstrapService.registerInitializer(loyaltyInit);
      await emitRegistration();

      expect(loyaltyInit.initialize).toHaveBeenCalled();
      expect(bootstrapService.getInitializerNames()).toEqual([
        'wallet',
        'customer-profile',
        'loyalty',
      ]);
    });
  });
});
