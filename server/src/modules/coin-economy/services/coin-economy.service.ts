import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinRuleStatus, CoinRuleType } from '@prisma/client';
import { WalletService } from '../../wallet/services/wallet.service';
import { CoinRuleService } from './coin-rule.service';
import { CoinLimitService, isEffective } from './coin-limit.service';
import { CoinCooldownService } from './coin-cooldown.service';
import { CoinCalculationService } from './coin-calculation.service';
import { CoinEconomyCacheService } from '../cache';
import {
  COIN_ECONOMY_EVENTS,
  COIN_ECONOMY_REJECTIONS,
  COIN_RULE_REFERENCE_TYPE,
  COIN_RULE_WALLET_SOURCE,
} from '../constants';
import { CoinLimitReachedEvent, CoinsGrantedEvent } from '../events';
import {
  AvailableBonusView,
  CoinEarnContext,
  CoinEarnDecision,
  CoinRuleResponse,
  CustomerCoinRuleView,
  CustomerDailyLimitView,
} from '../interfaces';

/**
 * The single entry point for earning coins.
 *
 * Pipeline: resolve rule → cooldown → limits → calculate → wallet credit.
 * Crediting delegates to WalletService untouched, so the wallet remains the
 * only writer of its own ledger and this module the only source of amounts.
 */
@Injectable()
export class CoinEconomyService {
  private readonly logger = new Logger(CoinEconomyService.name);

  constructor(
    private readonly rules: CoinRuleService,
    private readonly limits: CoinLimitService,
    private readonly cooldowns: CoinCooldownService,
    private readonly calculator: CoinCalculationService,
    private readonly wallet: WalletService,
    private readonly cache: CoinEconomyCacheService,
    private readonly events: EventEmitter2,
  ) {}

  /** Resolves the decision and credits the wallet when it is a grant. */
  async earn(context: CoinEarnContext): Promise<CoinEarnDecision> {
    const now = context.now ?? new Date();
    const decision = await this.evaluate(context, now);

    if (!decision.granted || decision.ruleId === null) {
      return decision;
    }

    const credit = await this.wallet.credit(
      {
        userId: context.userId,
        amount: decision.coins,
        source: decision.walletSource!,
        description: `Coins from rule: ${decision.ruleType}`,
        referenceId: decision.ruleId,
        referenceType: COIN_RULE_REFERENCE_TYPE,
        idempotencyKey: this.idempotencyKey(context, decision.ruleId, now),
        metadata: {
          ...(context.metadata ?? {}),
          ruleId: decision.ruleId,
          ruleType: decision.ruleType,
          storeId: context.storeId ?? null,
          deviceId: context.deviceId ?? null,
          baseCoins: decision.calculation?.baseCoins ?? null,
          multiplier: decision.calculation?.multiplier ?? null,
          originReferenceId: context.referenceId ?? null,
          originReferenceType: context.referenceType ?? null,
        },
      },
      undefined,
      context.ip ?? undefined,
      context.device ?? undefined,
    );

    const rule = await this.rules.findById(decision.ruleId);
    await this.cooldowns.start(
      context.userId,
      decision.ruleId,
      rule.cooldownSeconds,
      now,
    );
    await this.markDailyRule(context.userId, rule.ruleType, now);
    await this.cache.invalidateUsage(context.userId);

    this.events.emit(
      COIN_ECONOMY_EVENTS.COINS_GRANTED,
      new CoinsGrantedEvent(
        context.userId,
        decision.ruleId,
        rule.ruleType,
        decision.calculation?.baseCoins ?? decision.coins,
        decision.calculation?.multiplier ?? 1,
        decision.coins,
        credit.transaction.id,
        context.storeId ?? null,
      ),
    );

    this.logger.log(
      `Granted ${decision.coins} coins to ${context.userId} via ${rule.ruleType}`,
    );

    return {
      ...decision,
      transactionId: credit.transaction.id,
      newBalance: credit.newBalance,
    };
  }

