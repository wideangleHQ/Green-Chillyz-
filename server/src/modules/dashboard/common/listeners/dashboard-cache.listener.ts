import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../database/prisma.service';
import { AUDIT_EVENTS } from '../../../audit/constants';
import { NOTIFICATION_EVENTS } from '../../../notification/constants';
import { DashboardOpsCacheService } from '../services/dashboard-ops-cache.service';

interface UserScopedEvent {
  userId: string;
}

interface StoreScopedEvent {
  storeId: string | null;
  customerId?: string;
}

/**
 * Keeps dashboard operational caches honest.
 *
 * The dashboard never writes; the systems that do (wallet, rewards) already
 * publish domain events. This listener maps each movement back to the store
 * whose operational view it changed and drops that store's cached counters,
 * so the short cache TTLs are a backstop rather than the freshness model.
 */
@Injectable()
export class DashboardCacheListener {
  private readonly logger = new Logger(DashboardCacheListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DashboardOpsCacheService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.WALLET_CREDITED, { async: true })
  @OnEvent(NOTIFICATION_EVENTS.WALLET_DEBITED, { async: true })
  @OnEvent(NOTIFICATION_EVENTS.COINS_EXPIRED, { async: true })
  async onWalletMovement(event: UserScopedEvent): Promise<void> {
    await this.invalidateForUser(event.userId);
  }

  @OnEvent(NOTIFICATION_EVENTS.REWARD_REDEEMED, { async: true })
  async onRewardRedeemed(event: UserScopedEvent): Promise<void> {
    await this.invalidateForUser(event.userId);
  }

  @OnEvent(AUDIT_EVENTS.VOUCHER_REDEEMED, { async: true })
  async onVoucherRedeemed(event: StoreScopedEvent): Promise<void> {
    if (event.storeId) {
      await this.safeInvalidate(event.storeId);
    } else if (event.customerId) {
      await this.invalidateForUser(event.customerId);
    }
  }

  private async invalidateForUser(userId: string | undefined): Promise<void> {
    if (!userId) return;
    try {
      const profile = await this.prisma.customerProfile.findUnique({
        where: { userId },
        select: { assignedStoreId: true },
      });
      if (profile) {
        await this.safeInvalidate(profile.assignedStoreId);
      }
    } catch (error) {
      this.logger.warn(
        `Dashboard cache invalidation skipped for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  private async safeInvalidate(storeId: string): Promise<void> {
    try {
      await this.cache.invalidateStore(storeId);
    } catch (error) {
      this.logger.warn(
        `Dashboard cache invalidation failed for store ${storeId}: ${(error as Error).message}`,
      );
    }
  }
}
