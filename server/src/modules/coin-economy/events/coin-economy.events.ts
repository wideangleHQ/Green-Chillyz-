import { CoinLimitScope, CoinRuleType } from '@prisma/client';

/**
 * Published by the coin economy. The audit listener in this module is the only
 * subscriber today; no business logic consumes these yet.
 */

export class CoinRuleCreatedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly name: string,
    public readonly ruleType: CoinRuleType,
    public readonly coinAmount: number,
    public readonly createdBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinRuleUpdatedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly ruleType: CoinRuleType,
    public readonly changedFields: string[],
    public readonly oldValue: Record<string, unknown>,
    public readonly newValue: Record<string, unknown>,
    public readonly updatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinRuleEnabledEvent {
  constructor(
    public readonly ruleId: string,
    public readonly name: string,
    public readonly ruleType: CoinRuleType,
    public readonly enabledBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinRuleDisabledEvent {
  constructor(
    public readonly ruleId: string,
    public readonly name: string,
    public readonly ruleType: CoinRuleType,
    public readonly disabledBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinRuleArchivedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly name: string,
    public readonly ruleType: CoinRuleType,
    public readonly archivedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinRuleRestoredEvent {
  constructor(
    public readonly ruleId: string,
    public readonly name: string,
    public readonly ruleType: CoinRuleType,
    public readonly restoredBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinRuleDuplicatedEvent {
  constructor(
    public readonly sourceRuleId: string,
    public readonly newRuleId: string,
    public readonly ruleType: CoinRuleType,
    public readonly duplicatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinMultiplierChangedEvent {
  constructor(
    public readonly multiplierId: string,
    public readonly name: string,
    public readonly action: string,
    public readonly oldMultiplier: number | null,
    public readonly newMultiplier: number | null,
    public readonly changedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinLimitChangedEvent {
  constructor(
    public readonly limitId: string,
    public readonly name: string,
    public readonly scope: CoinLimitScope,
    public readonly action: string,
    public readonly ruleId: string | null,
    public readonly changedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinLimitReachedEvent {
  constructor(
    public readonly userId: string,
    public readonly ruleId: string,
    public readonly ruleType: CoinRuleType,
    public readonly scope: string,
    public readonly limitId: string | null,
    public readonly usedCoins: number,
    public readonly maxCoins: number | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class CoinsGrantedEvent {
  constructor(
    public readonly userId: string,
    public readonly ruleId: string,
    public readonly ruleType: CoinRuleType,
    public readonly baseCoins: number,
    public readonly multiplier: number,
    public readonly finalCoins: number,
    public readonly transactionId: string | null,
    public readonly storeId: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
