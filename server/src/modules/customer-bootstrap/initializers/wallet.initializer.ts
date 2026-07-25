import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { WalletCacheService } from '../../wallet/services';
import { UserRegisteredEvent } from '../events';
import {
  CustomerBootstrapInitializer,
  BootstrapInitializerOutcome,
} from '../interfaces';
import {
  BOOTSTRAP_INITIALIZER_NAMES,
  BOOTSTRAP_PRIORITY,
} from '../constants';

/**
 * Creates the single Wallet every customer owns from the moment of
 * registration. Downstream modules (Games, Reward Engine) may therefore
 * assume an active wallet always exists.
 */
@Injectable()
export class WalletInitializer implements CustomerBootstrapInitializer {
  readonly name = BOOTSTRAP_INITIALIZER_NAMES.WALLET;
  readonly priority = BOOTSTRAP_PRIORITY.WALLET;

  private readonly logger = new Logger(WalletInitializer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletCache: WalletCacheService,
  ) {}

  async initialize(event: UserRegisteredEvent): Promise<BootstrapInitializerOutcome> {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId: event.userId },
      select: { id: true },
    });

    if (existing) {
      return {
        created: false,
        alreadyExisted: true,
        detail: 'Wallet already provisioned',
      };
    }

    // upsert makes concurrent bootstraps safe: the unique userId constraint
    // collapses racing writers onto a single row instead of erroring.
    const wallet = await this.prisma.wallet.upsert({
      where: { userId: event.userId },
      create: {
        userId: event.userId,
        balance: 0,
        pendingBalance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lifetimeExpired: 0,
        isActive: true,
      },
      update: {},
      select: { id: true, createdAt: true, updatedAt: true },
    });

    // A row whose createdAt differs from updatedAt was touched by the update
    // branch, meaning a concurrent bootstrap won the race.
    const wasCreatedHere =
      wallet.createdAt.getTime() === wallet.updatedAt.getTime();

    await this.walletCache.invalidate(event.userId);

    this.logger.log(`Wallet provisioned for user ${event.userId}`);

    return {
      created: wasCreatedHere,
      alreadyExisted: !wasCreatedHere,
      detail: `Wallet ${wallet.id}`,
    };
  }
}
