import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { UserRegisteredEvent } from '../events';
import {
  CustomerBootstrapInitializer,
  BootstrapInitializerOutcome,
} from '../interfaces';
import {
  BOOTSTRAP_INITIALIZER_NAMES,
  BOOTSTRAP_PRIORITY,
  BOOTSTRAP_DEFAULTS,
  BOOTSTRAP_ERRORS,
} from '../constants';

/**
 * Ensures a CustomerProfile exists for every registered customer.
 *
 * CustomerProfile requires a non-null assignedStoreId, so the profile is
 * anchored to the earliest active store. When the platform has no active
 * store yet the initializer degrades gracefully rather than failing
 * registration — the wallet, which is the critical resource, is unaffected.
 */
@Injectable()
export class CustomerProfileInitializer implements CustomerBootstrapInitializer {
  readonly name = BOOTSTRAP_INITIALIZER_NAMES.CUSTOMER_PROFILE;
  readonly priority = BOOTSTRAP_PRIORITY.CUSTOMER_PROFILE;

  private readonly logger = new Logger(CustomerProfileInitializer.name);

  constructor(private readonly prisma: PrismaService) {}

  async initialize(event: UserRegisteredEvent): Promise<BootstrapInitializerOutcome> {
    const existing = await this.prisma.customerProfile.findUnique({
      where: { userId: event.userId },
      select: { id: true },
    });

    if (existing) {
      return {
        created: false,
        alreadyExisted: true,
        detail: 'Customer profile already provisioned',
      };
    }

    const store = await this.prisma.store.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!store) {
      this.logger.warn(
        `${BOOTSTRAP_ERRORS.NO_DEFAULT_STORE} (user ${event.userId})`,
      );
      return {
        created: false,
        alreadyExisted: false,
        detail: BOOTSTRAP_ERRORS.NO_DEFAULT_STORE,
      };
    }

    const referralCode = await this.generateUniqueReferralCode();

    try {
      const profile = await this.prisma.customerProfile.create({
        data: {
          userId: event.userId,
          assignedStoreId: store.id,
          referralCode,
        },
        select: { id: true },
      });

      this.logger.log(`Customer profile provisioned for user ${event.userId}`);

      return {
        created: true,
        alreadyExisted: false,
        detail: `Profile ${profile.id}`,
      };
    } catch (error) {
      // A concurrent bootstrap won the race on the unique userId constraint.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          created: false,
          alreadyExisted: true,
          detail: 'Customer profile created concurrently',
        };
      }
      throw error;
    }
  }

  private async generateUniqueReferralCode(): Promise<string> {
    for (
      let attempt = 0;
      attempt < BOOTSTRAP_DEFAULTS.REFERRAL_CODE_MAX_ATTEMPTS;
      attempt++
    ) {
      const code = this.randomCode();
      const taken = await this.prisma.customerProfile.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!taken) return code;
    }

    throw new Error(BOOTSTRAP_ERRORS.REFERRAL_CODE_GENERATION_FAILED);
  }

  private randomCode(): string {
    const alphabet = BOOTSTRAP_DEFAULTS.REFERRAL_CODE_ALPHABET;
    let code = '';
    for (let i = 0; i < BOOTSTRAP_DEFAULTS.REFERRAL_CODE_LENGTH; i++) {
      code += alphabet[randomInt(alphabet.length)];
    }
    return code;
  }
}
