import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { UserRegisteredEvent } from '../events';
import {
  CustomerBootstrapInitializer,
  BootstrapInitializerResult,
  CustomerBootstrapResult,
} from '../interfaces';
import { BOOTSTRAP_INITIALIZERS } from '../constants';

/**
 * Single entry point that provisions every platform resource a new customer
 * needs. Initializers are supplied through DI (or registered at runtime), so
 * adding a new resource never requires touching AuthService or this service.
 *
 * Failures are isolated per initializer: one failing resource never blocks the
 * others and never propagates into the registration flow.
 */
@Injectable()
export class CustomerBootstrapService {
  private readonly logger = new Logger(CustomerBootstrapService.name);
  private readonly initializers: CustomerBootstrapInitializer[];

  constructor(
    @Optional()
    @Inject(BOOTSTRAP_INITIALIZERS)
    initializers?: CustomerBootstrapInitializer[],
  ) {
    this.initializers = [...(initializers ?? [])];
  }

  /**
   * Extension point for modules that want to provision their own resource at
   * registration time without modifying existing code.
   */
  registerInitializer(initializer: CustomerBootstrapInitializer): void {
    const duplicate = this.initializers.some((i) => i.name === initializer.name);
    if (duplicate) {
      this.logger.warn(
        `Bootstrap initializer "${initializer.name}" is already registered; ignoring duplicate`,
      );
      return;
    }
    this.initializers.push(initializer);
  }

  getInitializerNames(): string[] {
    return this.sortedInitializers().map((i) => i.name);
  }

  /**
   * Provision all resources for a newly registered customer.
   * Safe to run repeatedly — every initializer is idempotent.
   */
  async bootstrap(event: UserRegisteredEvent): Promise<CustomerBootstrapResult> {
    const startedAt = Date.now();
    const results: BootstrapInitializerResult[] = [];

    for (const initializer of this.sortedInitializers()) {
      results.push(await this.runInitializer(initializer, event));
    }

    const durationMs = Date.now() - startedAt;
    const succeeded = results.every((r) => r.succeeded);
    const failed = results.filter((r) => !r.succeeded).map((r) => r.name);

    if (succeeded) {
      this.logger.log(
        `Customer bootstrap completed for user ${event.userId} | initializers=${results.length} | ${durationMs}ms`,
      );
    } else {
      this.logger.error(
        `Customer bootstrap partially failed for user ${event.userId} | failed=[${failed.join(', ')}] | ${durationMs}ms`,
      );
    }

    return { userId: event.userId, succeeded, results, durationMs };
  }

  private async runInitializer(
    initializer: CustomerBootstrapInitializer,
    event: UserRegisteredEvent,
  ): Promise<BootstrapInitializerResult> {
    const startedAt = Date.now();

    try {
      const outcome = await initializer.initialize(event);
      return {
        name: initializer.name,
        succeeded: true,
        created: outcome.created,
        alreadyExisted: outcome.alreadyExisted,
        detail: outcome.detail,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      // Log the reason without echoing event payload or user PII.
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Bootstrap initializer "${initializer.name}" failed for user ${event.userId}: ${message}`,
      );

      return {
        name: initializer.name,
        succeeded: false,
        created: false,
        alreadyExisted: false,
        error: message,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  private sortedInitializers(): CustomerBootstrapInitializer[] {
    return [...this.initializers].sort((a, b) => a.priority - b.priority);
  }
}
