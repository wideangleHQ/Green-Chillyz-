import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AuditActorType,
  Prisma,
  StoreVoucherStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination';
import {
  AUDIT_EVENTS,
  AUDIT_ENTITY_TYPES,
} from '../../audit/constants/audit.constants';
import { EntityMutationAuditEvent } from '../../audit/events/audit.events';
import {
  CreateStoreVoucherDto,
  UpdateStoreVoucherDto,
  StoreVoucherQueryDto,
  RedeemStoreVoucherDto,
} from './dto/store-voucher.dto';

function generateCouponCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class StoreVoucherManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Create ───────────────────────────────────────────────

  async create(storeId: string, dto: CreateStoreVoucherDto) {
    const couponCode = dto.couponCode || generateCouponCode();

    // Ensure code uniqueness
    const existing = await this.prisma.storeVoucher.findUnique({
      where: { couponCode },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        `Coupon code "${couponCode}" is already in use`,
      );
    }

    const totalLimit = dto.totalLimit ?? 0;

    const voucher = await this.prisma.storeVoucher.create({
      data: {
        storeId,
        name: dto.name,
        shortTitle: dto.shortTitle,
        description: dto.description,
        offerTag: dto.offerTag,
        discountBadge: dto.discountBadge,
        offerImage: dto.offerImage,
        bannerImage: dto.bannerImage,
        couponCode,
        voucherType: dto.voucherType,
        minimumOrderValue: dto.minimumOrderValue,
        maximumDiscount: dto.maximumDiscount,
        voucherValue: dto.voucherValue,
        itemsIncluded: dto.itemsIncluded ? JSON.stringify(dto.itemsIncluded) : undefined,
        redeemVenue: dto.redeemVenue,
        validDays: Array.isArray(dto.validDays) ? dto.validDays : Prisma.DbNull,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        validTime: dto.validTime,
        totalLimit,
        remainingCount: totalLimit,
        redeemedCount: 0,
        status: dto.status ?? StoreVoucherStatus.ACTIVE,
        isFeatured: dto.isFeatured ?? false,
        priority: dto.priority ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        terms: Array.isArray(dto.terms) ? dto.terms : Prisma.DbNull,
        metadata: dto.metadata && typeof dto.metadata === 'object' && !Array.isArray(dto.metadata) ? (dto.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });

    // History entry
    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId: voucher.id,
        action: 'CREATED',
        changes: { name: voucher.name, couponCode: voucher.couponCode },
      },
    });

    // Audit event
    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_CREATED,
      new EntityMutationAuditEvent(
        'store_voucher.created',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        voucher.id,
        'CREATE',
        null,
        AuditActorType.STORE_MANAGER,
        null,
        { name: voucher.name, code: voucher.couponCode },
        storeId,
      ),
    );

    return voucher;
  }

  // ─── Update ───────────────────────────────────────────────

  async update(storeId: string, voucherId: string, dto: UpdateStoreVoucherDto) {
    const existing = await this.findVoucherOrFail(storeId, voucherId);

    const data: Prisma.StoreVoucherUpdateInput = {};
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    const fields: Array<{
      key: keyof UpdateStoreVoucherDto;
      dbKey?: string;
      transform?: (v: unknown) => unknown;
    }> = [
      { key: 'name' },
      { key: 'shortTitle' },
      { key: 'description' },
      { key: 'offerTag' },
      { key: 'discountBadge' },
      { key: 'offerImage' },
      { key: 'bannerImage' },
      { key: 'voucherType' },
      { key: 'minimumOrderValue' },
      { key: 'maximumDiscount' },
      { key: 'voucherValue' },
      { key: 'itemsIncluded', transform: (v) => v ? JSON.stringify(v) : null },
      { key: 'redeemVenue' },
      { key: 'validDays', transform: (v) => Array.isArray(v) ? v : Prisma.DbNull },
      { key: 'startDate', transform: (v) => (v ? new Date(v as string) : null) },
      { key: 'endDate', transform: (v) => (v ? new Date(v as string) : null) },
      { key: 'validTime' },
      { key: 'isFeatured' },
      { key: 'priority' },
      { key: 'sortOrder' },
      { key: 'terms', transform: (v) => Array.isArray(v) ? v : Prisma.DbNull },
      { key: 'metadata', transform: (v) => v && typeof v === 'object' && !Array.isArray(v) ? v : Prisma.DbNull },
    ];

    for (const { key, dbKey, transform } of fields) {
      if (dto[key] !== undefined) {
        const dbField = dbKey ?? key;
        const value = transform ? transform(dto[key]) : dto[key];
        (data as Record<string, unknown>)[dbField] = value;
        changes[dbField] = {
          old: (existing as Record<string, unknown>)[key],
          new: value,
        };
      }
    }

    // Handle totalLimit change — adjust remainingCount proportionally
    if (dto.totalLimit !== undefined && dto.totalLimit !== existing.totalLimit) {
      const diff = dto.totalLimit - existing.totalLimit;
      data.totalLimit = dto.totalLimit;
      data.remainingCount = Math.max(0, existing.remainingCount + diff);
      changes.totalLimit = { old: existing.totalLimit, new: dto.totalLimit };
      changes.remainingCount = {
        old: existing.remainingCount,
        new: Math.max(0, existing.remainingCount + diff),
      };
    }

    const updated = await this.prisma.storeVoucher.update({
      where: { id: voucherId },
      data,
    });

    if (Object.keys(changes).length > 0) {
      await this.prisma.storeVoucherHistory.create({
        data: {
          voucherId,
          action: 'UPDATED',
          changes: changes as unknown as Prisma.JsonObject,
        },
      });

      this.eventEmitter.emit(
        AUDIT_EVENTS.STORE_VOUCHER_UPDATED,
        new EntityMutationAuditEvent(
          'store_voucher.updated',
          AUDIT_ENTITY_TYPES.STORE_VOUCHER,
          voucherId,
          'UPDATE',
          null,
          AuditActorType.STORE_MANAGER,
          changes as unknown as Record<string, unknown>,
          { name: updated.name },
          storeId,
        ),
      );
    }

    return updated;
  }

  // ─── List ─────────────────────────────────────────────────

  async list(storeId: string, query: StoreVoucherQueryDto) {
    const where: Prisma.StoreVoucherWhereInput = { storeId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.tag) {
      where.offerTag = query.tag;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { couponCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = new Date(query.toDate);
      }
    }

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.storeVoucher.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.storeVoucher.count({ where }),
    ]);

    return paginate(rows, totalItems, query.page, query.pageSize);
  }

  // ─── Detail ───────────────────────────────────────────────

  async getDetail(storeId: string, voucherId: string) {
    const voucher = await this.prisma.storeVoucher.findFirst({
      where: { id: voucherId, storeId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Store voucher not found');
    }

    return voucher;
  }

  // ─── Archive ──────────────────────────────────────────────

  async archive(storeId: string, voucherId: string) {
    const voucher = await this.findVoucherOrFail(storeId, voucherId);

    if (voucher.status === StoreVoucherStatus.ARCHIVED) {
      throw new BadRequestException('Voucher is already archived');
    }

    const updated = await this.prisma.storeVoucher.update({
      where: { id: voucherId },
      data: {
        status: StoreVoucherStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId,
        action: 'ARCHIVED',
        changes: { previousStatus: voucher.status },
      },
    });

    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_ARCHIVED,
      new EntityMutationAuditEvent(
        'store_voucher.archived',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        voucherId,
        'UPDATE',
        null,
        AuditActorType.STORE_MANAGER,
        { status: voucher.status },
        { status: StoreVoucherStatus.ARCHIVED },
        storeId,
      ),
    );

    return updated;
  }

  // ─── Restore ──────────────────────────────────────────────

  async restore(storeId: string, voucherId: string) {
    const voucher = await this.findVoucherOrFail(storeId, voucherId);

    if (voucher.status !== StoreVoucherStatus.ARCHIVED) {
      throw new BadRequestException('Only archived vouchers can be restored');
    }

    const updated = await this.prisma.storeVoucher.update({
      where: { id: voucherId },
      data: {
        status: StoreVoucherStatus.DRAFT,
        archivedAt: null,
      },
    });

    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId,
        action: 'RESTORED',
        changes: { previousStatus: StoreVoucherStatus.ARCHIVED },
      },
    });

    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_RESTORED,
      new EntityMutationAuditEvent(
        'store_voucher.restored',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        voucherId,
        'UPDATE',
        null,
        AuditActorType.STORE_MANAGER,
        { status: StoreVoucherStatus.ARCHIVED },
        { status: StoreVoucherStatus.DRAFT },
        storeId,
      ),
    );

    return updated;
  }

  // ─── Activate ─────────────────────────────────────────────

  async activate(storeId: string, voucherId: string) {
    const voucher = await this.findVoucherOrFail(storeId, voucherId);

    if (voucher.status === StoreVoucherStatus.ACTIVE) {
      throw new BadRequestException('Voucher is already active');
    }
    if (voucher.status === StoreVoucherStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot activate an archived voucher — restore it first',
      );
    }

    const updated = await this.prisma.storeVoucher.update({
      where: { id: voucherId },
      data: { status: StoreVoucherStatus.ACTIVE },
    });

    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId,
        action: 'ACTIVATED',
        changes: { previousStatus: voucher.status },
      },
    });

    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_STATUS_CHANGED,
      new EntityMutationAuditEvent(
        'store_voucher.status_changed',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        voucherId,
        'UPDATE',
        null,
        AuditActorType.STORE_MANAGER,
        { status: voucher.status },
        { status: StoreVoucherStatus.ACTIVE },
        storeId,
      ),
    );

    return updated;
  }

  // ─── Deactivate ───────────────────────────────────────────

  async deactivate(storeId: string, voucherId: string) {
    const voucher = await this.findVoucherOrFail(storeId, voucherId);

    if (voucher.status === StoreVoucherStatus.PAUSED) {
      throw new BadRequestException('Voucher is already paused');
    }
    if (voucher.status !== StoreVoucherStatus.ACTIVE) {
      throw new BadRequestException('Only active vouchers can be paused');
    }

    const updated = await this.prisma.storeVoucher.update({
      where: { id: voucherId },
      data: { status: StoreVoucherStatus.PAUSED },
    });

    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId,
        action: 'PAUSED',
        changes: { previousStatus: voucher.status },
      },
    });

    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_STATUS_CHANGED,
      new EntityMutationAuditEvent(
        'store_voucher.status_changed',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        voucherId,
        'UPDATE',
        null,
        AuditActorType.STORE_MANAGER,
        { status: voucher.status },
        { status: StoreVoucherStatus.PAUSED },
        storeId,
      ),
    );

    return updated;
  }

  // ─── Duplicate ────────────────────────────────────────────

  async duplicate(storeId: string, voucherId: string) {
    const original = await this.findVoucherOrFail(storeId, voucherId);

    const newCode = generateCouponCode();

    const copy = await this.prisma.storeVoucher.create({
      data: {
        storeId,
        name: `${original.name} (Copy)`,
        shortTitle: original.shortTitle,
        description: original.description,
        offerTag: original.offerTag,
        discountBadge: original.discountBadge,
        offerImage: original.offerImage,
        bannerImage: original.bannerImage,
        couponCode: newCode,
        voucherType: original.voucherType,
        minimumOrderValue: original.minimumOrderValue,
        maximumDiscount: original.maximumDiscount,
        voucherValue: original.voucherValue,
        itemsIncluded: original.itemsIncluded,
        redeemVenue: original.redeemVenue,
        validDays: original.validDays ?? undefined,
        startDate: original.startDate,
        endDate: original.endDate,
        validTime: original.validTime,
        totalLimit: original.totalLimit,
        remainingCount: original.totalLimit,
        status: StoreVoucherStatus.DRAFT,
        isFeatured: original.isFeatured,
        priority: original.priority,
        sortOrder: original.sortOrder,
        terms: original.terms ?? undefined,
        metadata: original.metadata ?? undefined,
      },
    });

    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId: copy.id,
        action: 'CREATED',
        changes: { duplicatedFrom: original.id, originalCode: original.couponCode },
      },
    });

    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_CREATED,
      new EntityMutationAuditEvent(
        'store_voucher.created',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        copy.id,
        'CREATE',
        null,
        AuditActorType.STORE_MANAGER,
        null,
        { name: copy.name, code: copy.couponCode, duplicatedFrom: original.id },
        storeId,
      ),
    );

    return copy;
  }

  // ─── Redeem ───────────────────────────────────────────────

  async redeem(storeId: string, dto: RedeemStoreVoucherDto) {
    const voucher = await this.prisma.storeVoucher.findFirst({
      where: { couponCode: dto.couponCode, storeId },
    });

    if (!voucher) {
      throw new NotFoundException(
        'Voucher not found or does not belong to this store',
      );
    }

    if (voucher.status !== StoreVoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Voucher is not active (current status: ${voucher.status})`,
      );
    }

    const now = new Date();

    if (voucher.endDate && voucher.endDate < now) {
      throw new BadRequestException('Voucher has expired');
    }

    if (voucher.startDate && voucher.startDate > now) {
      throw new BadRequestException('Voucher is not yet valid');
    }

    if (voucher.totalLimit > 0 && voucher.remainingCount <= 0) {
      throw new BadRequestException('Voucher redemption limit reached');
    }

    // Atomically decrement remaining, increment redeemed
    const updated = await this.prisma.storeVoucher.update({
      where: { id: voucher.id },
      data: {
        remainingCount: { decrement: 1 },
        redeemedCount: { increment: 1 },
      },
    });

    // Create redemption record
    const redemption = await this.prisma.storeVoucherRedemption.create({
      data: {
        voucherId: voucher.id,
        storeId,
      },
    });

    // History
    await this.prisma.storeVoucherHistory.create({
      data: {
        voucherId: voucher.id,
        action: 'REDEEMED',
        changes: {
          redemptionId: redemption.id,
          remainingAfter: updated.remainingCount,
          redeemedAfter: updated.redeemedCount,
        },
      },
    });

    // Audit
    this.eventEmitter.emit(
      AUDIT_EVENTS.STORE_VOUCHER_REDEEMED,
      new EntityMutationAuditEvent(
        'store_voucher.redeemed',
        AUDIT_ENTITY_TYPES.STORE_VOUCHER,
        voucher.id,
        'UPDATE',
        null,
        AuditActorType.STORE_MANAGER,
        { remainingCount: voucher.remainingCount },
        { remainingCount: updated.remainingCount },
        storeId,
      ),
    );

    return {
      success: true,
      voucher: updated,
      redemption,
    };
  }

  // ─── History ──────────────────────────────────────────────

  async getHistory(
    storeId: string,
    voucherId: string,
    query: StoreVoucherQueryDto,
  ) {
    // Verify the voucher belongs to the store
    await this.findVoucherOrFail(storeId, voucherId);

    const where: Prisma.StoreVoucherHistoryWhereInput = { voucherId };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.storeVoucherHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.storeVoucherHistory.count({ where }),
    ]);

    return paginate(rows, totalItems, query.page, query.pageSize);
  }

  // ─── Analytics ────────────────────────────────────────────

  async getAnalytics(storeId: string) {
    const [totals, statusCounts, topRedeemed] = await Promise.all([
      this.prisma.storeVoucher.aggregate({
        where: { storeId },
        _sum: { redeemedCount: true, remainingCount: true, totalLimit: true },
        _count: true,
      }),
      this.prisma.storeVoucher.groupBy({
        by: ['status'],
        where: { storeId },
        _count: true,
      }),
      this.prisma.storeVoucher.findMany({
        where: { storeId, redeemedCount: { gt: 0 } },
        orderBy: { redeemedCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          couponCode: true,
          redeemedCount: true,
          totalLimit: true,
        },
      }),
    ]);

    const totalCreated = totals._count;
    const totalRedeemed = totals._sum.redeemedCount ?? 0;
    const totalRemaining = totals._sum.remainingCount ?? 0;
    const totalLimit = totals._sum.totalLimit ?? 0;

    const expired =
      statusCounts.find((s) => s.status === StoreVoucherStatus.EXPIRED)?._count ?? 0;

    const conversionRate =
      totalLimit > 0
        ? Math.round((totalRedeemed / totalLimit) * 10000) / 100
        : 0;

    return {
      totalCreated,
      totalRedeemed,
      totalRemaining,
      expired,
      conversionRate,
      mostRedeemed: topRedeemed,
      byStatus: statusCounts.reduce(
        (acc, s) => {
          acc[s.status] = s._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  // ─── Customer-facing vouchers ─────────────────────────────

  async getCustomerVouchers(storeId: string) {
    const now = new Date();

    return this.prisma.storeVoucher.findMany({
      where: {
        storeId,
        status: StoreVoucherStatus.ACTIVE,
        archivedAt: null,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          { OR: [{ totalLimit: 0 }, { remainingCount: { gt: 0 } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        shortTitle: true,
        description: true,
        offerTag: true,
        discountBadge: true,
        offerImage: true,
        bannerImage: true,
        couponCode: true,
        voucherType: true,
        minimumOrderValue: true,
        maximumDiscount: true,
        voucherValue: true,
        itemsIncluded: true,
        redeemVenue: true,
        validDays: true,
        startDate: true,
        endDate: true,
        validTime: true,
        isFeatured: true,
        terms: true,
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async findVoucherOrFail(storeId: string, voucherId: string) {
    const voucher = await this.prisma.storeVoucher.findFirst({
      where: { id: voucherId, storeId },
    });

    if (!voucher) {
      throw new NotFoundException('Store voucher not found');
    }

    return voucher;
  }
}
