import { NotificationType } from '@prisma/client';

export const NOTIFICATION_ERRORS = {
  NOT_FOUND: 'Notification not found',
  TEMPLATE_NOT_FOUND: 'Notification template not found',
  TEMPLATE_KEY_EXISTS: 'A template with this key already exists',
  TEMPLATE_INACTIVE: 'This notification template is inactive',
  CHANNEL_NOT_REGISTERED: 'No handler registered for this notification channel',
  CHANNEL_UNAVAILABLE: 'Notification channel is not available',
  USER_OPTED_OUT: 'User has opted out of this notification category',
  DUPLICATE: 'Notification already delivered for this event',
  RECIPIENT_REQUIRED: 'A recipient user is required',
} as const;

export const NOTIFICATION_PERMISSIONS = {
  SEND: 'NOTIFICATION_SEND',
  BROADCAST: 'NOTIFICATION_BROADCAST',
  TEMPLATE_MANAGE: 'NOTIFICATION_TEMPLATE_MANAGE',
  ANALYTICS_VIEW: 'NOTIFICATION_ANALYTICS_VIEW',
} as const;

export const NOTIFICATION_CACHE = {
  PREFIX: 'notification:',
  UNREAD_COUNT: 'notification:unread:',
  LATEST: 'notification:latest:',
  TEMPLATE: 'notification:template:',
  PREFERENCES: 'notification:prefs:',
  TTL_UNREAD: 120,
  TTL_LATEST: 60,
  TTL_TEMPLATE: 600,
  TTL_PREFERENCES: 300,
} as const;

export const NOTIFICATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  LATEST_LIMIT: 10,
  DEFAULT_EXPIRY_DAYS: 90,
} as const;

/**
 * Domain events the platform reacts to. Publishers emit these; the
 * notification module is the only subscriber that turns them into messages,
 * so adding a channel never touches the publishing module.
 */
export const NOTIFICATION_EVENTS = {
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  COINS_EXPIRED: 'wallet.coins.expired',
  REWARD_REDEEMED: 'reward.redeemed',
  VOUCHER_GENERATED: 'voucher.generated',
  GAME_COMPLETED: 'game.completed',
  REFERRAL_COMPLETED: 'referral.completed',
  CAMPAIGN_STARTED: 'campaign.started',
  CAMPAIGN_ENDED: 'campaign.ended',
  BIRTHDAY_REWARD: 'reward.birthday',
  LOYALTY_UPGRADED: 'loyalty.upgraded',
  STORE_ANNOUNCEMENT: 'store.announcement',
  SECURITY_ALERT: 'security.alert',
  CUSTOMER_REGISTERED: 'customer.registered',
  SYSTEM_NOTIFICATION: 'system.notification',
} as const;

/** Built-in template keys. Templates are data, so new ones need no code. */
export const TEMPLATE_KEYS = {
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  COINS_EXPIRED: 'wallet.coins.expired',
  GAME_WON: 'game.won',
  REWARD_REDEEMED: 'reward.redeemed',
  VOUCHER_GENERATED: 'voucher.generated',
  REFERRAL_BONUS: 'referral.bonus',
  BIRTHDAY_REWARD: 'reward.birthday',
  CAMPAIGN_STARTED: 'campaign.started',
  STORE_ANNOUNCEMENT: 'store.announcement',
  SECURITY_ALERT: 'security.alert',
  WELCOME: 'customer.welcome',
} as const;

/**
 * Maps a notification type to the preference column that gates it.
 * Adding a type without a mapping defaults to "always allowed".
 */
export const TYPE_TO_PREFERENCE: Partial<Record<NotificationType, string>> = {
  WALLET: 'wallet',
  GAME: 'games',
  REWARD: 'rewards',
  REDEMPTION: 'rewards',
  MARKETING: 'marketing',
  CAMPAIGN: 'campaigns',
  STORE: 'storeUpdates',
  REFERRAL: 'referral',
  SECURITY: 'security',
  SYSTEM: 'system',
  LOYALTY: 'rewards',
};

export const NOTIFICATION_ANALYTICS_EVENTS = {
  SENT: 'SENT',
  READ: 'READ',
  CLICKED: 'CLICKED',
} as const;