  /** Same pipeline as earn, without touching the wallet. */
  async preview(context: CoinEarnContext): Promise<CoinEarnDecision> {
    return this.evaluate(context, context.now ?? new Date());
  }

  // ─── Customer views ───────────────────────────────

  async getCustomerRules(
    userId: string,
    storeId: string | null,
    now = new Date(),
  ): Promise<CustomerCoinRuleView[]> {
    const rules = await this.rules.findAllActive();
    return this.buildCustomerViews(rules, userId, storeId, now);
  }

  async getCustomerGameRules(
    userId: string,
    storeId: string | null,
    now = new Date(),
  ): Promise<CustomerCoinRuleView[]> {
    const rules = await this.rules.findActiveGameRules();
    return this.buildCustomerViews(rules, userId, storeId, now);
  }

  async getCustomerDailyLimits(
    userId: string,
    now = new Date(),
  ): Promise<CustomerDailyLimitView[]> {
    const rules = await this.rules.findAllActive();

    const usages = await Promise.all(
      rules.map((rule) => this.limits.describeUsage(rule, userId, now)),
    );

    return rules.map((rule, index) => ({
      ruleId: rule.id,
      ruleType: rule.ruleType,
      name: rule.name,
      dailyLimit: rule.dailyLimit,
      weeklyLimit: rule.weeklyLimit,
      monthlyLimit: rule.monthlyLimit,
      lifetimeLimit: rule.lifetimeLimit,
      ...usages[index],
    }));
  }

  /** Rules the customer can act on right now, with what they are worth. */
  async getAvailableBonuses(
    userId: string,
    storeId: string | null,
    now = new Date(),
  ): Promise<AvailableBonusView[]> {
    const rules = await this.rules.findAllActive();

    const decisions = await Promise.all(
      rules.map((rule) =>
        this.evaluate({ userId, ruleId: rule.id, storeId, now }, now),
      ),
    );

    return rules.map((rule, index) => {
      const decision = decisions[index];
      return {
        ruleId: rule.id,
        ruleType: rule.ruleType,
        name: rule.name,
        description: rule.description,
        coins: decision.calculation?.finalCoins ?? 0,
        multiplier: decision.calculation?.multiplier ?? 1,
        multipliersApplied: decision.calculation?.multipliersApplied ?? [],
        available: decision.granted,
        reason: decision.granted ? null : decision.reason,
      };
    });
  }

  // ─── Pipeline ─────────────────────────────────────

  private async evaluate(
    context: CoinEarnContext,
    now: Date,
  ): Promise<CoinEarnDecision> {
    const rule = await this.resolveRule(context);
    if (!rule) return reject(COIN_ECONOMY_REJECTIONS.NO_RULE);

    if (!rule.enabled || rule.status !== CoinRuleStatus.ACTIVE) {
      return reject(COIN_ECONOMY_REJECTIONS.RULE_INACTIVE, rule);
    }

    if (!isEffective(rule.effectiveFrom, rule.effectiveUntil, now)) {
      return reject(COIN_ECONOMY_REJECTIONS.OUTSIDE_WINDOW, rule);
    }

    const cooldown = await this.cooldowns.check(
      context.userId,
      rule.id,
      rule.cooldownSeconds,
      now,
    );
    if (cooldown.active) {
      return {
        ...reject(COIN_ECONOMY_REJECTIONS.COOLDOWN_ACTIVE, rule),
        cooldownSecondsRemaining: cooldown.secondsRemaining,
      };
    }

    const limitCheck = await this.limits.check(rule, context, now);
    if (limitCheck.blocked) {
      const blocking = limitCheck.blockingEvaluation;
      if (blocking) {
        this.events.emit(
          COIN_ECONOMY_EVENTS.LIMIT_REACHED,
          new CoinLimitReachedEvent(
            context.userId,
            rule.id,
            rule.ruleType,
            String(blocking.scope),
            blocking.limitId,
            blocking.usedCoins,
            blocking.maxCoins,
          ),
        );
      }
      return {
        ...reject(limitCheck.reason ?? COIN_ECONOMY_REJECTIONS.CUSTOM_LIMIT, rule),
        limits: limitCheck.evaluations,
      };
    }

    const calculation = await this.calculator.calculate(
      rule,
      context,
      now,
      limitCheck.remainingCoins,
    );

    if (calculation.finalCoins <= 0) {
      return {
        ...reject(COIN_ECONOMY_REJECTIONS.ZERO_COINS, rule),
        calculation,
        limits: limitCheck.evaluations,
      };
    }

    return {
      granted: true,
      reason: `Coins granted by rule: ${rule.name}`,
      ruleId: rule.id,
      ruleType: rule.ruleType,
      coins: calculation.finalCoins,
      calculation,
      limits: limitCheck.evaluations,
      cooldownSecondsRemaining: 0,
      walletSource: COIN_RULE_WALLET_SOURCE[rule.ruleType],
      transactionId: null,
      newBalance: null,
    };
  }

