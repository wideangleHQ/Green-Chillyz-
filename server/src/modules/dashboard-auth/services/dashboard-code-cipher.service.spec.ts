import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';
import { DASHBOARD_CIPHER } from '../constants';

const KEY_HEX = randomBytes(DASHBOARD_CIPHER.KEY_BYTES).toString('hex');
const OTHER_KEY_HEX = randomBytes(DASHBOARD_CIPHER.KEY_BYTES).toString('hex');

const makeService = (key?: string): DashboardCodeCipherService =>
  new DashboardCodeCipherService({
    get: vi.fn().mockReturnValue(key),
  } as unknown as ConfigService);

describe('DashboardCodeCipherService', () => {
  let service: DashboardCodeCipherService;

  beforeEach(() => {
    service = makeService(KEY_HEX);
  });

  describe('key resolution', () => {
    it('should accept a hex key', () => {
      expect(makeService(KEY_HEX).isAvailable()).toBe(true);
    });

    it('should accept a base64 key', () => {
      const base64 = Buffer.from(KEY_HEX, 'hex').toString('base64');

      expect(makeService(base64).isAvailable()).toBe(true);
    });

    it('should report unavailable with no key', () => {
      expect(makeService(undefined).isAvailable()).toBe(false);
      expect(makeService('   ').isAvailable()).toBe(false);
    });

    it('should reject a key of the wrong length', () => {
      expect(() => makeService('abcd')).toThrow(/32 bytes/);
    });
  });

  describe('round trip', () => {
    it('should decrypt what it encrypted', () => {
      const payload = service.encrypt('GC-CTK-4051');

      expect(service.decrypt(payload as string)).toBe('GC-CTK-4051');
    });

    it('should produce the iv:tag:ciphertext envelope', () => {
      const payload = service.encrypt('GC-CTK-4051') as string;

      expect(payload.split(DASHBOARD_CIPHER.SEPARATOR)).toHaveLength(3);
    });

    it('should never repeat a ciphertext for the same input', () => {
      const a = service.encrypt('GC-CTK-4051');
      const b = service.encrypt('GC-CTK-4051');

      expect(a).not.toBe(b);
      expect(service.decrypt(a as string)).toBe(service.decrypt(b as string));
    });

    it('should not leak the plaintext into the envelope', () => {
      const payload = service.encrypt('GC-CTK-4051') as string;

      expect(payload).not.toContain('GC-CTK-4051');
    });

    it('should handle a long code', () => {
      const long = `GC-${'X'.repeat(80)}`;

      expect(service.decrypt(service.encrypt(long) as string)).toBe(long);
    });
  });

  describe('tamper resistance', () => {
    it('should refuse a modified ciphertext', () => {
      const [iv, tag, data] = (service.encrypt('GC-CTK-4051') as string).split(
        DASHBOARD_CIPHER.SEPARATOR,
      );
      const flipped = Buffer.from(data, 'base64');
      flipped[0] ^= 0xff;

      const tampered = [iv, tag, flipped.toString('base64')].join(
        DASHBOARD_CIPHER.SEPARATOR,
      );

      expect(service.decrypt(tampered)).toBeNull();
    });

    it('should refuse a modified auth tag', () => {
      const [iv, , data] = (service.encrypt('GC-CTK-4051') as string).split(
        DASHBOARD_CIPHER.SEPARATOR,
      );
      const badTag = randomBytes(DASHBOARD_CIPHER.TAG_BYTES).toString('base64');

      expect(
        service.decrypt([iv, badTag, data].join(DASHBOARD_CIPHER.SEPARATOR)),
      ).toBeNull();
    });

    it('should refuse a ciphertext written under a different key', () => {
      const payload = makeService(OTHER_KEY_HEX).encrypt('GC-CTK-4051');

      expect(service.decrypt(payload as string)).toBeNull();
    });

    it('should refuse a malformed envelope', () => {
      expect(service.decrypt('garbage')).toBeNull();
      expect(service.decrypt('a:b')).toBeNull();
      expect(service.decrypt('')).toBeNull();
    });

    it('should refuse an iv of the wrong size', () => {
      const [, tag, data] = (service.encrypt('GC-CTK-4051') as string).split(
        DASHBOARD_CIPHER.SEPARATOR,
      );
      const shortIv = randomBytes(4).toString('base64');

      expect(
        service.decrypt([shortIv, tag, data].join(DASHBOARD_CIPHER.SEPARATOR)),
      ).toBeNull();
    });
  });

  describe('without a key', () => {
    it('should return null rather than storing plaintext', () => {
      const keyless = makeService(undefined);

      expect(keyless.encrypt('GC-CTK-4051')).toBeNull();
      expect(keyless.decrypt('anything')).toBeNull();
    });
  });

  describe('matches', () => {
    it('should confirm a ciphertext still opens to the expected code', () => {
      const payload = service.encrypt('GC-CTK-4051') as string;

      expect(service.matches(payload, 'GC-CTK-4051')).toBe(true);
    });

    it('should reject a different code', () => {
      const payload = service.encrypt('GC-CTK-4051') as string;

      expect(service.matches(payload, 'GC-CTK-9999')).toBe(false);
    });

    it('should reject an undecryptable payload', () => {
      expect(service.matches('garbage', 'GC-CTK-4051')).toBe(false);
    });
  });
});
