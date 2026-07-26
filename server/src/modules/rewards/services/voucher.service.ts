import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';
import { Prisma, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination/paginator';
import { PaginatedResponse } from '../../../common/interfaces';
import { VoucherQueryDto } from '../dto';
import {
  VoucherResponse,
  VoucherPayload,
  VoucherVerificationResult,
} from '../interfaces';
import { REWARDS_ERRORS, REWARDS_DEFAULTS } from '../constants';
import { AUDIT_EVENTS } from '../../audit/constants';
import { VoucherRedeemedAuditEvent } from '../../audit/events';

type VoucherWithRelations = Prisma.RewardVoucherGetPayload<{
  include: {
    reward: {
      select: {
        id: true;
        title: true;
        slug: true;
        image: true;
        coinCost: true;
        rewardType: true;
      };
    };
    store: { select: { id: true; name: true } };
  };
}>;

const VOUCHER_INCLUDE = {
  reward: {
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      coinCost: true,
      rewardType: true,
    },
  },
  store: { select: { id: true, name: true } },
} as const;

/**
 * Owns voucher lifecycle: cryptographically unique codes, HMAC-signed QR
 * payloads, verification and in-store redemption.
 *
 * The QR carries only the code, a signature and an expiry — never internal
 * IDs — so a scanned payload leaks nothing and cannot be forged without the
 * server secret.
 */
