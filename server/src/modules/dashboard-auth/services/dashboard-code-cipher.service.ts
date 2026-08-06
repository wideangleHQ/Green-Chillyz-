import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { DASHBOARD_CIPHER } from '../constants';

/**
 * Reversible custody of an access code, used only for recovery.
 *
 * Authentication never touches this service — that is Argon2's job. This
 * exists so a corporate operator can retrieve a code a store has misplaced
 * without forcing a rotation that breaks the store's saved credential.
 *
 * AES-256-GCM is authenticated encryption: the tag is verified on decrypt, so
 * a tampered ciphertext fails loudly rather than yielding attacker-chosen
 * plaintext. Every encryption draws a fresh 96-bit IV, so encrypting the same
 * code twice produces different ciphertexts and reveals no equality.
 *
 * The key is optional. Without it the platform still authenticates fully —
 * hash and lookup are all login needs — and recovery reports itself
 * unavailable rather than silently storing plaintext.
 */
@Injectable()
export class DashboardCodeCipherService {
  private readonly logger = new Logger(DashboardCodeCipherService.name);
  private readonly key: Buffer | null;

  constructor(private readonly configService: ConfigService) {
    this.key = this.resolveKey(
      this.configService.get<string>('dashboardAuth.codeEncryptionKey'),
    );

    if (!this.key) {
      this.logger.warn(
        'DASHBOARD_CODE_ENCRYPTION_KEY is not set — access codes will not be recoverable. Authentication is unaffected.',
      );
    }
  }

  /** False when no key is configured; callers degrade instead of throwing. */
  isAvailable(): boolean {
    return this.key !== null;
  }

  /**
   * Returns `iv:tag:ciphertext`, all base64. Keeping the IV and tag alongside
   * the payload means a stored value is self-describing — no second column and
   * no ordering assumption at decrypt time.
   */
  encrypt(plaintext: string): string | null {
    if (!this.key) return null;

    const iv = randomBytes(DASHBOARD_CIPHER.IV_BYTES);
    const cipher = createCipheriv(DASHBOARD_CIPHER.ALGORITHM, this.key, iv);

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      tag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(DASHBOARD_CIPHER.SEPARATOR);
  }

  /**
   * Returns null on any failure — wrong key, tampered payload, malformed
   * envelope. Callers cannot distinguish the cases, which is deliberate.
   */
  decrypt(payload: string): string | null {
    if (!this.key) return null;

    try {
      const parts = payload.split(DASHBOARD_CIPHER.SEPARATOR);
      if (parts.length !== 3) return null;

      const [ivPart, tagPart, dataPart] = parts;
      const iv = Buffer.from(ivPart, 'base64');
      const tag = Buffer.from(tagPart, 'base64');
      const ciphertext = Buffer.from(dataPart, 'base64');

      if (
        iv.length !== DASHBOARD_CIPHER.IV_BYTES ||
        tag.length !== DASHBOARD_CIPHER.TAG_BYTES
      ) {
        return null;
      }

      const decipher = createDecipheriv(
        DASHBOARD_CIPHER.ALGORITHM,
        this.key,
        iv,
      );
      decipher.setAuthTag(tag);

      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      // GCM tag mismatch lands here; never surface why.
      return null;
    }
  }

  /**
   * Confirms a stored ciphertext still round-trips to the expected code.
   * Used by the bootstrap to detect a key rotation that orphaned old values.
   */
  matches(payload: string, expected: string): boolean {
    const decrypted = this.decrypt(payload);
    if (decrypted === null) return false;

    const a = Buffer.from(decrypted, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  }

  /**
   * Accepts hex or base64 and insists on exactly 32 bytes. A short key is a
   * configuration error worth failing on, not padding around.
   */
  private resolveKey(raw?: string): Buffer | null {
    if (!raw || raw.trim().length === 0) return null;

    const value = raw.trim();
    const candidates: Buffer[] = [];

    if (/^[0-9a-f]+$/i.test(value) && value.length % 2 === 0) {
      candidates.push(Buffer.from(value, 'hex'));
    }
    candidates.push(Buffer.from(value, 'base64'));

    const key = candidates.find(
      (buffer) => buffer.length === DASHBOARD_CIPHER.KEY_BYTES,
    );

    if (!key) {
      throw new Error(
        `DASHBOARD_CODE_ENCRYPTION_KEY must decode to ${DASHBOARD_CIPHER.KEY_BYTES} bytes (hex or base64)`,
      );
    }

    return key;
  }
}
