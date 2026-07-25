import { describe, it, expect } from 'vitest';
import { RewardEventType } from '@prisma/client';
import {
  DailyLimitRule,
  MaxClaimsRule,
  MinPurchaseRule,
  StoreEligibleRule,
  BrandEligibleRule,
  WeekendOnlyRule,
  TimeWindowRule,
} from './evaluators';
import { RuleContext } from '../interfaces';

const baseContext: RuleContext = {
  userId: 'user-1',
  eventType: RewardEventType.PURCHASE_COMPLETED,
  now: new Date('2026-07-25T14:00:00Z'),
  dailyClaimCount: 0,
  totalClaimCount: 0,
};

describe('Rule Evaluators', () => {
  describe('DailyLimitRule', () => {
    const rule = new DailyLimitRule();

    it('should pass when under limit', () => {
      const result = rule.evaluate({ ...baseContext, dailyClaimCount: 2 }, 'LESS_THAN', '5');
      expect(result.passed).toBe(true);
    });

    it('should fail when at limit', () => {
      const result = rule.evaluate({ ...baseContext, dailyClaimCount: 5 }, 'LESS_THAN', '5');
      expect(result.passed).toBe(false);
    });

    it('should fail when over limit', () => {
      const result = rule.evaluate({ ...baseContext, dailyClaimCount: 10 }, 'LESS_THAN', '5');
      expect(result.passed).toBe(false);
    });
  });

  describe('MaxClaimsRule', () => {
    const rule = new MaxClaimsRule();

    it('should pass when under max', () => {
      const result = rule.evaluate({ ...baseContext, totalClaimCount: 3 }, 'LESS_THAN', '10');
      expect(result.passed).toBe(true);
    });

    it('should fail when at max', () => {
      const result = rule.evaluate({ ...baseContext, totalClaimCount: 10 }, 'LESS_THAN', '10');
      expect(result.passed).toBe(false);
    });
  });

  describe('MinPurchaseRule', () => {
    const rule = new MinPurchaseRule();

    it('should pass when purchase exceeds minimum', () => {
      const result = rule.evaluate({ ...baseContext, purchaseAmount: 500 }, 'GREATER_THAN', '100');
      expect(result.passed).toBe(true);
    });

    it('should fail when purchase below minimum', () => {
      const result = rule.evaluate({ ...baseContext, purchaseAmount: 50 }, 'GREATER_THAN', '100');
      expect(result.passed).toBe(false);
    });

    it('should fail when no purchase amount', () => {
      const result = rule.evaluate(baseContext, 'GREATER_THAN', '100');
      expect(result.passed).toBe(false);
    });
  });

  describe('StoreEligibleRule', () => {
    const rule = new StoreEligibleRule();

    it('should pass when store is in list', () => {
      const result = rule.evaluate(
        { ...baseContext, storeId: 'store-1' },
        'IN',
        'store-1,store-2',
      );
      expect(result.passed).toBe(true);
    });

    it('should fail when store not in list', () => {
      const result = rule.evaluate(
        { ...baseContext, storeId: 'store-3' },
        'IN',
        'store-1,store-2',
      );
      expect(result.passed).toBe(false);
    });

    it('should pass when no store context', () => {
      const result = rule.evaluate(baseContext, 'IN', 'store-1');
      expect(result.passed).toBe(true);
    });
  });

  describe('BrandEligibleRule', () => {
    const rule = new BrandEligibleRule();

    it('should pass when brand is in list', () => {
      const result = rule.evaluate(
        { ...baseContext, brandId: 'brand-1' },
        'IN',
        'brand-1,brand-2',
      );
      expect(result.passed).toBe(true);
    });

    it('should fail when brand not in list', () => {
      const result = rule.evaluate(
        { ...baseContext, brandId: 'brand-3' },
        'IN',
        'brand-1',
      );
      expect(result.passed).toBe(false);
    });
  });

  describe('WeekendOnlyRule', () => {
    const rule = new WeekendOnlyRule();

    it('should pass on Saturday', () => {
      const saturday = new Date('2026-07-25T10:00:00Z'); // Saturday
      const result = rule.evaluate({ ...baseContext, now: saturday }, 'BOOLEAN', 'true');
      expect(result.passed).toBe(true);
    });

    it('should fail on weekday', () => {
      const monday = new Date('2026-07-20T10:00:00Z'); // Monday
      const result = rule.evaluate({ ...baseContext, now: monday }, 'BOOLEAN', 'true');
      expect(result.passed).toBe(false);
    });

    it('should pass when weekend restriction is false', () => {
      const monday = new Date('2026-07-20T10:00:00Z');
      const result = rule.evaluate({ ...baseContext, now: monday }, 'BOOLEAN', 'false');
      expect(result.passed).toBe(true);
    });
  });

  describe('TimeWindowRule', () => {
    const rule = new TimeWindowRule();

    it('should pass within window', () => {
      const noon = new Date('2026-07-25T12:00:00Z');
      const result = rule.evaluate({ ...baseContext, now: noon }, 'BETWEEN', '10-18');
      expect(result.passed).toBe(true);
    });

    it('should fail outside window', () => {
      const early = new Date('2026-07-25T06:00:00Z');
      const result = rule.evaluate({ ...baseContext, now: early }, 'BETWEEN', '10-18');
      expect(result.passed).toBe(false);
    });
  });
});
