import { UserRegisteredEvent } from '../events';

/**
 * Contract every bootstrap initializer must satisfy.
 *
 * New platform resources (loyalty, referral, achievements, game progress,
 * notification/marketing preferences) plug in by implementing this interface
 * and registering themselves via the BOOTSTRAP_INITIALIZERS multi-provider
 * token or CustomerBootstrapService.registerInitializer(). Neither AuthService
 * nor CustomerBootstrapService require modification — Open/Closed Principle.
 */
export interface CustomerBootstrapInitializer {
  /** Stable identifier used for logging and result reporting. */
  readonly name: string;

  /** Lower runs first. Wallet must precede resources that depend on it. */
  readonly priority: number;

  /**
   * Provision this initializer's resource for the user.
   * MUST be idempotent — running twice must never duplicate resources.
   */
  initialize(event: UserRegisteredEvent): Promise<BootstrapInitializerOutcome>;
}

export interface BootstrapInitializerOutcome {
  /** True when the resource was created by this run. */
  created: boolean;
  /** True when the resource already existed and was left untouched. */
  alreadyExisted: boolean;
  /** Optional human-readable detail for logs. */
  detail?: string;
}

export interface BootstrapInitializerResult extends BootstrapInitializerOutcome {
  name: string;
  succeeded: boolean;
  error?: string;
  durationMs: number;
}

export interface CustomerBootstrapResult {
  userId: string;
  succeeded: boolean;
  results: BootstrapInitializerResult[];
  durationMs: number;
}
