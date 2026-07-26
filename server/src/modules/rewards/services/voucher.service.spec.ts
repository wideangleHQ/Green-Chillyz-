import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { VoucherStatus } from '@prisma/client';
import { VoucherService } from './voucher.service';
import { PrismaService } from '../../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { REWARDS_ERRORS, REWARDS_DEFAULTS } from '../constants';

const futureDate = (days = 30): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const makeVoucher = (overrides: Record<string, unknown> = {}) => ({
  id: 'voucher-1',
  code: 'ABCD1234EFGH',
  signature: 'sig',
  status: VoucherStatus.ACTIVE,
  expiresAt: futureDate(),
  redeemedAt: null,
  createdAt: new Date(),
  userId: 'user-1',
  storeId: 'store-1',
  reward: {
    id: 'reward-1',
    title: 'Free Coffee',
    slug: 'free-coffee',
    image: null,
    coinCost: 100,
    rewardType: 'FREE_ITEM',
  },
  store: { id: 'store-1', name: 'Bhubaneswar Central' },
  ...overrides,
});

describe('VoucherService', () => {
  let service: VoucherService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    prisma = {
      rewardVoucher: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const config = {
      get: vi.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    const eventEmitter = { emit: vi.fn(), emitAsync: vi.fn() };

    service = new VoucherService(
      prisma as unknown as PrismaService,
      config,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('signature', () => {
    it('should produce a verifiable signature', () => {
      const expiresAt = futureDate();
      const sig = service.sign('CODE1234', expiresAt);

      expect(service.verifySignature('CODE1234', expiresAt, sig)).toBe(true);
    });

    it('should reject a tampered code', () => {
      const expiresAt = futureDate();
      const sig = service.sign('CODE1234', expiresAt);

      expect(service.verifySignature('CODE9999', expiresAt, sig)).toBe(false);
    });

    it('should reject a tampered expiry', () => {
      const sig = service.sign('CODE1234', futureDate(30));

      expect(service.verifySignature('CODE1234', futureDate(60), sig)).toBe(false);
    });

    it('should reject a malformed signature without throwing', () => {
      const expiresAt = futureDate();

      expect(service.verifySignature('CODE1234', expiresAt, 'short')).toBe(false);
    });
  });

  describe('createVoucher', () => {
    it('should mint a unique code and store the signature', async () => {
      const tx = {
        rewardVoucher: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'voucher-1',
            code: data.code,
            signature: data.signature,
            expiresAt: data.expiresAt,
          })),
        },
      };

      const result = await service.createVoucher(tx as never, {
        redemptionId: 'redemption-1',
        rewardId: 'reward-1',
        userId: 'user-1',
        storeId: 'store-1',
        validDays: 30,
      });

      expect(result.code).toHaveLength(REWARDS_DEFAULTS.VOUCHER_CODE_LENGTH);
      expect(service.verifySignature(result.code, result.expiresAt, result.signature)).toBe(true);
    });

    it('should retry when a generated code already exists', async () => {
      const tx = {
        rewardVoucher: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({ id: 'collision' })
            .mockResolvedValueOnce(null),
          create: vi.fn().mockResolvedValue({
            id: 'v1', code: 'X', signature: 'S', expiresAt: futureDate(),
          }),
        },
      };

      await service.createVoucher(tx as never, {
        redemptionId: 'r1', rewardId: 'rw1', userId: 'u1', storeId: null, validDays: 30,
      });

      expect(tx.rewardVoucher.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should use only unambiguous characters in codes', async () => {
      const tx = {
        rewardVoucher: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(async ({ data }: { data: { code: string } }) => ({
            id: 'v', code: data.code, signature: 'S', expiresAt: futureDate(),
          })),
        },
      };

      const result = await service.createVoucher(tx as never, {
        redemptionId: 'r', rewardId: 'rw', userId: 'u', storeId: null, validDays: 1,
      });

      for (const char of result.code) {
        expect(REWARDS_DEFAULTS.VOUCHER_CODE_ALPHABET).toContain(char);
      }
      expect(result.code).not.toMatch(/[OI01]/);
    });
  });

  describe('verifyVoucher', () => {
    it('should accept a valid active voucher', async () => {
      const expiresAt = futureDate();
      const signature = service.sign('ABCD1234EFGH', expiresAt);
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ expiresAt, signature }),
      );

      const result = await service.verifyVoucher('ABCD1234EFGH', signature);

      expect(result.valid).toBe(true);
      expect(result.voucher?.code).toBe('ABCD1234EFGH');
    });

    it('should reject an unknown code', async () => {
      const result = await service.verifyVoucher('MISSING', 'sig');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(REWARDS_ERRORS.VOUCHER_NOT_FOUND);
    });

    it('should reject a forged signature (QR tampering)', async () => {
      prisma.rewardVoucher.findUnique.mockResolvedValue(makeVoucher());

      const result = await service.verifyVoucher('ABCD1234EFGH', 'forged-signature');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(REWARDS_ERRORS.VOUCHER_INVALID_SIGNATURE);
    });

    it('should reject an already used voucher (replay)', async () => {
      const expiresAt = futureDate();
      const signature = service.sign('ABCD1234EFGH', expiresAt);
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ expiresAt, signature, status: VoucherStatus.USED }),
      );

      const result = await service.verifyVoucher('ABCD1234EFGH', signature);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(REWARDS_ERRORS.VOUCHER_ALREADY_USED);
    });

    it('should reject an expired voucher', async () => {
      const expiresAt = new Date(Date.now() - 1000);
      const signature = service.sign('ABCD1234EFGH', expiresAt);
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ expiresAt, signature }),
      );

      const result = await service.verifyVoucher('ABCD1234EFGH', signature);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(REWARDS_ERRORS.VOUCHER_EXPIRED);
    });

    it('should reject a store mismatch', async () => {
      const expiresAt = futureDate();
      const signature = service.sign('ABCD1234EFGH', expiresAt);
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ expiresAt, signature, storeId: 'store-1' }),
      );

      const result = await service.verifyVoucher('ABCD1234EFGH', signature, 'store-99');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(REWARDS_ERRORS.VOUCHER_STORE_MISMATCH);
    });
  });

  describe('redeemVoucher', () => {
    it('should mark a valid voucher used', async () => {
      const expiresAt = futureDate();
      const signature = service.sign('ABCD1234EFGH', expiresAt);
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ expiresAt, signature }),
      );

      const result = await service.redeemVoucher('ABCD1234EFGH', signature, 'staff-1');

      expect(result.valid).toBe(true);
      expect(prisma.rewardVoucher.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { code: 'ABCD1234EFGH', status: VoucherStatus.ACTIVE },
        }),
      );
    });

    it('should lose the race gracefully when another scan wins', async () => {
      const expiresAt = futureDate();
      const signature = service.sign('ABCD1234EFGH', expiresAt);
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ expiresAt, signature }),
      );
      // Conditional update matched nothing: someone else already used it.
      prisma.rewardVoucher.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.redeemVoucher('ABCD1234EFGH', signature, 'staff-1');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(REWARDS_ERRORS.VOUCHER_ALREADY_USED);
    });

    it('should not redeem when verification fails', async () => {
      prisma.rewardVoucher.findUnique.mockResolvedValue(makeVoucher());

      const result = await service.redeemVoucher('ABCD1234EFGH', 'bad-sig', 'staff-1');

      expect(result.valid).toBe(false);
      expect(prisma.rewardVoucher.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserVoucher', () => {
    it('should return the voucher for its owner', async () => {
      prisma.rewardVoucher.findUnique.mockResolvedValue(makeVoucher());

      const result = await service.getUserVoucher('user-1', 'voucher-1');

      expect(result.id).toBe('voucher-1');
      expect(result.qrCodeDataUrl).toContain('data:image/png;base64');
    });

    it('should hide vouchers owned by another user', async () => {
      prisma.rewardVoucher.findUnique.mockResolvedValue(makeVoucher({ userId: 'other' }));

      await expect(service.getUserVoucher('user-1', 'voucher-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should omit the QR for a used voucher', async () => {
      prisma.rewardVoucher.findUnique.mockResolvedValue(
        makeVoucher({ status: VoucherStatus.USED }),
      );

      const result = await service.getUserVoucher('user-1', 'voucher-1');

      expect(result.qrCodeDataUrl).toBeNull();
    });
  });

  describe('expireOverdueVouchers', () => {
    it('should flip overdue active vouchers to expired', async () => {
      prisma.rewardVoucher.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.expireOverdueVouchers();

      expect(count).toBe(3);
      expect(prisma.rewardVoucher.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: VoucherStatus.EXPIRED },
        }),
      );
    });
  });
});
