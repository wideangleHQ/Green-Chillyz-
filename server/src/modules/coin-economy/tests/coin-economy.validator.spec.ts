import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  validateCoinRuleShape,
  validateCoinLimitShape,
  validateMultiplierValue,
  validateDaysOfWeek,
  validateDateRange,
  toDate,
  resolveOptional,
  CoinRuleShape,
  CoinLimitShape,
} from '../validators/coin-economy.validator';
import { COIN_ECONOMY_ERRORS } from '../constants';

const baseShape: CoinRuleShape = {
  coinAmount: 10,
  minCoins: null,
  maxCoins: null,
  dailyLimit: null,
  weeklyLimit: null,
  monthlyLimit: null,
  lifetimeLimit: null,
  cooldownSeconds: 0,
  effectiveFrom: null,
  effectiveUntil: null,
};

describe('validateCoinRuleShape', () => {
  it('passes a valid shape', () => {
    expect(() => validateCoinRuleShape(baseShape)).not.toThrow();
  });

  it('rejects negative coinAmount', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, coinAmount: -1 }),
    ).toThrow(BadRequestException);
  });

  it('rejects negative minCoins', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, minCoins: -5 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_COINS);
  });

  it('rejects negative maxCoins', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, maxCoins: -1 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_COINS);
  });

  it('rejects negative cooldown', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, cooldownSeconds: -1 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_COOLDOWN);
  });

  it('rejects coinAmount above ceiling', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, coinAmount: 2_000_000 }),
    ).toThrow(BadRequestException);
  });

  it('rejects inverted min/max range', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, minCoins: 30, maxCoins: 10 }),
    ).toThrow(COIN_ECONOMY_ERRORS.INVALID_COIN_RANGE);
  });

  it('rejects coinAmount above maxCoins', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, coinAmount: 50, maxCoins: 25 }),
    ).toThrow(COIN_ECONOMY_ERRORS.COIN_AMOUNT_OUT_OF_RANGE);
  });

  it('rejects coinAmount below minCoins', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, coinAmount: 5, minCoins: 10 }),
    ).toThrow(COIN_ECONOMY_ERRORS.COIN_AMOUNT_OUT_OF_RANGE);
  });

  it('rejects daily limit above weekly limit', () => {
    expect(() =>
      validateCoinRuleShape({
        ...baseShape,
        dailyLimit: 100,
        weeklyLimit: 50,
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.LIMIT_OVERFLOW);
  });

  it('rejects weekly limit above monthly limit', () => {
    expect(() =>
      validateCoinRuleShape({
        ...baseShape,
        weeklyLimit: 500,
        monthlyLimit: 200,
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.LIMIT_OVERFLOW);
  });

  it('rejects monthly limit above lifetime limit', () => {
    expect(() =>
      validateCoinRuleShape({
        ...baseShape,
        monthlyLimit: 1000,
        lifetimeLimit: 500,
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.LIMIT_OVERFLOW);
  });

  it('rejects cooldown conflict with daily limit', () => {
    expect(() =>
      validateCoinRuleShape({
        ...baseShape,
        coinAmount: 5,
        cooldownSeconds: 86400,
        dailyLimit: 50,
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.COOLDOWN_CONFLICT);
  });

  it('accepts cooldown that reaches daily limit', () => {
    expect(() =>
      validateCoinRuleShape({
        ...baseShape,
        coinAmount: 5,
        cooldownSeconds: 86400,
        dailyLimit: 5,
      }),
    ).not.toThrow();
  });

  it('rejects inverted date range', () => {
    expect(() =>
      validateCoinRuleShape({
        ...baseShape,
        effectiveFrom: new Date('2026-12-31'),
        effectiveUntil: new Date('2026-01-01'),
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE);
  });

  it('accepts negative limits as valid', () => {
    expect(() =>
      validateCoinRuleShape({ ...baseShape, dailyLimit: -1 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  });
});

describe('validateCoinLimitShape', () => {
  const baseLimitShape: CoinLimitShape = {
    scope: 'PER_DAY' as any,
    maxCoins: 100,
    maxClaims: null,
    windowSeconds: null,
    effectiveFrom: null,
    effectiveUntil: null,
  };

  it('passes a valid shape', () => {
    expect(() => validateCoinLimitShape(baseLimitShape)).not.toThrow();
  });

  it('rejects negative maxCoins', () => {
    expect(() =>
      validateCoinLimitShape({ ...baseLimitShape, maxCoins: -1 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  });

  it('rejects negative maxClaims', () => {
    expect(() =>
      validateCoinLimitShape({ ...baseLimitShape, maxClaims: -1 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  });

  it('rejects when both maxCoins and maxClaims are null', () => {
    expect(() =>
      validateCoinLimitShape({
        ...baseLimitShape,
        maxCoins: null,
        maxClaims: null,
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.EMPTY_LIMIT);
  });

  it('rejects non-positive windowSeconds', () => {
    expect(() =>
      validateCoinLimitShape({ ...baseLimitShape, windowSeconds: 0 }),
    ).toThrow(COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  });

  it('rejects inverted date range', () => {
    expect(() =>
      validateCoinLimitShape({
        ...baseLimitShape,
        effectiveFrom: new Date('2026-12-31'),
        effectiveUntil: new Date('2026-01-01'),
      }),
    ).toThrow(COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE);
  });
});

describe('validateMultiplierValue', () => {
  it('accepts a valid multiplier', () => {
    expect(() => validateMultiplierValue(2)).not.toThrow();
  });

  it('rejects zero', () => {
    expect(() => validateMultiplierValue(0)).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_MULTIPLIER,
    );
  });

  it('rejects negative', () => {
    expect(() => validateMultiplierValue(-1)).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_MULTIPLIER,
    );
  });

  it('rejects above ceiling', () => {
    expect(() => validateMultiplierValue(101)).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_MULTIPLIER,
    );
  });

  it('rejects Infinity', () => {
    expect(() => validateMultiplierValue(Infinity)).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_MULTIPLIER,
    );
  });

  it('rejects NaN', () => {
    expect(() => validateMultiplierValue(NaN)).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_MULTIPLIER,
    );
  });
});

describe('validateDaysOfWeek', () => {
  it('accepts undefined', () => {
    expect(() => validateDaysOfWeek(undefined)).not.toThrow();
  });

  it('accepts valid days', () => {
    expect(() => validateDaysOfWeek([0, 3, 6])).not.toThrow();
  });

  it('rejects day > 6', () => {
    expect(() => validateDaysOfWeek([7])).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_DAY_OF_WEEK,
    );
  });

  it('rejects day < 0', () => {
    expect(() => validateDaysOfWeek([-1])).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_DAY_OF_WEEK,
    );
  });

  it('rejects non-integer', () => {
    expect(() => validateDaysOfWeek([1.5])).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_DAY_OF_WEEK,
    );
  });
});

describe('validateDateRange', () => {
  it('passes when both are null', () => {
    expect(() => validateDateRange(null, null)).not.toThrow();
  });

  it('passes a valid range', () => {
    expect(() =>
      validateDateRange(new Date('2026-01-01'), new Date('2026-12-31')),
    ).not.toThrow();
  });

  it('rejects equal dates', () => {
    const d = new Date('2026-06-15');
    expect(() => validateDateRange(d, d)).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE,
    );
  });

  it('rejects inverted range', () => {
    expect(() =>
      validateDateRange(new Date('2026-12-31'), new Date('2026-01-01')),
    ).toThrow(COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE);
  });
});

describe('toDate', () => {
  it('returns null for null', () => {
    expect(toDate(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toDate(undefined)).toBeNull();
  });

  it('parses a valid ISO string', () => {
    const result = toDate('2026-08-05T00:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2026);
  });

  it('throws for an invalid string', () => {
    expect(() => toDate('not-a-date')).toThrow(
      COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE,
    );
  });
});

describe('resolveOptional', () => {
  it('returns existing when incoming is undefined', () => {
    expect(resolveOptional(undefined, 'old')).toBe('old');
  });

  it('returns null when incoming is null', () => {
    expect(resolveOptional(null, 'old')).toBeNull();
  });

  it('returns the incoming value otherwise', () => {
    expect(resolveOptional('new', 'old')).toBe('new');
  });
});