@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const secret = this.configService.get<string>('auth.jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET is required to sign reward vouchers');
    }
    this.secret = secret;
  }

  /**
   * Create the immutable voucher for a completed redemption.
   * Runs inside the redemption transaction so a voucher never exists
   * without its redemption (and vice versa).
   */
  async createVoucher(
    tx: Prisma.TransactionClient,
    params: {
      redemptionId: string;
      rewardId: string;
      userId: string;
      storeId: string | null;
      validDays: number;
    },
  ): Promise<{ id: string; code: string; signature: string; expiresAt: Date }> {
    const code = await this.generateUniqueCode(tx);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + params.validDays);

    const signature = this.sign(code, expiresAt);

    const voucher = await tx.rewardVoucher.create({
      data: {
        redemptionId: params.redemptionId,
        rewardId: params.rewardId,
        userId: params.userId,
        storeId: params.storeId,
        code,
        signature,
        status: VoucherStatus.ACTIVE,
        expiresAt,
      },
      select: { id: true, code: true, signature: true, expiresAt: true },
    });

    return voucher;
  }

  /** HMAC over code + expiry. Tampering with either invalidates the payload. */
  sign(code: string, expiresAt: Date): string {
    return createHmac('sha256', this.secret)
      .update(`${code}.${expiresAt.toISOString()}`)
      .digest('hex');
  }

  verifySignature(code: string, expiresAt: Date, signature: string): boolean {
    const expected = this.sign(code, expiresAt);
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  buildQrPayload(code: string, signature: string, expiresAt: Date): VoucherPayload {
    return { code, signature, expiresAt: expiresAt.toISOString() };
  }

  async generateQrDataUrl(payload: VoucherPayload): Promise<string | null> {
    try {
      return await QRCode.toDataURL(JSON.stringify(payload), {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 320,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`QR generation failed for voucher ${payload.code}: ${message}`);
      return null;
    }
  }

  async listUserVouchers(
    userId: string,
    query: VoucherQueryDto,
  ): Promise<PaginatedResponse<VoucherResponse>> {
    // Lazily settle expired vouchers so listings never show a stale ACTIVE.
    await this.expireOverdueVouchers(userId);

    const where: Prisma.RewardVoucherWhereInput = {
      userId,
      ...(query.status && { status: query.status }),
    };

    const [vouchers, total] = await Promise.all([
      this.prisma.rewardVoucher.findMany({
        where,
        include: VOUCHER_INCLUDE,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardVoucher.count({ where }),
    ]);

    const items = await Promise.all(
      vouchers.map((v) => this.toVoucherResponse(v, true)),
    );

    return paginate(items, total, query.page, query.pageSize);
  }

  async getUserVoucher(userId: string, voucherId: string): Promise<VoucherResponse> {
    const voucher = await this.prisma.rewardVoucher.findUnique({
      where: { id: voucherId },
      include: VOUCHER_INCLUDE,
    });

    if (!voucher || voucher.userId !== userId) {
      // Same error whether missing or owned by someone else — no enumeration.
      throw new NotFoundException(REWARDS_ERRORS.VOUCHER_NOT_FOUND);
    }

    return this.toVoucherResponse(voucher, true);
  }

  /**
   * Validate a scanned QR payload without mutating anything.
   * Used by store staff before committing the redemption.
   */
  async verifyVoucher(
    code: string,
    signature: string,
    storeId?: string,
  ): Promise<VoucherVerificationResult> {
    const voucher = await this.prisma.rewardVoucher.findUnique({
      where: { code },
      include: VOUCHER_INCLUDE,
    });

    if (!voucher) {
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_NOT_FOUND };
    }

    if (!this.verifySignature(voucher.code, voucher.expiresAt, signature)) {
      this.logger.warn(`Voucher signature mismatch for code ${code}`);
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_INVALID_SIGNATURE };
    }

    if (voucher.status === VoucherStatus.USED) {
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_ALREADY_USED };
    }

    if (voucher.status !== VoucherStatus.ACTIVE) {
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_NOT_ACTIVE };
    }

    if (voucher.expiresAt.getTime() <= Date.now()) {
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_EXPIRED };
    }

    if (storeId && voucher.storeId && voucher.storeId !== storeId) {
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_STORE_MISMATCH };
    }

    return {
      valid: true,
      voucher: await this.toVoucherResponse(voucher, false),
    };
  }

  /**
   * Mark a voucher used. The conditional update is the replay guard: only a
   * row still ACTIVE transitions, so concurrent scans cannot both succeed.
   */
  async redeemVoucher(
    code: string,
    signature: string,
    staffUserId: string,
    storeId?: string,
  ): Promise<VoucherVerificationResult> {
    const verification = await this.verifyVoucher(code, signature, storeId);
    if (!verification.valid) {
      return verification;
    }

    const updated = await this.prisma.rewardVoucher.updateMany({
      where: { code, status: VoucherStatus.ACTIVE },
      data: {
        status: VoucherStatus.USED,
        redeemedAt: new Date(),
        redeemedBy: staffUserId,
        ...(storeId && { storeId }),
      },
    });

    if (updated.count === 0) {
      // Another scan won the race between verify and update.
      return { valid: false, reason: REWARDS_ERRORS.VOUCHER_ALREADY_USED };
    }

    const voucher = await this.prisma.rewardVoucher.findUnique({
      where: { code },
      include: VOUCHER_INCLUDE,
    });

    this.logger.log(`Voucher ${code} redeemed by staff ${staffUserId}`);

    if (voucher) {
      this.eventEmitter.emit(
        AUDIT_EVENTS.VOUCHER_REDEEMED,
        new VoucherRedeemedAuditEvent(
          voucher.id,
          voucher.code,
          voucher.userId,
          staffUserId,
          voucher.storeId,
          voucher.reward.title,
          false,
        ),
      );
    }

    return {
      valid: true,
      voucher: voucher ? await this.toVoucherResponse(voucher, false) : undefined,
    };
  }

  async cancelVoucher(voucherId: string): Promise<void> {
    await this.prisma.rewardVoucher.updateMany({
      where: { id: voucherId, status: VoucherStatus.ACTIVE },
      data: { status: VoucherStatus.CANCELLED, cancelledAt: new Date() },
    });
  }

  /** Flip ACTIVE vouchers past their expiry to EXPIRED. */
  async expireOverdueVouchers(userId?: string): Promise<number> {
    const result = await this.prisma.rewardVoucher.updateMany({
      where: {
        status: VoucherStatus.ACTIVE,
        expiresAt: { lte: new Date() },
        ...(userId && { userId }),
      },
      data: { status: VoucherStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} voucher(s)`);
    }
    return result.count;
  }

  async toVoucherResponse(
    voucher: VoucherWithRelations,
    includeQr: boolean,
  ): Promise<VoucherResponse> {
    // QR is only meaningful while the voucher can still be scanned.
    const qrCodeDataUrl =
      includeQr && voucher.status === VoucherStatus.ACTIVE
        ? await this.generateQrDataUrl(
            this.buildQrPayload(voucher.code, voucher.signature, voucher.expiresAt),
          )
        : null;

    return {
      id: voucher.id,
      code: voucher.code,
      status: voucher.status,
      qrCodeDataUrl,
      expiresAt: voucher.expiresAt,
      redeemedAt: voucher.redeemedAt,
      createdAt: voucher.createdAt,
      reward: {
        id: voucher.reward.id,
        title: voucher.reward.title,
        slug: voucher.reward.slug,
        image: voucher.reward.image,
        coinCost: voucher.reward.coinCost,
        rewardType: voucher.reward.rewardType,
      },
      store: voucher.store ? { id: voucher.store.id, name: voucher.store.name } : null,
    };
  }

  private async generateUniqueCode(tx: Prisma.TransactionClient): Promise<string> {
    for (
      let attempt = 0;
      attempt < REWARDS_DEFAULTS.VOUCHER_CODE_MAX_ATTEMPTS;
      attempt++
    ) {
      const code = this.randomCode();
      const existing = await tx.rewardVoucher.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    // Astronomically unlikely; the unique constraint is the final backstop.
    throw new Error('Unable to generate a unique voucher code');
  }

  private randomCode(): string {
    const alphabet = REWARDS_DEFAULTS.VOUCHER_CODE_ALPHABET;
    let code = '';
    for (let i = 0; i < REWARDS_DEFAULTS.VOUCHER_CODE_LENGTH; i++) {
      code += alphabet[randomInt(alphabet.length)];
    }
    return code;
  }
}
