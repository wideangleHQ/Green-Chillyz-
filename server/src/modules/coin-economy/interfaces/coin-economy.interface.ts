import {
  CoinLimitScope,
  CoinMultiplierStatus,
  CoinMultiplierType,
  CoinRuleStatus,
  CoinRuleType,
  TransactionSource,
} from '@prisma/client';

export interface CoinRuleResponse {
  id: string;
  name: string;
  description: string | null;
  ruleType: CoinRuleType;
  coinAmount: number;
  minCoins: number | null;
  maxCoins: number | null;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  lifetimeLimit: number | null;
  cooldownSeconds: number;
  enabled: boolean;
  priority: number;
  status: CoinRuleStatus;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface CoinLimitResponse {
  id: string;
  ruleId: string | null;
  name: string;
  description: string | null;
  scope: CoinLimitScope;
  maxCoins: number | null;
  maxClaims: number | null;
  windowSeconds: number | null;
  storeId: string | null;
  enabled: boolean;
  priority: number;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoinMultiplierResponse {
  id: string;
  name: string;
  description: string | null;
  type: CoinMultiplierType;
  multiplier: number;
  ruleId: string | null;
  ruleType: CoinRuleType | null;
  storeId: string | null;
  campaignReference: string | null;
  daysOfWeek: number[];
  stackable: boolean;
  priority: number;
  enabled: boolean;
  status: CoinMultiplierStatus;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Everything the engine needs to decide what a customer action is worth. */
export interface CoinEarnContext {
  userId: string;
  ruleType?: CoinRuleType;
  ruleId?: string;
  storeId?: string | null;
  deviceId?: string | null;
  /** Ties the grant to the originating entity (game session, order, referral). */
  referenceId?: string | null;
  referenceType?: string | null;
  /** Overrides the rule's base coins when the caller already rolled an outcome. */
  requestedCoins?: number | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  device?: string | null;
  /** Fixed evaluation instant; defaults to now. Tests and replays pass it. */
  now?: Date;
}

export interface AppliedMultiplier {
  id: string;
  name: string;
  type: CoinMultiplierType;
  multiplier: number;
}

export interface LimitEvaluation {
  scope: CoinLimitScope | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'LIFETIME';
  limitId: string | null;
  maxCoins: number | null;
  maxClaims: number | null;
  usedCoins: number;
  usedClaims: number;
  /** null means uncapped on coins. */
  remainingCoins: number | null;
  blocked: boolean;
  reason: string | null;
}

/** The full, inspectable outcome of one coin calculation. */
export interface CoinCalculation {
  baseCoins: number;
  multiplier: number;
  multipliersApplied: AppliedMultiplier[];
  coinsAfterMultiplier: number;
  /** Post-clamp, post-limit-headroom figure that actually reaches the wallet. */
  finalCoins: number;
  clampedByMaxCoins: boolean;
  clampedByLimit: boolean;
}

export interface CoinEarnDecision {
  granted: boolean;
  reason: string;
  ruleId: string | null;
  ruleType: CoinRuleType | null;
  coins: number;
  calculation: CoinCalculation | null;
  limits: LimitEvaluation[];
  cooldownSecondsRemaining: number;
  walletSource: TransactionSource | null;
  transactionId: string | null;
  newBalance: number | null;
}

export interface CoinUsage {
  coins: number;
  claims: number;
}

export interface CooldownState {
  active: boolean;
  secondsRemaining: number;
  availableAt: Date | null;
}

/** Customer-facing view of a rule's remaining headroom. */
export interface CustomerCoinRuleView {
  ruleId: string;
  ruleType: CoinRuleType;
  name: string;
  description: string | null;
  coinAmount: number;
  minCoins: number | null;
  maxCoins: number | null;
  dailyLimit: number | null;
  cooldownSeconds: number;
  available: boolean;
  reason: string | null;
  cooldownSecondsRemaining: number;
  remainingToday: number | null;
}

export interface CustomerDailyLimitView {
  ruleId: string;
  ruleType: CoinRuleType;
  name: string;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  lifetimeLimit: number | null;
  usedToday: number;
  usedThisWeek: number;
  usedThisMonth: number;
  usedLifetime: number;
}

export interface AvailableBonusView {
  ruleId: string;
  ruleType: CoinRuleType;
  name: string;
  description: string | null;
  coins: number;
  multiplier: number;
  multipliersApplied: AppliedMultiplier[];
  available: boolean;
  reason: string | null;
}

/**
 * Contract the Campaign Engine will implement to contribute a multiplier.
 * Nothing resolves against it yet — it exists so the engine's shape is fixed
 * before campaigns land.
 */
export interface CampaignMultiplierSource {
  resolveCampaignMultipliers(
    context: CoinEarnContext,
  ): Promise<AppliedMultiplier[]>;
}

export const CAMPAIGN_MULTIPLIER_SOURCE = Symbol('CAMPAIGN_MULTIPLIER_SOURCE');
