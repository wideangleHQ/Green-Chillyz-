import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationListener } from './notification.listener';
import { NotificationDispatcherService } from '../services';
import { TEMPLATE_KEYS } from '../constants';
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

describe('NotificationListener', () => {
  let listener: NotificationListener;
  let dispatcher: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    dispatcher = {
      dispatch: vi.fn().mockResolvedValue({ delivered: true, results: [] }),
    };
    listener = new NotificationListener(
      dispatcher as unknown as NotificationDispatcherService,
    );
  });

  describe('wallet events', () => {
    it('should notify on a generic credit', async () => {
      await listener.onWalletCredited(
        new WalletCreditedEvent('user-1', 50, 550, 'ORDER_CASHBACK', 'Cashback', 'txn-1'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          templateKey: TEMPLATE_KEYS.WALLET_CREDITED,
          dedupeKey: 'wallet.credited:txn-1',
        }),
      );
    });

    it('should suppress the generic credit for game rewards', async () => {
      // game.won already tells the richer story — one action, one notification.
      await listener.onWalletCredited(
        new WalletCreditedEvent('user-1', 50, 550, 'GAME_REWARD', 'Won', 'txn-1'),
      );

      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should suppress the generic credit for referral bonuses', async () => {
      await listener.onWalletCredited(
        new WalletCreditedEvent('user-1', 50, 550, 'REFERRAL_BONUS', 'Ref', 'txn-1'),
      );

      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should notify on a generic debit', async () => {
      await listener.onWalletDebited(
        new WalletDebitedEvent('user-1', 30, 520, 'ORDER_PAYMENT', 'Paid', 'txn-2'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ templateKey: TEMPLATE_KEYS.WALLET_DEBITED }),
      );
    });

    it('should suppress the generic debit for reward redemptions', async () => {
      await listener.onWalletDebited(
        new WalletDebitedEvent('user-1', 120, 380, 'REWARD_REDEMPTION', 'Redeem', 'txn-3'),
      );

      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should notify on coin expiry', async () => {
      await listener.onCoinsExpired(new CoinsExpiredEvent('user-1', 20, 300));

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ templateKey: TEMPLATE_KEYS.COINS_EXPIRED }),
      );
    });
  });

  describe('reward events', () => {
    it('should notify on redemption', async () => {
      await listener.onRewardRedeemed(
        new RewardRedeemedEvent('user-1', 'r1', 'Free Coffee', 120, 'red-1'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: TEMPLATE_KEYS.REWARD_REDEEMED,
          dedupeKey: 'reward.redeemed:red-1',
        }),
      );
    });

    it('should notify on voucher generation', async () => {
      await listener.onVoucherGenerated(
        new VoucherGeneratedEvent('user-1', 'v1', 'ABCD', 'Free Coffee', new Date()),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ dedupeKey: 'voucher.generated:v1' }),
      );
    });
  });

  describe('game events', () => {
    it('should notify on a win', async () => {
      await listener.onGameCompleted(
        new GameCompletedEvent('user-1', 'g1', 'Spin Wheel', 50, 's1'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: TEMPLATE_KEYS.GAME_WON,
          dedupeKey: 'game.completed:s1',
        }),
      );
    });

    it('should stay silent when nothing was won', async () => {
      await listener.onGameCompleted(
        new GameCompletedEvent('user-1', 'g1', 'Spin Wheel', 0, 's1'),
      );

      expect(dispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('other events', () => {
    it('should notify on referral', async () => {
      await listener.onReferralCompleted(
        new ReferralCompletedEvent('user-1', 'Ada', 100, 'ref-1'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalled();
    });

    it('should notify on campaign start', async () => {
      await listener.onCampaignStarted(
        new CampaignStartedEvent('user-1', 'c1', 'Diwali', 'Double coins'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ templateKey: TEMPLATE_KEYS.CAMPAIGN_STARTED }),
      );
    });

    it('should notify on campaign end via an override', async () => {
      await listener.onCampaignEnded(new CampaignEndedEvent('user-1', 'c1', 'Diwali'));

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          override: expect.objectContaining({ title: 'Diwali has ended' }),
        }),
      );
    });

    it('should notify on birthday reward', async () => {
      await listener.onBirthdayReward(new BirthdayRewardEvent('user-1', 500));

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ templateKey: TEMPLATE_KEYS.BIRTHDAY_REWARD }),
      );
    });

    it('should notify on loyalty upgrade', async () => {
      await listener.onLoyaltyUpgraded(
        new LoyaltyUpgradedEvent('user-1', 'Gold', 'Silver'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          override: expect.objectContaining({ title: 'You reached Gold' }),
        }),
      );
    });

    it('should notify on store announcement', async () => {
      await listener.onStoreAnnouncement(
        new StoreAnnouncementEvent('user-1', 's1', 'Cuttack', 'Now open', 'Come by'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ templateKey: TEMPLATE_KEYS.STORE_ANNOUNCEMENT }),
      );
    });

    it('should force-deliver security alerts past preferences', async () => {
      await listener.onSecurityAlert(
        new SecurityAlertEvent('user-1', 'NEW_DEVICE', 'New sign-in detected'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ force: true }),
      );
    });

    it('should welcome a newly registered customer', async () => {
      await listener.onCustomerRegistered(
        new CustomerRegisteredNotificationEvent('user-1', 'Ada'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          templateKey: TEMPLATE_KEYS.WELCOME,
          dedupeKey: 'customer.welcome:user-1',
        }),
      );
    });

    it('should send an ad-hoc system notification', async () => {
      await listener.onSystemNotification(
        new SystemNotificationEvent('user-1', 'Maintenance', 'Back at 9pm'),
      );

      expect(dispatcher.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          override: expect.objectContaining({ title: 'Maintenance' }),
        }),
      );
    });
  });

  describe('failure isolation', () => {
    it('should never propagate a dispatch failure to the publisher', async () => {
      dispatcher.dispatch.mockRejectedValue(new Error('notification backend down'));

      await expect(
        listener.onWalletCredited(
          new WalletCreditedEvent('user-1', 50, 550, 'ORDER_CASHBACK', 'x', 'txn-1'),
        ),
      ).resolves.toBeUndefined();
    });
  });
});
