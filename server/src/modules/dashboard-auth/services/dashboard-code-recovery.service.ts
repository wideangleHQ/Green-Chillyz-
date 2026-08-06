import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DASHBOARD_RECOVERY_ERRORS } from '../constants';
import { DashboardStoreRepository } from '../repositories';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';

export interface RecoveredAccessCode {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeCode: string;
  accessCode: string;
}

/**
 * Retrieves a store's access code for a corporate operator.
 *
 * Deliberately not wired to any HTTP route in this module. The Dashboard Users
 * module owns corporate identity, so it owns the endpoint and the
 * authorization check that must precede a call here; exposing recovery from
 * the authentication controller would put a plaintext credential one
 * mis-scoped guard away from the login surface.
 *
 * Every call is logged with the store id. Recovering a credential is a
 * privileged act and should leave a trail even when it succeeds.
 */
@Injectable()
export class DashboardCodeRecoveryService {
  private readonly logger = new Logger(DashboardCodeRecoveryService.name);

  constructor(
    private readonly storeRepository: DashboardStoreRepository,
    private readonly cipher: DashboardCodeCipherService,
  ) {}

  isRecoveryAvailable(): boolean {
    return this.cipher.isAvailable();
  }

  async recover(storeId: string): Promise<RecoveredAccessCode> {
    if (!this.cipher.isAvailable()) {
      throw new ServiceUnavailableException(
        DASHBOARD_RECOVERY_ERRORS.UNAVAILABLE,
      );
    }

    const store = await this.storeRepository.findRecoverableCode(storeId);
    if (!store) {
      throw new NotFoundException(DASHBOARD_RECOVERY_ERRORS.STORE_NOT_FOUND);
    }

    if (!store.dashboardCodeEncrypted) {
      throw new UnprocessableEntityException(
        DASHBOARD_RECOVERY_ERRORS.NOT_RECOVERABLE,
      );
    }

    const accessCode = this.cipher.decrypt(store.dashboardCodeEncrypted);

    // A ciphertext that will not open means the key changed since it was
    // written. Rotation is the only honest remedy.
    if (!accessCode) {
      this.logger.error(
        `Access code ciphertext for store ${storeId} could not be decrypted; encryption key may have rotated`,
      );
      throw new UnprocessableEntityException(
        DASHBOARD_RECOVERY_ERRORS.NOT_RECOVERABLE,
      );
    }

    this.logger.warn(`Dashboard access code recovered for store ${storeId}`);

    return {
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      storeCode: store.code,
      accessCode,
    };
  }
}
