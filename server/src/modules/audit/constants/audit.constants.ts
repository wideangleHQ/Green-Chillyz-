export const AUDIT_ERRORS = {
  NOT_FOUND: 'Audit record not found',
  IMMUTABLE: 'Audit records are immutable and cannot be modified',
  INVALID_CURSOR: 'Invalid pagination cursor',
  INVALID_DATE_RANGE: 'End date must be after start date',
} as const;

export const AUDIT_PERMISSIONS = {
  VIEW: 'AUDIT_VIEW',
  VIEW_ALL: 'AUDIT_VIEW_ALL',
  SEARCH: 'AUDIT_SEARCH',
  ANALYTICS_VIEW: 'AUDIT_ANALYTICS_VIEW',
  EXPORT: 'AUDIT_EXPORT',
} as const;

export const AUDIT_CACHE = {
  PREFIX: 'audit:',
  RECENT: 'audit:recent',
  TIMELINE: 'audit:timeline:',
  ANALYTICS: 'audit:analytics',
  ENTITY: 'audit:entity:',
  TTL_RECENT: 30,
  TTL_TIMELINE: 60,
  TTL_ANALYTICS: 300,
  TTL_ENTITY: 120,
} as const;

export const AUDIT_DEFAULTS = {
  PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  RECENT_LIMIT: 20,
  ANALYTICS_TOP_N: 10,
} as const;

/**
 * Domain events the audit platform subscribes to.
 *
 * Several already exist and are emitted by their owning module (the wallet,
 * rewards, game and notification events). Audit listens alongside the
 * notification listener — EventEmitter2 fans out to both, so no publisher
 * changes when a new consumer appears.
 */
export const AUDIT_EVENTS = {
  // Reused from the notification platform's published events.
  CUSTOMER_REGISTERED: 'customer.registered',
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  REWARD_REDEEMED: 'reward.redeemed',
  VOUCHER_GENERATED: 'voucher.generated',
  GAME_COMPLETED: 'game.completed',

  // Audit-specific events.
  CUSTOMER_LOGIN: 'audit.customer.login',
  EMPLOYEE_LOGIN: 'audit.employee.login',
  DASHBOARD_LOGIN: 'audit.dashboard.login',
  VOUCHER_REDEEMED: 'audit.voucher.redeemed',
  QR_REDEMPTION: 'audit.qr.redemption',
  NOTIFICATION_SENT: 'audit.notification.sent',
  BROADCAST_NOTIFICATION: 'audit.notification.broadcast',
  STORE_CREATED: 'audit.store.created',
  STORE_UPDATED: 'audit.store.updated',
  REWARD_CREATED: 'audit.reward.created',
  REWARD_UPDATED: 'audit.reward.updated',
  REWARD_DELETED: 'audit.reward.deleted',
  CAMPAIGN_CREATED: 'audit.campaign.created',
  OFFER_CREATED: 'audit.offer.created',
  PERMISSION_CHANGED: 'audit.permission.changed',
  ROLE_CHANGED: 'audit.role.changed',
  MANUAL_WALLET_ADJUSTMENT: 'audit.wallet.manual_adjustment',
  CUSTOMER_LOOKUP: 'audit.customer.lookup',
  SYSTEM_ERROR: 'audit.system.error',
} as const;

/**
 * Entity types an audit row can point at. Adding a new one (ORDER, POS,
 * KITCHEN, VENDOR, INVENTORY) requires no schema or service change.
 */
export const AUDIT_ENTITY_TYPES = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  EMPLOYEE: 'EMPLOYEE',
  WALLET: 'WALLET',
  WALLET_TRANSACTION: 'WALLET_TRANSACTION',
  REWARD: 'REWARD',
  REDEMPTION: 'REDEMPTION',
  VOUCHER: 'VOUCHER',
  GAME: 'GAME',
  GAME_SESSION: 'GAME_SESSION',
  STORE: 'STORE',
  CAMPAIGN: 'CAMPAIGN',
  OFFER: 'OFFER',
  NOTIFICATION: 'NOTIFICATION',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  SESSION: 'SESSION',
  SYSTEM: 'SYSTEM',
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  READ: 'READ',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  ADJUST: 'ADJUST',
  REDEEM: 'REDEEM',
  GENERATE: 'GENERATE',
  COMPLETE: 'COMPLETE',
  SEND: 'SEND',
  BROADCAST: 'BROADCAST',
  GRANT: 'GRANT',
  REVOKE: 'REVOKE',
  LOOKUP: 'LOOKUP',
  ERROR: 'ERROR',
} as const;

export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
