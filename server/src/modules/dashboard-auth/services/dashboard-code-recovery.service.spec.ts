import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DashboardCodeRecoveryService } from './dashboard-code-recovery.service';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';
import { DashboardStoreRepository } from '../repositories';

const storeRow = {
  id: 'store-1',
  name: 'GreenChillyz Cuttack',
  slug: 'greenchillyz-cuttack',
  code: 'CTK',
  dashboardCodeEncrypted: 'iv:tag:ct',
};

describe('DashboardCodeRecoveryService', () => {
  let service: DashboardCodeRecoveryService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let cipher: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      findRecoverableCode: vi.fn().mockResolvedValue(storeRow),
    };
    cipher = {
      isAvailable: vi.fn().mockReturnValue(true),
      decrypt: vi.fn().mockReturnValue('GC-CTK-4051'),
    };

    service = new DashboardCodeRecoveryService(
      repository as unknown as DashboardStoreRepository,
      cipher as unknown as DashboardCodeCipherService,
    );
  });

  it('should return the store identity alongside the code', async () => {
    const result = await service.recover('store-1');

    expect(result).toEqual({
      storeId: 'store-1',
      storeName: 'GreenChillyz Cuttack',
      storeSlug: 'greenchillyz-cuttack',
      storeCode: 'CTK',
      accessCode: 'GC-CTK-4051',
    });
  });

  it('should report availability from the cipher', () => {
    expect(service.isRecoveryAvailable()).toBe(true);

    cipher.isAvailable.mockReturnValue(false);
    expect(service.isRecoveryAvailable()).toBe(false);
  });

  it('should refuse when no encryption key is configured', async () => {
    cipher.isAvailable.mockReturnValue(false);

    await expect(service.recover('store-1')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(repository.findRecoverableCode).not.toHaveBeenCalled();
  });

  it('should throw when the store does not exist', async () => {
    repository.findRecoverableCode.mockResolvedValue(null);

    await expect(service.recover('missing')).rejects.toThrow(NotFoundException);
  });

  it('should throw when the store has no stored ciphertext', async () => {
    repository.findRecoverableCode.mockResolvedValue({
      ...storeRow,
      dashboardCodeEncrypted: null,
    });

    await expect(service.recover('store-1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('should throw when the ciphertext will not decrypt', async () => {
    // Key rotated since the value was written.
    cipher.decrypt.mockReturnValue(null);

    await expect(service.recover('store-1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('should never verify a code — that is the hash path', async () => {
    await service.recover('store-1');

    expect((cipher as Record<string, unknown>).verify).toBeUndefined();
    expect(cipher.decrypt).toHaveBeenCalledWith('iv:tag:ct');
  });
});
