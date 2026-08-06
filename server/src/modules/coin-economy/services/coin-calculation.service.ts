import { Injectable } from '@nestjs/common';
import { CoinMultiplierService } from './coin-multiplier.service';
import { COIN_ECONOMY_DEFAULTS } from '../constants';
import {
  AppliedMultiplier,
  CoinCalculation,
  CoinEarnContext,
  CoinRuleResponse,
} from '../interfaces';

/**
 * Base Coins → Multiplier → Clamp → Limit headroom.
 *
 * Every input is a rule field or a stored multiplier row; nothing here embeds
 * a coin value. Kept free of I/O beyond multiplier resolution so the pipeline
 * is directly testable.
 */
@Injectable()
export class CoinCalculationService {
  constructor(private readonly multipliers: CoinMultiplierService) {}

  async calculate(
    rule: CoinRuleResponse,
    context: CoinEarnContext,
    now: Date,
    remainingLimitCoins: number | null,
  ): Promise<CoinCalculation> {
    const baseCoins = this.resolveBaseCoins(rule, context.requestedCoins ?? null);

    const applicable = await this.multipliers.resolve(
      rule.id,
      rule.ruleType,
      context.storeId ?? null,
      now,
    );

    const { multiplier, applied } = this.combineMultipliers(applicable);
    const coinsAfterMultiplier = Math.round(baseCoins * multiplier);

    let finalCoins = coinsAfterMultiplier;
    let clampedByMaxCoins = false;
    let clampedByLimit = false;

    if (rule.maxCoins !== null && finalCoins > rule.maxCoins) {
      finalCoins = rule.maxCoins;
      clampedByMaxCoins = true;
    }

    if (remainingLimitCoins !== null && finalCoins > remainingLimitCoins) {
      finalCoins = remainingLimitCoins;
      clampedByLimit = true;
    }

    return {
      baseCoins,
      multiplier,
      multipliersApplied: applied,
      coinsAfterMultiplier,
      finalCoins: Math.max(0, finalCoins),
      clampedByMaxCoins,
      clampedByLimit,
    };
  }

  /**
   * The caller's pre-rolled outcome wins when present (games roll their own
   * prize), but the rule's min/max still bound it. Otherwise the rule's
   * configured amount applies, clamped into its own range.
   */
  resolveBaseCoins(rule: CoinRuleResponse, requestedCoins: number | null): number {
    const candidate = requestedCoins ?? rule.coinAmount;
    return this.clampToRange(candidate, rule.minCoins, rule.maxCoins);
  }

  /**
   * Stackable multipliers compound with each other; the non-stackable set
   * contributes only its single strongest entry. A grant with no multiplier
   * resolves to the neutral factor, never to a hardcoded coin figure.
   */
  combineMultipliers(
    candidates: Array<AppliedMultiplier & { stackable: boolean }>,
  ): { multiplier: number; applied: AppliedMultiplier[] } {
    if (candidates.length === 0) {
      return { multiplier: COIN_ECONOMY_DEFAULTS.BASE_MULTIPLIER, applied: [] };
    }

    const stackable = candidates.filter((candidate) => candidate.stackable);
    const exclusive = candidates.filter((candidate) => !candidate.stackable);

    const applied: AppliedMultiplier[] = [];
    let multiplier = COIN_ECONOMY_DEFAULTS.BASE_MULTIPLIER;

    const strongestExclusive = exclusive.reduce<AppliedMultiplier | null>(
      (best, candidate) =>
        best === null || candidate.multiplier > best.multiplier ? candidate : best,
      null,
    );

    if (strongestExclusive) {
      multiplier *= strongestExclusive.multiplier;
      applied.push(strip(strongestExclusive));
    }

    for (const candidate of stackable) {
      multiplier *= candidate.multiplier;
      applied.push(strip(candidate));
    }

    return {
      multiplier: Math.min(
        Number(multiplier.toFixed(3)),
        COIN_ECONOMY_DEFAULTS.MAX_MULTIPLIER,
      ),
      applied,
    };
  }

  private clampToRange(
    value: number,
    min: number | null,
    max: number | null,
  ): number {
    let result = Math.max(0, Math.trunc(value));
    if (min !== null && result < min) result = min;
    if (max !== null && result > max) result = max;
    return result;
  }
}

function strip(candidate: AppliedMultiplier): AppliedMultiplier {
  return {
    id: candidate.id,
    name: candidate.name,
    type: candidate.type,
    multiplier: candidate.multiplier,
  };
}
