import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { VoucherService } from '../../rewards/services/voucher.service';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import { DashboardVouchersService } from './dashboard-vouchers.service';
import {
  DashboardRedeemVoucherDto,
  DashboardVoucherQueryDto,
} from './dto/dashboard-voucher.dto';

function voucherQuery(
  overrides: Partial<DashboardVoucherQueryDto> = {},
): DashboardVoucherQueryDto {
  const query = new DashboardVoucherQueryDto();
  Object.assign(query, overrides);
  return query;
}

describe('DashboardVouchersService', () => {
  let service: DashboardVouchersService;
  let prisma: Record<string, any>;
  let voucherService: { redeemVoucher: ReturnType<typeof vi.fn> };
  let opsCache: { invalidateStore: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
      rewardVoucher: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    voucherService = {
      redeemVoucher: vi.fn().mockResolvedValue({ valid: true }),
    };
    opsCache = { invalidateStore: vi.fn().mockResolvedValue(undefined) };

    service = new DashboardVouchersService(
      prisma as unknown as PrismaService,
      voucherService as unknown as VoucherService,
      opsCache as unknown as DashboardOpsCacheService,
    );
  });

  describe('list', () => {
    it('should scope to vouchers issued here or held by store customers', async () => {
      await service.list('store-1', voucherQuery());

      const { where } = prisma.rewardVoucher.findMany.mock.calls[0][0];
      expect(where.OR).toEqual([
        { storeId: 'store-1' },
        { user: { customerProfile: { assignedStoreId: 'store-1' } } },
      ]);
    });

    it('should apply status and code filters', async () => {
      await service.list(
        'store-1',
        voucherQuery({ status: 'ACTIVE' as never, code: 'gc-abc' as never }),
      );

      const { where } = prisma.rewardVoucher.findMany.mock.calls[0][0];
      expect(where.status).toBe('ACTIVE');
      expect(where.code).toBe('gc-abc');
    });
  });

  describe('getDetail', () => {
    it('should 404 a voucher outside the store scope', async () => {
      await expect(service.getDetail('store-1', 'voucher-9')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should never return the voucher signature', async () => {
      prisma.rewardVoucher.findFirst.mockResolvedValue({
        id: 'voucher-1',
        code: 'GC-1',
        signature: 'secret-hmac',
        status: 'ACTIVE',
      });

      const detail = await service.getDetail('store-1', 'voucher-1');

      expect(detail).not.toHaveProperty('signature');
      expect(detail).toMatchObject({ id: 'voucher-1', code: 'GC-1' });
    });
  });

  describe('redeem', () => {
    it('should pin both the actor and the redemption store to the principal', async () => {
      const dto = new DashboardRedeemVoucherDto();
      dto.code = 'GC-1';
      dto.signature = 'sig';

      await service.redeem('store-1', dto);

      expect(voucherService.redeemVoucher).toHaveBeenCalledWith(
        'GC-1',
        'sig',
        'store-1',
        'store-1',
      );
    });

    it('should drop the store’s cached counters after a successful scan', async () => {
      await service.redeem('store-1', {
        code: 'GC-1',
        signature: 'sig',
      } as DashboardRedeemVoucherDto);

      expect(opsCache.invalidateStore).toHaveBeenCalledWith('store-1');
    });

    it('should not invalidate anything for a failed scan', async () => {
      voucherService.redeemVoucher.mockResolvedValue({
        valid: false,
        reason: 'expired',
      });

      const result = await service.redeem('store-1', {
        code: 'GC-1',
        signature: 'sig',
      } as DashboardRedeemVoucherDto);

      expect(result.valid).toBe(false);
      expect(opsCache.invalidateStore).not.toHaveBeenCalled();
    });
  });

  describe('history', () => {
    it('should only list vouchers redeemed at this store', async () => {
      await service.history('store-1', voucherQuery());

      const { where, orderBy } = prisma.rewardVoucher.findMany.mock.calls[0][0];
      expect(where.storeId).toBe('store-1');
      expect(where.redeemedAt).toEqual({ not: null });
      expect(orderBy).toEqual({ redeemedAt: 'desc' });
    });
  });
});
