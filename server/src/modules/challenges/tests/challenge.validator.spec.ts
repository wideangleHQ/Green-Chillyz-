import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  validateChallengeShape,
  validateChallengeRuleShape,
  validateChallengeRewardShape,
  validateDateRange,
  toDate,
  resolveOptional,
} from '../validators/challenge.validator';
import { CHALLENGE_ERRORS } from '../constants';

describe('validateChallengeShape', () => {
  it('passes with valid shape', () => {
    expect(() =>
      validateChallengeShape({
        startsAt: new Date('2026-08-01'),
        endsAt: new Date('2026-08-31'),
        maxParticipants: null,
        repeatableAfterDays: null,
      }),
    ).not.toThrow();
  });

  it('throws when startsAt >= endsAt', () => {
    expect(() =>
      validateChallengeShape({
        startsAt: new Date('2026-09-01'),
        endsAt: new Date('2026-08-01'),
        maxParticipants: null,
        repeatableAfterDays: null,
      }),
    ).toThrow(BadRequestException);
  });

  it('throws when maxParticipants < 1', () => {
    expect(() =>
      validateChallengeShape({
        startsAt: new Date('2026-08-01'),
        endsAt: new Date('2026-08-31'),
        maxParticipants: 0,
        repeatableAfterDays: null,
      }),
    ).toThrow(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  });

  it('throws when repeatableAfterDays < 0', () => {
    expect(() =>
      validateChallengeShape({
        startsAt: new Date('2026-08-01'),
        endsAt: new Date('2026-08-31'),
        maxParticipants: null,
        repeatableAfterDays: -1,
      }),
    ).toThrow(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  });

  it('passes with maxParticipants = 1', () => {
    expect(() =>
      validateChallengeShape({
        startsAt: new Date('2026-08-01'),
        endsAt: new Date('2026-08-31'),
        maxParticipants: 1,
        repeatableAfterDays: null,
      }),
    ).not.toThrow();
  });

  it('passes with repeatableAfterDays = 0', () => {
    expect(() =>
      validateChallengeShape({
        startsAt: new Date('2026-08-01'),
        endsAt: new Date('2026-08-31'),
        maxParticipants: null,
        repeatableAfterDays: 0,
      }),
    ).not.toThrow();
  });
});

describe('validateChallengeRuleShape', () => {
  it('passes with valid shape', () => {
    expect(() =>
      validateChallengeRuleShape({ targetCount: 5, targetAmount: null }),
    ).not.toThrow();
  });

  it('throws when targetCount < 1', () => {
    expect(() =>
      validateChallengeRuleShape({ targetCount: 0, targetAmount: null }),
    ).toThrow(CHALLENGE_ERRORS.INVALID_TARGET);
  });

  it('throws when targetAmount is negative', () => {
    expect(() =>
      validateChallengeRuleShape({ targetCount: 1, targetAmount: -5 }),
    ).toThrow(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  });

  it('passes when targetAmount is zero', () => {
    expect(() =>
      validateChallengeRuleShape({ targetCount: 1, targetAmount: 0 }),
    ).not.toThrow();
  });
});

describe('validateChallengeRewardShape', () => {
  it('passes with COINS and positive amount', () => {
    expect(() =>
      validateChallengeRewardShape({ rewardType: 'COINS', coinAmount: 50, quantity: 1 }),
    ).not.toThrow();
  });

  it('throws when COINS reward has null coinAmount', () => {
    expect(() =>
      validateChallengeRewardShape({ rewardType: 'COINS', coinAmount: null, quantity: 1 }),
    ).toThrow(CHALLENGE_ERRORS.INVALID_REWARD);
  });

  it('throws when COINS reward has zero coinAmount', () => {
    expect(() =>
      validateChallengeRewardShape({ rewardType: 'COINS', coinAmount: 0, quantity: 1 }),
    ).toThrow(CHALLENGE_ERRORS.INVALID_REWARD);
  });

  it('passes with non-COINS reward and null coinAmount', () => {
    expect(() =>
      validateChallengeRewardShape({ rewardType: 'VOUCHER', coinAmount: null, quantity: 1 }),
    ).not.toThrow();
  });

  it('throws when quantity < 1', () => {
    expect(() =>
      validateChallengeRewardShape({ rewardType: 'VOUCHER', coinAmount: null, quantity: 0 }),
    ).toThrow(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  });
});

describe('validateDateRange', () => {
  it('passes when from < until', () => {
    expect(() =>
      validateDateRange(new Date('2026-01-01'), new Date('2026-12-31')),
    ).not.toThrow();
  });

  it('throws when from === until', () => {
    const d = new Date('2026-06-15');
    expect(() => validateDateRange(d, d)).toThrow(CHALLENGE_ERRORS.INVALID_DATE_RANGE);
  });

  it('throws when from > until', () => {
    expect(() =>
      validateDateRange(new Date('2026-12-31'), new Date('2026-01-01')),
    ).toThrow(CHALLENGE_ERRORS.INVALID_DATE_RANGE);
  });
});

describe('toDate', () => {
  it('returns null for null', () => {
    expect(toDate(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toDate(undefined)).toBeNull();
  });

  it('parses valid ISO string', () => {
    const result = toDate('2026-08-05T00:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2026-08-05T00:00:00.000Z');
  });

  it('throws for invalid date string', () => {
    expect(() => toDate('not-a-date')).toThrow(CHALLENGE_ERRORS.INVALID_DATE_RANGE);
  });
});

describe('resolveOptional', () => {
  it('returns existing when incoming is undefined', () => {
    expect(resolveOptional(undefined, 'existing')).toBe('existing');
  });

  it('returns incoming when provided', () => {
    expect(resolveOptional('new', 'existing')).toBe('new');
  });

  it('returns null when incoming is null', () => {
    expect(resolveOptional(null, 'existing')).toBeNull();
  });

  it('returns null when both are null', () => {
    expect(resolveOptional(null, null)).toBeNull();
  });
});
