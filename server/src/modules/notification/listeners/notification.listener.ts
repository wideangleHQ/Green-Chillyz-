import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationDispatcherService } from '../services';
import { NOTIFICATION_EVENTS, TEMPLATE_KEYS } from '../constants';
import {
  WalletCreditedEvent,
  WalletDebitedEvent,
  CoinsExpiredEvent,
  RewardRedeemedEvent,
  VoucherGeneratedEvent,
  GameCompletedEvent,
  ReferralCompletedEvent,
  CampaignStartedEvent,
  CampaignEndedEvent,
  BirthdayRewardEvent,
  LoyaltyUpgradedEvent,
  StoreAnnouncementEvent,
  SecurityAlertEvent,
  CustomerRegisteredNotificationEvent,
  SystemNotificationEvent,
} from '../events';

/**
 * Wallet movements that a more specific notification already covers.
 * Suppressing the generic wallet message here is what keeps one user-visible
 * action to exactly one notification.
 */
const CREDIT_SOURCES_WITH_SPECIFIC_NOTIFICATION = new Set([
  'GAME_REWARD',
  'REFERRAL_BONUS',
  'BIRTHDAY_REWARD',
]);

const DEBIT_SOURCES_WITH_SPECIFIC_NOTIFICATION = new Set(['REWARD_REDEMPTION']);

