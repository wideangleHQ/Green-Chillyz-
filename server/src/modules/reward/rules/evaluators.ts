import { RULE_TYPES } from '../constants';
import { RuleContext, RuleEvaluationResult } from '../interfaces';
import { RewardRuleEvaluator } from './rule.interface';

export class DailyLimitRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.DAILY_LIMIT;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    const limit = parseInt(value, 10);
    if (context.dailyClaimCount >= limit) {
      return { passed: false, reason: `Daily limit of ${limit} reached`, ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Within daily limit', ruleType: this.ruleType };
  }
}

export class MaxClaimsRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.MAX_CLAIMS;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    const max = parseInt(value, 10);
    if (context.totalClaimCount >= max) {
      return { passed: false, reason: `Maximum claims of ${max} reached`, ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Within claim limit', ruleType: this.ruleType };
  }
}

export class MinPurchaseRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.MIN_PURCHASE;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    const min = parseFloat(value);
    if (!context.purchaseAmount || context.purchaseAmount < min) {
      return { passed: false, reason: `Minimum purchase of ${min} not met`, ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Purchase meets minimum', ruleType: this.ruleType };
  }
}

export class StoreEligibleRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.STORE_ELIGIBLE;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    if (!context.storeId) {
      return { passed: true, reason: 'No store constraint', ruleType: this.ruleType };
    }
    const storeIds = value.split(',').map((s) => s.trim());
    if (!storeIds.includes(context.storeId)) {
      return { passed: false, reason: 'Store not eligible for this campaign', ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Store is eligible', ruleType: this.ruleType };
  }
}

export class BrandEligibleRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.BRAND_ELIGIBLE;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    if (!context.brandId) {
      return { passed: true, reason: 'No brand constraint', ruleType: this.ruleType };
    }
    const brandIds = value.split(',').map((s) => s.trim());
    if (!brandIds.includes(context.brandId)) {
      return { passed: false, reason: 'Brand not eligible for this campaign', ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Brand is eligible', ruleType: this.ruleType };
  }
}

export class WeekendOnlyRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.WEEKEND_ONLY;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    const isWeekend = value.toLowerCase() === 'true';
    if (!isWeekend) {
      return { passed: true, reason: 'No weekend restriction', ruleType: this.ruleType };
    }
    const day = context.now.getUTCDay();
    if (day !== 0 && day !== 6) {
      return { passed: false, reason: 'Campaign is weekend-only', ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Is weekend', ruleType: this.ruleType };
  }
}

export class TimeWindowRule implements RewardRuleEvaluator {
  readonly ruleType = RULE_TYPES.TIME_WINDOW;

  evaluate(context: RuleContext, _operator: string, value: string): RuleEvaluationResult {
    const [startHour, endHour] = value.split('-').map((h) => parseInt(h.trim(), 10));
    const currentHour = context.now.getUTCHours();
    if (currentHour < startHour || currentHour >= endHour) {
      return { passed: false, reason: `Outside time window ${startHour}:00-${endHour}:00`, ruleType: this.ruleType };
    }
    return { passed: true, reason: 'Within time window', ruleType: this.ruleType };
  }
}

export const ALL_RULE_EVALUATORS: RewardRuleEvaluator[] = [
  new DailyLimitRule(),
  new MaxClaimsRule(),
  new MinPurchaseRule(),
  new StoreEligibleRule(),
  new BrandEligibleRule(),
  new WeekendOnlyRule(),
  new TimeWindowRule(),
];
