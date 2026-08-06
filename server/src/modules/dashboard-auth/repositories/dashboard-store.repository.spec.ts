import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardStoreRepository } from './dashboard-store.repository';

describe('DashboardStoreRepository', () => {
  let repository: DashboardStoreRepository;
  let store: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ dashboardFailedAttempts: 1 }),
    };

    repository = new DashboardStoreRepository({
      store,
    } as unknown as PrismaService);
  });

  describe('findCredentialByLookup', () => {
    it('should query the unique blind index', async () => {
      await repository.findCredentialByLookup('lookup-1');

      expect(store.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dashboardCodeLookup: 'lookup-1' },
        }),
      );
    });

    it('should select only the credential columns', async () => {
      await repository.findCredentialByLookup('lookup-1');

      const { select } = store.findUnique.mock.calls[0][0];
      expect(Object.keys(select).sort()).toEqual(
        [
          'brandId',
          'dashboardAccessEnabled',
          'dashboardCodeHash',
          'dashboardFailedAttempts',
          'dashboardLockedUntil',
          'deletedAt',
          'id',
          'isActive',
          'slug',
        ].sort(),
      );
    });

    it('should never select the lookup index back out', async () => {
      await repository.findCredentialByLookup('lookup-1');

      const { select } = store.findUnique.mock.calls[0][0];
      expect(select.dashboardCodeLookup).toBeUndefined();
    });

    it('should issue exactly one query', async () => {
      await repository.findCredentialByLookup('lookup-1');

      expect(store.findUnique).toHaveBeenCalledTimes(1);
      expect(store.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('findContextById', () => {
    it('should exclude soft-deleted stores', async () => {
      await repository.findContextById('store-1');

      expect(store.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'store-1', deletedAt: null },
        }),
      );
    });

    it('should join the brand in the same query rather than a second read', async () => {
      await repository.findContextById('store-1');

      const { select } = store.findFirst.mock.calls[0][0];
      expect(select.brand).toEqual({
        select: { id: true, name: true, slug: true },
      });
      expect(store.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAccessStateById', () => {
    it('should read only the four access flags', async () => {
      await repository.findAccessStateById('store-1');

      const { select } = store.findUnique.mock.calls[0][0];
      expect(Object.keys(select).sort()).toEqual([
        'dashboardAccessEnabled',
        'deletedAt',
        'id',
        'isActive',
      ]);
    });
  });

  describe('recordSuccessfulLogin', () => {
    it('should stamp the login and clear the failure state in one update', async () => {
      await repository.recordSuccessfulLogin('store-1', '203.0.113.10');

      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update.mock.calls[0][0].data).toEqual({
        dashboardLastLoginAt: expect.any(Date),
        dashboardLastLoginIp: '203.0.113.10',
        dashboardFailedAttempts: 0,
        dashboardLockedUntil: null,
      });
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment atomically in the database', async () => {
      await repository.incrementFailedAttempts('store-1');

      expect(store.update.mock.calls[0][0].data).toEqual({
        dashboardFailedAttempts: { increment: 1 },
      });
    });

    it('should return the resulting count', async () => {
      store.update.mockResolvedValue({ dashboardFailedAttempts: 4 });

      const result = await repository.incrementFailedAttempts('store-1');

      expect(result.dashboardFailedAttempts).toBe(4);
    });
  });

  describe('applyLock / clearLock', () => {
    it('should set the lock timestamp', async () => {
      const until = new Date();
      await repository.applyLock('store-1', until);

      expect(store.update.mock.calls[0][0].data).toEqual({
        dashboardLockedUntil: until,
      });
    });

    it('should clear both the lock and the counter', async () => {
      await repository.clearLock('store-1');

      expect(store.update.mock.calls[0][0].data).toEqual({
        dashboardFailedAttempts: 0,
        dashboardLockedUntil: null,
      });
    });
  });

  describe('setAccessCode', () => {
    it('should store the hash and index and stamp the rotation', async () => {
      await repository.setAccessCode('store-1', 'hash', 'lookup');

      expect(store.update.mock.calls[0][0].data).toEqual({
        dashboardCodeHash: 'hash',
        dashboardCodeLookup: 'lookup',
        dashboardLastRotatedAt: expect.any(Date),
        dashboardFailedAttempts: 0,
        dashboardLockedUntil: null,
      });
    });

    it('should release any existing lock, so a new code works immediately', async () => {
      await repository.setAccessCode('store-1', 'hash', 'lookup');

      expect(store.update.mock.calls[0][0].data.dashboardLockedUntil).toBeNull();
    });
  });
});
