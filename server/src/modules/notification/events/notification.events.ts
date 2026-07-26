/**
 * Domain events published by feature modules.
 *
 * Publishers construct and emit these; they never reference the notification
 * module. The payloads carry only what a message needs, keeping the coupling
 * one-directional.
 */

export class WalletCreditedEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly newBalance: number,
    public readonly source: string,
    public readonly description: string,
    public readonly transactionId: string,
  ) {}
}

export class WalletDebitedEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly newBalance: number,
    public readonly source: string,
    public readonly description: string,
    public readonly transactionId: string,
  ) {}
}

export class CoinsExpiredEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly newBalance: number,
  ) {}
}

export class RewardRedeemedEvent {
  constructor(
    public readonly userId: string,
    public readonly rewardId: string,
    public readonly rewardTitle: string,
    public readonly coinsSpent: number,
    public readonly redemptionId: string,
  ) {}
}

export class VoucherGeneratedEvent {
  constructor(
    public readonly userId: string,
    public readonly voucherId: string,
    public readonly voucherCode: string,
    public readonly rewardTitle: string,
    public readonly expiresAt: Date,
  ) {}
}

export class GameCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly gameId: string,
    public readonly gameName: string,
    public readonly coinsWon: number,
    public readonly sessionId: string,
  ) {}
}

export class ReferralCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly referredUserName: string,
    public readonly bonusCoins: number,
    public readonly referralId: string,
  ) {}
}

export class CampaignStartedEvent {
  constructor(
    public readonly userId: string,
    public readonly campaignId: string,
    public readonly campaignName: string,
    public readonly description: string,
  ) {}
}

export class CampaignEndedEvent {
  constructor(
    public readonly userId: string,
    public readonly campaignId: string,
    public readonly campaignName: string,
  ) {}
}

export class BirthdayRewardEvent {
  constructor(
    public readonly userId: string,
    public readonly coins: number,
  ) {}
}

export class LoyaltyUpgradedEvent {
  constructor(
    public readonly userId: string,
    public readonly newTier: string,
    public readonly previousTier: string,
  ) {}
}

export class StoreAnnouncementEvent {
  constructor(
    public readonly userId: string,
    public readonly storeId: string,
    public readonly storeName: string,
    public readonly title: string,
    public readonly body: string,
  ) {}
}

export class SecurityAlertEvent {
  constructor(
    public readonly userId: string,
    public readonly alertType: string,
    public readonly detail: string,
    public readonly ipAddress?: string,
  ) {}
}

export class CustomerRegisteredNotificationEvent {
  constructor(
    public readonly userId: string,
    public readonly fullName: string,
  ) {}
}

export class SystemNotificationEvent {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly actionUrl?: string,
  ) {}
}
