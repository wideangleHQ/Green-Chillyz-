import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { CustomerProfileInitializer } from './customer-profile.initializer';
import { PrismaService } from '../../../database/prisma.service';
import { UserRegisteredEvent } from '../events';
import {
  BOOTSTRAP_PRIORITY,
  BOOTSTRAP_INITIALIZER_NAMES,
  BOOTSTRAP_DEFAULTS,
  BOOTSTRAP_ERRORS,
} from '../constants';

describe('CustomerProfileInitializer', () => {
  let initializer: CustomerProfileInitializer;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;

  const userId = 'user-uuid-1';
  const event = new UserRegisteredEvent(userId, 'user@test.com', 'credentials');

  beforeEach(() => {
    prisma = {
      customerProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'profile-1' }),
      },
      store: {
        findFirst: vi.fn().mockResolvedValue({ id: 'store-1' }),
      },
    };

    initializer = new CustomerProfileInitializer(
      prisma as unknown as PrismaService,
    );
  });

  it('should expose a stable name and run after the wallet', () => {
    expect(initializer.name).toBe(BOOTSTRAP_INITIALIZER_NAMES.CUSTOMER_PROFILE);
    expect(initializer.priority).toBe(BOOTSTRAP_PRIORITY.CUSTOMER_PROFILE);
    expect(initializer.priority).toBeGreaterThan(BOOTSTRAP_PRIORITY.WALLET);
  });

  it('should create a profile assigned to the earliest active store', async () => {
    const result = await initializer.initialize(event);

    expect(result.created).toBe(true);
    expect(prisma.store.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
    expect(prisma.customerProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId, assignedStoreId: 'store-1' }),
      }),
    );
  });

  it('should generate a referral code of the configured shape', async () => {
    await initializer.initialize(event);

    const code = prisma.customerProfile.create.mock.calls[0][0].data.referralCode;
    expect(code).toHaveLength(BOOTSTRAP_DEFAULTS.REFERRAL_CODE_LENGTH);
    for (const char of code) {
      expect(BOOTSTRAP_DEFAULTS.REFERRAL_CODE_ALPHABET).toContain(char);
    }
  });

  it('should retry until it finds an unused referral code', async () => {
    prisma.customerProfile.findUnique
      .mockResolvedValueOnce(null) // profile lookup
      .mockResolvedValueOnce({ id: 'taken' }) // first code collides
      .mockResolvedValueOnce(null); // second code is free

    const result = await initializer.initialize(event);

    expect(result.created).toBe(true);
    expect(prisma.customerProfile.create).toHaveBeenCalled();
  });

  it('should be idempotent: skip when a profile already exists', async () => {
    prisma.customerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });

    const result = await initializer.initialize(event);

    expect(result.created).toBe(false);
    expect(result.alreadyExisted).toBe(true);
    expect(prisma.customerProfile.create).not.toHaveBeenCalled();
  });

  it('should treat a concurrent insert as already existing', async () => {
    prisma.customerProfile.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    const result = await initializer.initialize(event);

    expect(result.created).toBe(false);
    expect(result.alreadyExisted).toBe(true);
  });

  it('should degrade gracefully when no active store exists', async () => {
    prisma.store.findFirst.mockResolvedValue(null);

    const result = await initializer.initialize(event);

    expect(result.created).toBe(false);
    expect(result.detail).toBe(BOOTSTRAP_ERRORS.NO_DEFAULT_STORE);
    expect(prisma.customerProfile.create).not.toHaveBeenCalled();
  });

  it('should propagate unexpected database errors', async () => {
    prisma.customerProfile.create.mockRejectedValue(new Error('connection lost'));

    await expect(initializer.initialize(event)).rejects.toThrow('connection lost');
  });
});
