export const WALLET_ERRORS = {
  NOT_FOUND: 'Wallet not found',
  INACTIVE: 'Wallet is inactive',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  DUPLICATE_TRANSACTION: 'Transaction with this idempotency key already exists',
  INVALID_AMOUNT: 'Transaction amount must be greater than zero',
  USER_WALLET_EXISTS: 'User already has a wallet',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
} as const;

export const WALLET_PERMISSIONS = {
  VIEW_OWN: 'WALLET_VIEW_OWN',
  VIEW_ANY: 'WALLET_VIEW_ANY',
  CREDIT: 'WALLET_CREDIT',
  DEBIT: 'WALLET_DEBIT',
  ADJUST: 'WALLET_ADJUST',
} as const;

export const WALLET_CACHE = {
  PREFIX: 'wallet:',
  SUMMARY: 'wallet:summary:',
  BALANCE: 'wallet:balance:',
  TTL: 60,
} as const;

export const WALLET_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
