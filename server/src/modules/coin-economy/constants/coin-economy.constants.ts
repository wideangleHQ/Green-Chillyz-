import { CoinRuleType, TransactionSource } from '@prisma/client';

export const COIN_ECONOMY_ERRORS = {
  RULE_NOT_FOUND: 'Coin rule not found',
  RULE_DISABLED: 'Coin rule is disabled',
  RULE_NOT_ACTIVE: 'Coin rule is not active',
  RULE_NOT_EFFECTIVE: 'Coin rule is not effective at this time',
  LIMIT_NOT_FOUND: 'Coin limit not found',
  MULTIPLIER_NOT_FOUND: 'Coin multiplier not found',

  NEGATIVE_COINS: 'Coin amount must be zero or positive',
  NEGATIVE_LIMIT: 'Limit values must be zero or positive',
  NEGATIVE_COOLDOWN: 'Cooldown must be zero or positive',
  INVALID_COIN_RANGE: 'Minimum coins must be less than or equal to maximum coins',
  COIN_AMOUNT_OUT_OF_RANGE: 'Coin amount must fall between the minimum and maximum coins',
  INVALID_MULTIPLIER: 'Multiplier must be greater than zero and within the allowed ceiling',
  INVALID_DATE_RANGE: 'Effective-from must be before effective-until',
  INVALID_DAY_OF_WEEK: 'Days of week must be integers between 0 (Sunday) and 6 (Saturday)',
  LIMIT_OVERFLOW: 'A narrower limit window cannot exceed a wider one',
  COOLDOWN_CONFLICT: 'Cooldown exceeds the window implied by the configured daily limit',
  DUPLICATE_RULE_NAME: 'A coin rule with this name already exists',
  DUPLICATE_RULE_TYPE: 'An active coin rule already exists for this rule type',
  DUPLICATE_LIMIT_SCOPE: 'A limit with this scope already exists for this rule and store',
  CANNOT_ARCHIVE_ENABLED: 'Disable the rule before archiving it',
  EMPTY_LIMIT: 'A limit must cap either coins or claims',
} as const;

export const COIN_ECONOMY_REJECTIONS = {
  NO_RULE: 'No coin rule configured for this action',
  RULE_INACTIVE: 'Coin rule is not currently active',
  OUTSIDE_WINDOW: 'Coin rule is outside its effective window',
  COOLDOWN_ACTIVE: 'Cooldown is still active for this rule',
  DAILY_LIMIT: 'Daily coin limit reached',
  WEEKLY_LIMIT: 'Weekly coin limit reached',
  MONTHLY_LIMIT: 'Monthly coin limit reached',
  LIFETIME_LIMIT: 'Lifetime coin limit reached',
  CUSTOM_LIMIT: 'A configured coin limit has been reached',
  ZERO_COINS: 'Rule resolved to zero coins',
} as const;

export const COIN_ECONOMY_PERMISSIONS = {
  RULE_CREATE: 'COIN_RULE_CREATE',
  RULE_UPDATE: 'COIN_RULE_UPDATE',
  RULE_DELETE: 'COIN_RULE_DELETE',
  RULE_VIEW: 'COIN_RULE_VIEW',
  LIMIT_MANAGE: 'COIN_LIMIT_MANAGE',
  MULTIPLIER_MANAGE: 'COIN_MULTIPLIER_MANAGE',
} as const;

export const COIN_ECONOMY_CACHE = {
  PREFIX: 'coin-economy:',

  RULES: 'coin-rules',
  RULE_ITEM: 'coin-economy:rule:',
  RULE_BY_TYPE: 'coin-economy:rule-type:',
  GAME_RULES: 'coin-economy:game-rules',

  LIMITS: 'coin-economy:coin-limits:',
  MULTIPLIERS: 'coin-economy:coin-multipliers:',

  DAILY_LOGIN: 'coin-economy:daily-login:',
  CHECK_IN: 'coin-economy:check-in:',

  COOLDOWN: 'coin-economy:cooldown:',
  USAGE: 'coin-economy:usage:',

  TTL_RULES: 300,
  TTL_RULE_ITEM: 300,
  TTL_GAME_RULES: 300,
  TTL_LIMITS: 300,
  TTL_MULTIPLIERS: 300,
  TTL_USAGE: 120,
  TTL_MARKER: 86400,
} as const;

export const COIN_ECONOMY_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  /** Applied when no multiplier matches — never a coin value. */
  BASE_MULTIPLIER: 1,
  /** Guardrail against a fat-fingered multiplier draining the budget. */
  MAX_MULTIPLIER: 100,
  /** Guardrail against a fat-fingered coin amount. */
  MAX_COIN_AMOUNT: 1_000_000,
} as const;

export const COIN_ECONOMY_EVENTS = {
  RULE_CREATED: 'coin-rule.created',
  RULE_UPDATED: 'coin-rule.updated',
  RULE_ENABLED: 'coin-rule.enabled',
  RULE_DISABLED: 'coin-rule.disabled',
  RULE_ARCHIVED: 'coin-rule.archived',
  RULE_RESTORED: 'coin-rule.restored',
  RULE_DUPLICATED: 'coin-rule.duplicated',
  MULTIPLIER_CHANGED: 'coin-multiplier.changed',
  LIMIT_CHANGED: 'coin-limit.changed',
  LIMIT_REACHED: 'coin-limit.reached',
  COINS_GRANTED: 'coin-economy.coins.granted',
} as const;

