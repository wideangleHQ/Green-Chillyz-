import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { DashboardCustomerScopeService } from './dashboard-customer-scope.service';

describe('DashboardCustomerScopeService', () => {
  let service: DashboardCustomerScopeService;
  let customerProfile: { findFirst: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    customerProfile = {
      findFirst: vi.fn().mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        assignedStoreId: 'store-1',
        user: { fullName: 'Asha Rao' },
      }),
    };
    service = new DashboardCustomerScopeService({
      customerProfile,
    } as unknown as PrismaService);
  });

  describe('assertCustomerInStore', () => {
    it('should return the scoped identity for an in-store customer', async () => {
      const result = await service.assertCustomerInStore('user-1', 'store-1');

      expect(result).toEqual({
        userId: 'user-1',
        customerProfileId: 'profile-1',
        assignedStoreId: 'store-1',
        fullName: 'Asha Rao',
      });
    });

    it('should filter by both the customer and the store in one query', async () => {
      await service.assertCustomerInStore('user-1', 'store-1');

      const { where } = customerProfile.findFirst.mock.calls[0][0];
      expect(where.userId).toBe('user-1');
      expect(where.assignedStoreId).toBe('store-1');
    });

    it('should exclude soft-deleted users', async () => {
      await service.assertCustomerInStore('user-1', 'store-1');

      const { where } = customerProfile.findFirst.mock.calls[0][0];
      expect(where.user).toEqual({ deletedAt: null });
    });

    it('should report an out-of-scope customer as not found, never forbidden', async () => {
      customerProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCustomerInStore('user-2', 'store-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('storeScopedUserFilter', () => {
    it('should scope to the assigned store and exclude deleted users', () => {
      expect(service.storeScopedUserFilter('store-1')).toEqual({
        deletedAt: null,
        customerProfile: { assignedStoreId: 'store-1' },
      });
    });
  });
});
