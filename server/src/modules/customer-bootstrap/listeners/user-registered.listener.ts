import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CustomerBootstrapService } from '../services';
import { UserRegisteredEvent } from '../events';
import { BOOTSTRAP_EVENTS } from '../constants';

/**
 * Bridges the UserRegistered domain event to customer provisioning.
 * AuthService publishes the event and knows nothing about wallets, profiles
 * or any resource added later.
 */
@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  constructor(private readonly bootstrapService: CustomerBootstrapService) {}

  @OnEvent(BOOTSTRAP_EVENTS.USER_REGISTERED, { suppressErrors: false })
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(
      `Handling ${BOOTSTRAP_EVENTS.USER_REGISTERED} for user ${event.userId} | provider=${event.provider}`,
    );
    await this.bootstrapService.bootstrap(event);
  }
}
