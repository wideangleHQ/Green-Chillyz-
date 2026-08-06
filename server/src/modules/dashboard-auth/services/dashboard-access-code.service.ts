import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import {
  DASHBOARD_ARGON2_OPTIONS,
  DASHBOARD_CODE_ALPHABET,
  DASHBOARD_CODE_SEGMENT_SEPARATOR,
} from '../constants';

export interface GeneratedAccessCode {
  /** Plaintext. Returned once, to be handed to the store, then discarded. */
  code: string;
  codeHash: string;
  codeLookup: string;
}

/**
 * Owns the store access code: how one is minted, indexed and verified.
 *
 * Two derivations are kept of every code and they do different jobs:
 *
 *  - `codeHash` — Argon2id, salted. What proves a presented code is correct.
 *    Slow and unique per store, therefore useless for lookup.
 *  - `codeLookup` — HMAC-SHA256 under a server-side pepper. Deterministic, so
 *    it finds the store in one indexed read. It is keyed, so possession of the
 *    database alone does not let an attacker test candidate codes offline.
 *
 * The plaintext is never persisted, logged, or returned after issuance.
 */
@Injectable()
export class DashboardAccessCodeService {
  private readonly logger = new Logger(DashboardAccessCodeService.name);
  private readonly pepper: string;
  private readonly prefix: string;
  private readonly secretLength: number;

  constructor(private readonly configService: ConfigService) {
    this.pepper = this.configService.getOrThrow<string>(
      'dashboardAuth.codePepper',
    );
    this.prefix = this.configService.get<string>(
      'dashboardAuth.codePrefix',
      'GC',
    );
    this.secretLength = this.configService.get<number>(
      'dashboardAuth.codeSecretLength',
      8,
    );
  }

  /**
   * Mints a code shaped `GC-PAT-X93KL8Q2`.
   *
   * Only the last segment is secret; the first two exist so a human can tell
   * at a glance which store a code belongs to. Entropy comes entirely from
   * `crypto.randomInt` — never from a counter, timestamp or store attribute,
   * which would make the next code predictable from the last.
   */
  async generate(storeCode: string): Promise<GeneratedAccessCode> {
    const secret = this.randomSecret(this.secretLength);
    const code = [
      this.prefix,
      storeCode.toUpperCase(),
      secret,
    ].join(DASHBOARD_CODE_SEGMENT_SEPARATOR);

    const [codeHash, codeLookup] = await Promise.all([
      this.hash(code),
      Promise.resolve(this.lookupIndex(code)),
    ]);

    return { code, codeHash, codeLookup };
  }

  async hash(code: string): Promise<string> {
    return argon2.hash(this.normalize(code), {
      type: argon2.argon2id,
      ...DASHBOARD_ARGON2_OPTIONS,
    });
  }

  /**
   * Argon2's verify is already constant-time for a given hash, and reads its
   * parameters from the encoded hash — so a hash minted under older settings
   * keeps verifying after `DASHBOARD_ARGON2_OPTIONS` is tuned. The try/catch
   * keeps a malformed stored hash from leaking a distinguishable error.
   */
  async verify(codeHash: string, code: string): Promise<boolean> {
    try {
      return await argon2.verify(codeHash, this.normalize(code));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Access code verification failed: ${message}`);
      return false;
    }
  }

  lookupIndex(code: string): string {
    return createHmac('sha256', this.pepper)
      .update(this.normalize(code))
      .digest('hex');
  }

  /**
   * Constant-time comparison of two lookup indexes. Used where a mismatch
   * must not be distinguishable by timing from a match.
   */
  lookupMatches(a: string, b: string): boolean {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }

  /** Codes are case- and whitespace-insensitive; they get typed by hand. */
  private normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  private randomSecret(length: number): string {
    let secret = '';
    for (let i = 0; i < length; i += 1) {
      secret += DASHBOARD_CODE_ALPHABET.charAt(
        randomInt(DASHBOARD_CODE_ALPHABET.length),
      );
    }
    return secret;
  }
}
