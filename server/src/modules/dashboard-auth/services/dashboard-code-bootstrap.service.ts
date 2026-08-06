import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DASHBOARD_BOOTSTRAP, DASHBOARD_EVENTS } from '../constants';
import { DashboardCodeInitializedEvent } from '../events';
import { DashboardStoreRepository } from '../repositories';
import { DashboardAccessCodeService } from './dashboard-access-code.service';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';

export interface DashboardBootstrapResult {
  scanned: number;
  initialized: number;
  encryptedBackfilled: number;
  skipped: number;
  failed: number;
}

/**
 * Derives the authentication material for stores seeded with a plaintext
 * access code.
 *
 * Codes arrive with the store (`GC-CTK-4051`), but login needs an Argon2 hash
 * to verify against and an HMAC lookup to find the row by. This runs once at
 * startup, turns each pending code into both, and stores an encrypted copy for
 * recovery.
 *
 * Idempotent by construction: the query selects only stores whose hash is
 * still null, and the write is conditional on that same predicate. An already
 * initialized store is never read, never re-hashed, and never rewritten — so
 * restarting the server costs one indexed count, not a rescan.
 */
@Injectable()
export class DashboardCodeBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DashboardCodeBootstrapService.name);

  constructor(
    private readonly storeRepository: DashboardStoreRepository,
    private readonly accessCodeService: DashboardAccessCodeService,
    private readonly cipher: DashboardCodeCipherService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Never throws. A database that is not ready at boot must not stop the
   * application — the next restart picks up whatever remains pending.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.bootstrap();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Dashboard code bootstrap failed: ${message}`);
    }
  }

  async bootstrap(): Promise<DashboardBootstrapResult> {
    const result: DashboardBootstrapResult = {
      scanned: 0,
      initialized: 0,
      encryptedBackfilled: 0,
      skipped: 0,
      failed: 0,
    };

    const pending = await this.storeRepository.countUninitializedCodes();

    // Nothing to derive, but a key added after the fact may still leave
    // initialized stores without a recoverable copy — so the backfill runs
    // either way rather than being skipped by an early return.
    if (pending === 0) {
      result.encryptedBackfilled = await this.backfillMissingCiphertexts();

      if (result.encryptedBackfilled === 0) {
        this.logger.log('Dashboard codes already initialized; nothing to do');
      } else {
        this.logger.log(
          `Backfilled ${result.encryptedBackfilled} dashboard code ciphertext(s)`,
        );
      }
      return result;
    }

    this.logger.log(`Initializing dashboard codes for ${pending} store(s)`);

    // Paged so a large estate never materialises in one array. The offset
    // stays at zero because each successful pass removes rows from the
    // predicate; a failed row would otherwise be skipped forever.
    let guard = 0;
    const maxPasses = Math.ceil(pending / DASHBOARD_BOOTSTRAP.BATCH_SIZE) + 1;

    for (;;) {
      const batch = await this.storeRepository.findUninitializedCodes(
        DASHBOARD_BOOTSTRAP.BATCH_SIZE,
        result.failed,
      );
      if (batch.length === 0) break;

      for (const store of batch) {
        result.scanned += 1;
        const code = store.dashboardCode?.trim();

        if (!code) {
          result.skipped += 1;
          continue;
        }

        try {
          await this.initializeStore(store.id, store.slug, code);
          result.initialized += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          // Store id only — a failure message must never carry the code.
          this.logger.error(
            `Failed to initialize dashboard code for store ${store.id}: ${message}`,
          );
          result.failed += 1;
        }
      }

      guard += 1;
      if (guard >= maxPasses) break;
    }

    // A key added after stores were initialized leaves them without a
    // recoverable copy; fill those in without touching their hashes.
    result.encryptedBackfilled = await this.backfillMissingCiphertexts();

    this.logger.log(
      `Dashboard code bootstrap complete: initialized=${result.initialized} backfilled=${result.encryptedBackfilled} skipped=${result.skipped} failed=${result.failed}`,
    );

    return result;
  }

  private async initializeStore(
    storeId: string,
    storeSlug: string,
    code: string,
  ): Promise<void> {
    const [codeHash, codeLookup] = await Promise.all([
      this.accessCodeService.hash(code),
      Promise.resolve(this.accessCodeService.lookupIndex(code)),
    ]);

    const codeEncrypted = this.cipher.encrypt(code);

    const applied = await this.storeRepository.initializeAccessCode(
      storeId,
      codeHash,
      codeLookup,
      codeEncrypted,
    );

    // Another worker won the race; its hash is equally valid, so stop here
    // rather than overwriting a credential that may already be in use.
    if (!applied) return;

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.CODE_INITIALIZED,
      new DashboardCodeInitializedEvent(
        storeId,
        storeSlug,
        codeEncrypted !== null,
        new Date(),
      ),
    );
  }

  /**
   * Stores that were initialized while no encryption key was configured still
   * hold their plaintext, so the ciphertext can be produced later without a
   * rotation.
   */
  private async backfillMissingCiphertexts(): Promise<number> {
    if (!this.cipher.isAvailable()) return 0;

    const pending = await this.storeRepository.findInitializedWithoutCiphertext(
      DASHBOARD_BOOTSTRAP.BATCH_SIZE,
    );

    let backfilled = 0;
    for (const store of pending) {
      const code = store.dashboardCode?.trim();
      if (!code) continue;

      const encrypted = this.cipher.encrypt(code);
      if (!encrypted) continue;

      await this.storeRepository.setEncryptedCode(store.id, encrypted);
      backfilled += 1;
    }

    return backfilled;
  }
}