/**
 * The single bridge from domain events to notifications.
 *
 * Publishing modules never touch notification tables — they emit an event and
 * this listener turns it into a dispatch. Each handler passes a dedupeKey so
 * a redelivered event cannot produce a second notification.
 *
 * Failures are swallowed: a notification problem must never fail the wallet
 * credit, game result or redemption that triggered it.
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  @OnEvent(NOTIFICATION_EVENTS.WALLET_CREDITED)
  async onWalletCredited(event: WalletCreditedEvent): Promise<void> {
    if (CREDIT_SOURCES_WITH_SPECIFIC_NOTIFICATION.has(event.source)) return;

    await this.safeDispatch('wallet.credited', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.WALLET_CREDITED,
      variables: {
        amount: event.amount,
        newBalance: event.newBalance,
        description: event.description,
        source: event.source,
      },
      dedupeKey: `wallet.credited:${event.transactionId}`,
      referenceId: event.transactionId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.WALLET_DEBITED)
  async onWalletDebited(event: WalletDebitedEvent): Promise<void> {
    if (DEBIT_SOURCES_WITH_SPECIFIC_NOTIFICATION.has(event.source)) return;

    await this.safeDispatch('wallet.debited', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.WALLET_DEBITED,
      variables: {
        amount: event.amount,
        newBalance: event.newBalance,
        description: event.description,
        source: event.source,
      },
      dedupeKey: `wallet.debited:${event.transactionId}`,
      referenceId: event.transactionId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.COINS_EXPIRED)
  async onCoinsExpired(event: CoinsExpiredEvent): Promise<void> {
    await this.safeDispatch('wallet.coins.expired', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.COINS_EXPIRED,
      variables: { amount: event.amount, newBalance: event.newBalance },
      dedupeKey: `wallet.expired:${event.userId}:${new Date().toISOString().slice(0, 10)}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.REWARD_REDEEMED)
  async onRewardRedeemed(event: RewardRedeemedEvent): Promise<void> {
    await this.safeDispatch('reward.redeemed', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.REWARD_REDEEMED,
      variables: {
        rewardTitle: event.rewardTitle,
        coinsSpent: event.coinsSpent,
      },
      dedupeKey: `reward.redeemed:${event.redemptionId}`,
      referenceId: event.redemptionId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.VOUCHER_GENERATED)
  async onVoucherGenerated(event: VoucherGeneratedEvent): Promise<void> {
    await this.safeDispatch('voucher.generated', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.VOUCHER_GENERATED,
      variables: {
        voucherCode: event.voucherCode,
        rewardTitle: event.rewardTitle,
      },
      dedupeKey: `voucher.generated:${event.voucherId}`,
      referenceId: event.voucherId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.GAME_COMPLETED)
  async onGameCompleted(event: GameCompletedEvent): Promise<void> {
    // Nothing won means nothing worth interrupting the user for.
    if (event.coinsWon <= 0) return;

    await this.safeDispatch('game.completed', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.GAME_WON,
      variables: { gameName: event.gameName, coinsWon: event.coinsWon },
      dedupeKey: `game.completed:${event.sessionId}`,
      referenceId: event.sessionId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.REFERRAL_COMPLETED)
  async onReferralCompleted(event: ReferralCompletedEvent): Promise<void> {
    await this.safeDispatch('referral.completed', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.REFERRAL_BONUS,
      variables: {
        referredUserName: event.referredUserName,
        bonusCoins: event.bonusCoins,
      },
      dedupeKey: `referral.completed:${event.referralId}`,
      referenceId: event.referralId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.CAMPAIGN_STARTED)
  async onCampaignStarted(event: CampaignStartedEvent): Promise<void> {
    await this.safeDispatch('campaign.started', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.CAMPAIGN_STARTED,
      variables: {
        campaignName: event.campaignName,
        description: event.description,
      },
      dedupeKey: `campaign.started:${event.campaignId}:${event.userId}`,
      referenceId: event.campaignId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.CAMPAIGN_ENDED)
  async onCampaignEnded(event: CampaignEndedEvent): Promise<void> {
    await this.safeDispatch('campaign.ended', {
      userId: event.userId,
      override: {
        title: `${event.campaignName} has ended`,
        message: 'Thanks for taking part. Keep an eye out for what comes next.',
        type: NotificationType.CAMPAIGN,
        priority: NotificationPriority.LOW,
      },
      dedupeKey: `campaign.ended:${event.campaignId}:${event.userId}`,
      referenceId: event.campaignId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.BIRTHDAY_REWARD)
  async onBirthdayReward(event: BirthdayRewardEvent): Promise<void> {
    await this.safeDispatch('reward.birthday', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.BIRTHDAY_REWARD,
      variables: { coins: event.coins },
      dedupeKey: `reward.birthday:${event.userId}:${new Date().getFullYear()}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.LOYALTY_UPGRADED)
  async onLoyaltyUpgraded(event: LoyaltyUpgradedEvent): Promise<void> {
    await this.safeDispatch('loyalty.upgraded', {
      userId: event.userId,
      override: {
        title: `You reached ${event.newTier}`,
        message: `Upgraded from ${event.previousTier}. Enjoy your new perks.`,
        type: NotificationType.LOYALTY,
        priority: NotificationPriority.HIGH,
        icon: 'trending-up',
        actionLabel: 'View Rewards',
        actionUrl: '/rewards',
      },
      dedupeKey: `loyalty.upgraded:${event.userId}:${event.newTier}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.STORE_ANNOUNCEMENT)
  async onStoreAnnouncement(event: StoreAnnouncementEvent): Promise<void> {
    await this.safeDispatch('store.announcement', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.STORE_ANNOUNCEMENT,
      variables: { title: event.title, body: event.body, storeName: event.storeName },
      dedupeKey: `store.announcement:${event.storeId}:${event.userId}:${event.title}`,
      referenceId: event.storeId,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SECURITY_ALERT)
  async onSecurityAlert(event: SecurityAlertEvent): Promise<void> {
    await this.safeDispatch('security.alert', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.SECURITY_ALERT,
      variables: { detail: event.detail, alertType: event.alertType },
      // Security messages must reach the user regardless of preferences.
      force: true,
      dedupeKey: `security.alert:${event.userId}:${event.alertType}:${Date.now()}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.CUSTOMER_REGISTERED)
  async onCustomerRegistered(
    event: CustomerRegisteredNotificationEvent,
  ): Promise<void> {
    await this.safeDispatch('customer.registered', {
      userId: event.userId,
      templateKey: TEMPLATE_KEYS.WELCOME,
      variables: { fullName: event.fullName },
      dedupeKey: `customer.welcome:${event.userId}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SYSTEM_NOTIFICATION)
  async onSystemNotification(event: SystemNotificationEvent): Promise<void> {
    await this.safeDispatch('system.notification', {
      userId: event.userId,
      override: {
        title: event.title,
        message: event.message,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.NORMAL,
        actionUrl: event.actionUrl ?? null,
      },
    });
  }

  /**
   * Dispatch without ever propagating a failure back to the publisher.
   */
  private async safeDispatch(
    eventName: string,
    request: Parameters<NotificationDispatcherService['dispatch']>[0],
  ): Promise<void> {
    try {
      await this.dispatcher.dispatch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Notification dispatch failed for ${eventName} (user ${request.userId}): ${message}`,
      );
    }
  }
}
