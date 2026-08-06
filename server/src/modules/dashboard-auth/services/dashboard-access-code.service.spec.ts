import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { DashboardAccessCodeService } from './dashboard-access-code.service';
import { DASHBOARD_CODE_ALPHABET } from '../constants';

const PEPPER = 'a'.repeat(64);

function buildConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const values: Record<string, unknown> = {
    'dashboardAuth.codePepper': PEPPER,
    'dashboardAuth.codePrefix': 'GC',
    'dashboardAuth.codeSecretLength': 8,
    ...overrides,
  };

  return {
    get: (key: string, fallback?: unknown) => values[key] ?? fallback,
    getOrThrow: (key: string) => {
      if (values[key] === undefined) {
        throw new Error(`Missing config ${key}`);
      }
      return values[key];
    },
  } as unknown as ConfigService;
}

describe('DashboardAccessCodeService', () => {
  let service: DashboardAccessCodeService;

  beforeEach(() => {
    service = new DashboardAccessCodeService(buildConfig());
  });

  describe('generate', () => {
    it('should produce a prefixed, store-scoped, three-segment code', async () => {
      const { code } = await service.generate('PAT');
      const segments = code.split('-');

      expect(segments).toHaveLength(3);
      expect(segments[0]).toBe('GC');
      expect(segments[1]).toBe('PAT');
      expect(segments[2]).toHaveLength(8);
    });

    it('should uppercase the store code segment', async () => {
      const { code } = await service.generate('sah');
      expect(code.split('-')[1]).toBe('SAH');
    });

    it('should draw the secret only from the unambiguous alphabet', async () => {
      const { code } = await service.generate('PAT');
      for (const char of code.split('-')[2]) {
        expect(DASHBOARD_CODE_ALPHABET).toContain(char);
      }
    });

    it('should honour a configured secret length', async () => {
      const longer = new DashboardAccessCodeService(
        buildConfig({ 'dashboardAuth.codeSecretLength': 16 }),
      );
      const { code } = await longer.generate('PAT');
      expect(code.split('-')[2]).toHaveLength(16);
    });

    it('should never repeat a code across generations', async () => {
      const codes = await Promise.all(
        Array.from({ length: 25 }, () => service.generate('PAT')),
      );
      const secrets = new Set(codes.map((c) => c.code.split('-')[2]));

      expect(secrets.size).toBe(25);
    });

    it('should return a hash and a lookup index alongside the code', async () => {
      const generated = await service.generate('PAT');

      expect(generated.codeHash.startsWith('$argon2id$')).toBe(true);
      expect(generated.codeLookup).toHaveLength(64);
    });

    it('should never embed the plaintext code in the hash or index', async () => {
      const generated = await service.generate('PAT');

      expect(generated.codeHash).not.toContain(generated.code);
      expect(generated.codeLookup).not.toContain(generated.code);
    });
  });

  describe('hash / verify', () => {
    it('should verify a correct code', async () => {
      const { code, codeHash } = await service.generate('PAT');
      expect(await service.verify(codeHash, code)).toBe(true);
    });

    it('should reject a wrong code', async () => {
      const { codeHash } = await service.generate('PAT');
      expect(await service.verify(codeHash, 'GC-PAT-WRONGCOD')).toBe(false);
    });

    it('should accept a code in any case with surrounding whitespace', async () => {
      const { code, codeHash } = await service.generate('PAT');
      expect(await service.verify(codeHash, `  ${code.toLowerCase()}  `)).toBe(
        true,
      );
    });

    it('should salt each hash, so the same code hashes differently', async () => {
      const first = await service.hash('GC-PAT-X93KL8Q2');
      const second = await service.hash('GC-PAT-X93KL8Q2');

      expect(first).not.toBe(second);
      expect(await service.verify(first, 'GC-PAT-X93KL8Q2')).toBe(true);
      expect(await service.verify(second, 'GC-PAT-X93KL8Q2')).toBe(true);
    });

    it('should use argon2id', async () => {
      const hash = await service.hash('GC-PAT-X93KL8Q2');
      expect(hash.startsWith('$argon2id$')).toBe(true);
    });

    it('should return false rather than throw on a malformed stored hash', async () => {
      expect(await service.verify('not-a-hash', 'GC-PAT-X93KL8Q2')).toBe(false);
    });
  });

  describe('lookupIndex', () => {
    it('should be deterministic for the same code', () => {
      const a = service.lookupIndex('GC-PAT-X93KL8Q2');
      const b = service.lookupIndex('GC-PAT-X93KL8Q2');

      expect(a).toBe(b);
    });

    it('should normalise case and whitespace', () => {
      expect(service.lookupIndex('  gc-pat-x93kl8q2 ')).toBe(
        service.lookupIndex('GC-PAT-X93KL8Q2'),
      );
    });

    it('should differ between codes', () => {
      expect(service.lookupIndex('GC-PAT-X93KL8Q2')).not.toBe(
        service.lookupIndex('GC-SAH-Q82MLP91'),
      );
    });

    it('should depend on the pepper, so a stolen database cannot rebuild it', () => {
      const other = new DashboardAccessCodeService(
        buildConfig({ 'dashboardAuth.codePepper': 'b'.repeat(64) }),
      );

      expect(other.lookupIndex('GC-PAT-X93KL8Q2')).not.toBe(
        service.lookupIndex('GC-PAT-X93KL8Q2'),
      );
    });
  });

  describe('lookupMatches', () => {
    it('should match identical indexes', () => {
      const index = service.lookupIndex('GC-PAT-X93KL8Q2');
      expect(service.lookupMatches(index, index)).toBe(true);
    });

    it('should reject differing indexes', () => {
      expect(
        service.lookupMatches(
          service.lookupIndex('GC-PAT-X93KL8Q2'),
          service.lookupIndex('GC-SAH-Q82MLP91'),
        ),
      ).toBe(false);
    });

    it('should reject values of differing length without throwing', () => {
      expect(service.lookupMatches('abc', 'abcd')).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should refuse to construct without a pepper', () => {
      expect(
        () =>
          new DashboardAccessCodeService(
            buildConfig({ 'dashboardAuth.codePepper': undefined }),
          ),
      ).toThrow();
    });
  });
});