  private async resolveRule(
    context: CoinEarnContext,
  ): Promise<CoinRuleResponse | null> {
    if (context.ruleId) {
      return this.rules.findById(context.ruleId);
    }
    if (context.ruleType) {
      return this.rules.findActiveByType(context.ruleType);
    }
    throw new BadRequestException('Either ruleType or ruleId is required');
  }

  private async buildCustomerViews(
    rules: CoinRuleResponse[],
    userId: string,
    storeId: string | null,
    now: Date,
  ): Promise<CustomerCoinRuleView[]> {
    const decisions = await Promise.all(
      rules.map((rule) =>
        this.evaluate({ userId, ruleId: rule.id, storeId, now }, now),
      ),
    );

    return rules.map((rule, index) => {
      const decision = decisions[index];
      const daily = decision.limits.find((limit) => limit.scope === 'DAILY');
      return {
        ruleId: rule.id,
        ruleType: rule.ruleType,
        name: rule.name,
        description: rule.description,
        coinAmount: rule.coinAmount,
        minCoins: rule.minCoins,
        maxCoins: rule.maxCoins,
        dailyLimit: rule.dailyLimit,
        cooldownSeconds: rule.cooldownSeconds,
        available: decision.granted,
        reason: decision.granted ? null : decision.reason,
        cooldownSecondsRemaining: decision.cooldownSecondsRemaining,
        remainingToday: daily?.remainingCoins ?? null,
      };
    });
  }

  /**
   * Collapses a retried grant onto one wallet transaction. Reference-bound
   * grants key on the reference; recurring ones key on the rule's window so a
   * double-tap on "daily login" cannot pay twice.
   */
  private idempotencyKey(
    context: CoinEarnContext,
    ruleId: string,
    now: Date,
  ): string {
    if (context.referenceId) {
      return `coin-rule:${ruleId}:${context.referenceId}`;
    }
    return `coin-rule:${ruleId}:${context.userId}:${dayKey(now)}`;
  }

  private async markDailyRule(
    userId: string,
    ruleType: CoinRuleType,
    now: Date,
  ): Promise<void> {
    if (ruleType === CoinRuleType.DAILY_LOGIN) {
      await this.cache.setDailyLoginMarker(userId, dayKey(now));
    } else if (ruleType === CoinRuleType.DAILY_CHECK_IN) {
      await this.cache.setCheckInMarker(userId, dayKey(now));
    }
  }
}

export function dayKey(now: Date): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function reject(reason: string, rule?: CoinRuleResponse): CoinEarnDecision {
  return {
    granted: false,
    reason,
    ruleId: rule?.id ?? null,
    ruleType: rule?.ruleType ?? null,
    coins: 0,
    calculation: null,
    limits: [],
    cooldownSecondsRemaining: 0,
    walletSource: rule ? COIN_RULE_WALLET_SOURCE[rule.ruleType] : null,
    transactionId: null,
    newBalance: null,
  };
}
