import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination';
import { VoucherService } from '../../rewards/services/voucher.service';
import { DASHBOARD_OPS_ERRORS } from '../common/constants';
import { DashboardOpsCacheService } from '../common/services/dashboard-ops-cache.service';
import {
  DashboardRedeemVoucherDto,
  DashboardVoucherQueryDto,
} from './dto/dashboard-voucher.dto';

const VOUCHER_LIST_SELECT = {
  id: true,
  code: true,
  status: true,
  expiresAt: true,
  redeemedAt: true,
  createdAt: true,
  reward: { select: { id: true, title: true, coinCost: true } },
  user: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.RewardVoucherSelect;

/**
 * Store voucher operations.
 *
 * Redemption — validation, signature check, race protection and the audit
 * event — is `VoucherService.redeemVoucher` verbatim; the dashboard only
 * pins the acting store from the principal. Reads are scoped to vouchers
 * issued at this store or held by its customers.
 */
@Injectable()
export class DashboardVouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly voucherService: VoucherService,
    private readonly opsCache: DashboardOpsCacheService,
  ) {}

  /** Vouchers visible to this store: issued here, or held by its customers. */
  private storeVoucherWhere(storeId: string): Prisma.RewardVoucherWhereInput {
    return {
      OR: [
        { storeId },
        { user: { customerProfile: { assignedStoreId: storeId } } },
      ],
    };
  }

  async list(storeId: string, query: DashboardVoucherQueryDto) {
    const where: Prisma.RewardVoucherWhereInput = {
      ...this.storeVoucherWhere(storeId),
      ...(query.status ? { status: query.status } : {}),
      ...(query.code ? { code: query.code } : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.rewardVoucher.findMany({
        where,
        select: VOUCHER_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardVoucher.count({ where }),
    ]);

    return paginate(rows, totalItems, query.page, query.pageSize);
  }

  async getDetail(storeId: string, voucherId: string) {
    const voucher = await this.prisma.rewardVoucher.findFirst({
      where: { id: voucherId, ...this.storeVoucherWhere(storeId) },
      select: {
        ...VOUCHER_LIST_SELECT,
        signature: true,
        redeemedBy: true,
        cancelledAt: true,
        updatedAt: true,
        redemption: {
          select: { id: true, status: true, coinsSpent: true, createdAt: true },
        },
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!voucher) {
      throw new NotFoundException(DASHBOARD_OPS_ERRORS.VOUCHER_NOT_FOUND);
    }

    // The signature is a verification secret; it never leaves the backend.
    const { signature: _signature, ...safe } = voucher;
    return safe;
  }

  /**
   * Redeems a scanned voucher for this store. Delegates entirely to
   * `VoucherService` (verification, race handling, audit event); the store id
   * from the session is both the acting principal and the redemption store.
   */
  async redeem(storeId: string, dto: DashboardRedeemVoucherDto) {
    const result = await this.voucherService.redeemVoucher(
      dto.code,
      dto.signature,
      storeId,
      storeId,
    );

    if (result.valid) {
      // Counters for this store changed; drop its cached operational reads.
      await this.opsCache.invalidateStore(storeId);
    }

    return result;
  }

  /** Vouchers redeemed at this store, most recent first. */
  async history(storeId: string, query: DashboardVoucherQueryDto) {
    const where: Prisma.RewardVoucherWhereInput = {
      storeId,
      redeemedAt: { not: null },
      ...(query.code ? { code: query.code } : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.rewardVoucher.findMany({
        where,
        select: VOUCHER_LIST_SELECT,
        orderBy: { redeemedAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardVoucher.count({ where }),
    ]);

    return paginate(rows, totalItems, query.page, query.pageSize);
  }
}