export const COIN_RULE_HISTORY_ACTIONS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  DUPLICATED: 'DUPLICATED',
} as const;

/**
 * Where a grant lands in the wallet ledger. The wallet's own
 * TransactionSource enum is reused verbatim — the coin economy adds no
 * transaction semantics of its own.
 */
export const COIN_RULE_WALLET_SOURCE: Record<CoinRuleType, TransactionSource> = {
  DAILY_LOGIN: TransactionSource.SYSTEM_REWARD,
  DAILY_CHECK_IN: TransactionSource.CHECK_IN_REWARD,
  SPIN_WHEEL: TransactionSource.GAME_REWARD,
  SCRATCH_CARD: TransactionSource.GAME_REWARD,
  MEMORY_GAME: TransactionSource.GAME_REWARD,
  FOOD_QUIZ: TransactionSource.GAME_REWARD,
  LUCKY_BOX: TransactionSource.GAME_REWARD,
  STORE_CHECK_IN: TransactionSource.STORE_VISIT,
  BIRTHDAY_BONUS: TransactionSource.BIRTHDAY_REWARD,
  FESTIVAL_BONUS: TransactionSource.CAMPAIGN_REWARD,
  REFERRAL_BONUS: TransactionSource.REFERRAL_BONUS,
  PURCHASE_BONUS: TransactionSource.ORDER_CASHBACK,
  MANUAL_BONUS: TransactionSource.ADMIN_ADJUSTMENT,
  CAMPAIGN_BONUS: TransactionSource.CAMPAIGN_REWARD,
  CUSTOM: TransactionSource.SYSTEM_REWARD,
};

/** Rule types surfaced by the public "game coin rules" endpoint. */
export const COIN_GAME_RULE_TYPES: CoinRuleType[] = [
  CoinRuleType.SPIN_WHEEL,
  CoinRuleType.SCRATCH_CARD,
  CoinRuleType.MEMORY_GAME,
  CoinRuleType.FOOD_QUIZ,
  CoinRuleType.LUCKY_BOX,
];

/** Reference type stamped on wallet transactions so usage can be recounted. */
export const COIN_RULE_REFERENCE_TYPE = 'coin_rule';

/**
 * Seed values used once, when a rule type has no rule yet. They exist so a
 * fresh install is usable; every value is editable afterwards and nothing in
 * the engine reads this map at evaluation time.
 */
export interface CoinRuleSeed {
  ruleType: CoinRuleType;
  name: string;
  description: string;
  coinAmount: number;
  minCoins: number | null;
  maxCoins: number | null;
  dailyLimit: number | null;
  cooldownSeconds: number;
}

export const COIN_RULE_SEEDS: CoinRuleSeed[] = [
  {
    ruleType: CoinRuleType.DAILY_LOGIN,
    name: 'Daily Login',
    description: 'Coins for opening the app once a day',
    coinAmount: 5,
    minCoins: null,
    maxCoins: null,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.DAILY_CHECK_IN,
    name: 'Daily Check-in',
    description: 'Coins for the daily check-in action',
    coinAmount: 10,
    minCoins: null,
    maxCoins: null,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.SPIN_WHEEL,
    name: 'Spin Wheel',
    description: 'Coins awarded for a spin wheel play',
    coinAmount: 5,
    minCoins: 5,
    maxCoins: 25,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.SCRATCH_CARD,
    name: 'Scratch Card',
    description: 'Coins awarded for a scratch card play',
    coinAmount: 10,
    minCoins: 10,
    maxCoins: 30,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.MEMORY_GAME,
    name: 'Memory Game',
    description: 'Coins awarded for completing the memory game',
    coinAmount: 15,
    minCoins: 15,
    maxCoins: 40,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.FOOD_QUIZ,
    name: 'Food Quiz',
    description: 'Coins awarded for completing the food quiz',
    coinAmount: 10,
    minCoins: 10,
    maxCoins: 25,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.LUCKY_BOX,
    name: 'Lucky Box',
    description: 'Coins awarded for opening a lucky box',
    coinAmount: 20,
    minCoins: 20,
    maxCoins: 100,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.STORE_CHECK_IN,
    name: 'Store Check-in',
    description: 'Coins for checking in at a store',
    coinAmount: 20,
    minCoins: null,
    maxCoins: null,
    dailyLimit: 1,
    cooldownSeconds: 86400,
  },
  {
    ruleType: CoinRuleType.BIRTHDAY_BONUS,
    name: 'Birthday Bonus',
    description: 'Coins granted on the customer birthday',
    coinAmount: 300,
    minCoins: null,
    maxCoins: null,
    dailyLimit: 1,
    cooldownSeconds: 0,
  },
  {
    ruleType: CoinRuleType.FESTIVAL_BONUS,
    name: 'Festival Bonus',
    description: 'Coins granted during a festival window',
    coinAmount: 100,
    minCoins: 100,
    maxCoins: 300,
    dailyLimit: 1,
    cooldownSeconds: 0,
  },
  {
    ruleType: CoinRuleType.REFERRAL_BONUS,
    name: 'Referral Bonus',
    description: 'Coins granted for a completed referral',
    coinAmount: 200,
    minCoins: null,
    maxCoins: null,
    dailyLimit: null,
    cooldownSeconds: 0,
  },
];
