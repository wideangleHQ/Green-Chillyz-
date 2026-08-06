import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DashboardAuthGuard } from '../../dashboard-auth/guards';
import { DashboardPermissionsGuard } from '../common/guards/dashboard-permissions.guard';
import { DashboardVouchersService } from './dashboard-vouchers.service';
import { DashboardVouchersController } from './dashboard-vouchers.controller';
import {
  DashboardRedeemVoucherDto,
  DashboardVoucherQueryDto,
} from './dto/dashboard-voucher.dto';

describe('DashboardVouchersController', () => {
  let controller: DashboardVouchersController;
  let service: Record<'list' | 'history' | 'getDetail' | 'redeem', ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue({ items: [] }),
      history: vi.fn().mockResolvedValue({ items: [] }),
      getDetail: vi.fn().mockResolvedValue({ id: 'voucher-1' }),
      redeem: vi.fn().mockResolvedValue({ valid: true }),
    };
    controller = new DashboardVouchersController(
      service as unknown as DashboardVouchersService,
    );
  });

  it('should be locked behind the dashboard auth and permissions guards', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      DashboardVouchersController,
    ) as unknown[];

    expect(guards).toContain(DashboardAuthGuard);
    expect(guards).toContain(DashboardPermissionsGuard);
  });

  it('should pass the principal store to every read', async () => {
    const query = new DashboardVoucherQueryDto();

    await controller.list('store-1', query);
    await controller.history('store-1', query);
    await controller.getDetail('store-1', 'voucher-1');

    expect(service.list).toHaveBeenCalledWith('store-1', query);
    expect(service.history).toHaveBeenCalledWith('store-1', query);
    expect(service.getDetail).toHaveBeenCalledWith('store-1', 'voucher-1');
  });

  it('should redeem with the store from the session, never from the body', async () => {
    const dto = new DashboardRedeemVoucherDto();
    dto.code = 'GC-1';
    dto.signature = 'sig';

    const result = await controller.redeem('store-1', dto);

    expect(service.redeem).toHaveBeenCalledWith('store-1', dto);
    expect(result).toEqual({ valid: true });
  });
});
