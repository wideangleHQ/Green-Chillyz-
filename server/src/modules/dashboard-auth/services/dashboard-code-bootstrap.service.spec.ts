import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardCodeBootstrapService } from './dashboard-code-bootstrap.service';
import { DashboardAccessCodeService } from './dashboard-access-code.service';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';
import { DashboardStoreRepository } from '../repositories';
import { DASHBOARD_EVENTS } from '../constants';

const store = (id: string, code: string | null = 'GC-CTK-4051') => ({
  id,
  slug: `store-${id}`,
  dashboardCode: code,
  dashboardCodeEncrypted: null,
});

describe('DashboardCodeBootstrapService', () => {
  let service: DashboardCodeBootstrapService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let accessCode: Record<string, ReturnType<typeof vi.fn>>;
  let cipher: Record<string, ReturnType<typeof vi.fn>>;
  let emitter: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      countUninitializedCodes: vi.fn().mockResolvedValue(0),
      findUninitializedCodes: vi.fn().mockResolvedValue([]),
      initializeAccessCode: vi.fn().mockResolvedValue(true),
      findInitializedWithoutCiphertext: vi.fn().mockResolvedValue([]),
      setEncryptedCode: vi.fn(),
    };
    accessCode = {
      hash: vi.fn().mockResolvedValue('$argon2id$hash'),
      lookupIndex: vi.fn().mockReturnValue('lookup-hex'),
    };
    cipher = {
      encrypt: vi.fn().mockReturnValue('iv:tag:ct'),
      isAvailable: vi.fn().mockReturnValue(true),
    };
    emitter = { emit: vi.fn() };

    service = new DashboardCodeBootstrapService(
      repository as unknown as DashboardStoreRepository,
      accessCode as unknown as DashboardAccessCodeService,
      cipher as unknown as DashboardCodeCipherService,
      emitter as unknown as EventEmitter2,
    );
  });

  describe('idempotency', () => {
    it('should do nothing when no store is pending', async () => {
      const result = await service.bootstrap();

      expect(result.initialized).toBe(0);
      expect(repository.findUninitializedCodes).not.toHaveBeenCalled();
      expect(accessCode.hash).not.toHaveBeenCalled();
    });

    it('should not re-hash an already initialized store', async () => {
      // A second run sees a zero count because initialized rows drop out of
      // the predicate.
      repository.countUninitializedCodes
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1')])
        .mockResolvedValue([]);

      await service.bootstrap();
      accessCode.hash.mockClear();

      const second = await service.bootstrap();

      expect(second.initialized).toBe(0);
      expect(accessCode.hash).not.toHaveBeenCalled();
    });

    it('should query only stores missing a hash', async () => {
      repository.countUninitializedCodes.mockResolvedValue(1);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1')])
        .mockResolvedValue([]);

      await service.bootstrap();

      // The predicate lives in the repository; the service must not filter
      // client-side over every store.
      expect(repository.findUninitializedCodes).toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    beforeEach(() => {
      repository.countUninitializedCodes.mockResolvedValue(1);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1')])
        .mockResolvedValue([]);
    });

    it('should derive hash, lookup and ciphertext', async () => {
      const result = await service.bootstrap();

      expect(result.initialized).toBe(1);
      expect(accessCode.hash).toHaveBeenCalledWith('GC-CTK-4051');
      expect(accessCode.lookupIndex).toHaveBeenCalledWith('GC-CTK-4051');
      expect(cipher.encrypt).toHaveBeenCalledWith('GC-CTK-4051');
    });

    it('should persist all three derived values', async () => {
      await service.bootstrap();

      expect(repository.initializeAccessCode).toHaveBeenCalledWith(
        's1',
        '$argon2id$hash',
        'lookup-hex',
        'iv:tag:ct',
      );
    });

    it('should emit CODE_INITIALIZED', async () => {
      await service.bootstrap();

      expect(emitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.CODE_INITIALIZED,
        expect.objectContaining({ storeId: 's1', encrypted: true }),
      );
    });

    it('should never emit the plaintext code', async () => {
      await service.bootstrap();

      const payload = JSON.stringify(emitter.emit.mock.calls[0][1]);
      expect(payload).not.toContain('GC-CTK-4051');
    });

    it('should trim a padded code before deriving', async () => {
      repository.findUninitializedCodes
        .mockReset()
        .mockResolvedValueOnce([store('s1', '  GC-CTK-4051  ')])
        .mockResolvedValue([]);

      await service.bootstrap();

      expect(accessCode.hash).toHaveBeenCalledWith('GC-CTK-4051');
    });
  });

  describe('concurrency', () => {
    it('should not emit when another worker already initialized the store', async () => {
      repository.countUninitializedCodes.mockResolvedValue(1);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1')])
        .mockResolvedValue([]);
      // Conditional update matched nothing: someone else won.
      repository.initializeAccessCode.mockResolvedValue(false);

      await service.bootstrap();

      expect(emitter.emit).not.toHaveBeenCalledWith(
        DASHBOARD_EVENTS.CODE_INITIALIZED,
        expect.anything(),
      );
    });
  });

  describe('resilience', () => {
    it('should skip a store whose code is blank', async () => {
      repository.countUninitializedCodes.mockResolvedValue(1);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1', '   ')])
        .mockResolvedValue([]);

      const result = await service.bootstrap();

      expect(result.skipped).toBe(1);
      expect(result.initialized).toBe(0);
    });

    it('should continue past a failing store', async () => {
      repository.countUninitializedCodes.mockResolvedValue(2);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1'), store('s2')])
        .mockResolvedValue([]);
      accessCode.hash
        .mockRejectedValueOnce(new Error('argon2 failed'))
        .mockResolvedValue('$argon2id$hash');

      const result = await service.bootstrap();

      expect(result.failed).toBe(1);
      expect(result.initialized).toBe(1);
    });

    it('should never throw out of onModuleInit', async () => {
      repository.countUninitializedCodes.mockRejectedValue(
        new Error('database unavailable'),
      );

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('without an encryption key', () => {
    it('should still derive hash and lookup', async () => {
      cipher.isAvailable.mockReturnValue(false);
      cipher.encrypt.mockReturnValue(null);
      repository.countUninitializedCodes.mockResolvedValue(1);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1')])
        .mockResolvedValue([]);

      const result = await service.bootstrap();

      expect(result.initialized).toBe(1);
      expect(repository.initializeAccessCode).toHaveBeenCalledWith(
        's1',
        '$argon2id$hash',
        'lookup-hex',
        null,
      );
    });

    it('should report the store as not encrypted', async () => {
      cipher.isAvailable.mockReturnValue(false);
      cipher.encrypt.mockReturnValue(null);
      repository.countUninitializedCodes.mockResolvedValue(1);
      repository.findUninitializedCodes
        .mockResolvedValueOnce([store('s1')])
        .mockResolvedValue([]);

      await service.bootstrap();

      expect(emitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.CODE_INITIALIZED,
        expect.objectContaining({ encrypted: false }),
      );
    });

    it('should skip the ciphertext backfill entirely', async () => {
      cipher.isAvailable.mockReturnValue(false);

      await service.bootstrap();

      expect(repository.findInitializedWithoutCiphertext).not.toHaveBeenCalled();
    });
  });

  describe('ciphertext backfill', () => {
    it('should fill in stores initialized before a key existed', async () => {
      repository.findInitializedWithoutCiphertext.mockResolvedValue([
        { id: 's9', dashboardCode: 'GC-OLD-1111' },
      ]);

      const result = await service.bootstrap();

      expect(result.encryptedBackfilled).toBe(1);
      expect(repository.setEncryptedCode).toHaveBeenCalledWith('s9', 'iv:tag:ct');
    });

    it('should not touch their hashes', async () => {
      repository.findInitializedWithoutCiphertext.mockResolvedValue([
        { id: 's9', dashboardCode: 'GC-OLD-1111' },
      ]);

      await service.bootstrap();

      expect(repository.initializeAccessCode).not.toHaveBeenCalled();
    });
  });
});
