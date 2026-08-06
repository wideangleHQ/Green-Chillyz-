import { BadRequestException } from '@nestjs/common';
import { CoinLimitScope } from '@prisma/client';
import { COIN_ECONOMY_DEFAULTS, COIN_ECONOMY_ERRORS } from '../constants';

/** Shape a rule takes after create/update defaults are folded in. */
export interface CoinRuleShape {
  coinAmount: number;
  minCoins: number | null;
  maxCoins: number | null;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  lifetimeLimit: number | null;
  cooldownSeconds: number;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
}

const SECONDS_PER_DAY = 86400;

/**
 * Pure validation for a coin rule. Kept out of the service so create, update
 * and duplicate all reason about the same merged shape.
 */
export function validateCoinRuleShape(shape: CoinRuleShape): void {
  assertNonNegative(shape.coinAmount, COIN_ECONOMY_ERRORS.NEGATIVE_COINS);
  assertNonNegative(shape.minCoins, COIN_ECONOMY_ERRORS.NEGATIVE_COINS);
  assertNonNegative(shape.maxCoins, COIN_ECONOMY_ERRORS.NEGATIVE_COINS);

  assertNonNegative(shape.dailyLimit, COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  assertNonNegative(shape.weeklyLimit, COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  assertNonNegative(shape.monthlyLimit, COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  assertNonNegative(shape.lifetimeLimit, COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);

  if (shape.cooldownSeconds < 0) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.NEGATIVE_COOLDOWN);
  }

  if (shape.coinAmount > COIN_ECONOMY_DEFAULTS.MAX_COIN_AMOUNT) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.NEGATIVE_COINS);
  }

  if (
    shape.minCoins !== null &&
    shape.maxCoins !== null &&
    shape.minCoins > shape.maxCoins
  ) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_COIN_RANGE);
  }

  if (shape.maxCoins !== null && shape.coinAmount > shape.maxCoins) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.COIN_AMOUNT_OUT_OF_RANGE);
  }

  if (shape.minCoins !== null && shape.coinAmount < shape.minCoins) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.COIN_AMOUNT_OUT_OF_RANGE);
  }

  validateLimitLadder(shape);
  validateCooldownAgainstLimits(shape);
  validateDateRange(shape.effectiveFrom, shape.effectiveUntil);
}

/** A narrower window may never allow more coins than a wider one. */
function validateLimitLadder(shape: CoinRuleShape): void {
  const ladder: Array<number | null> = [
    shape.dailyLimit,
    shape.weeklyLimit,
    shape.monthlyLimit,
    shape.lifetimeLimit,
  ];

  for (let i = 0; i < ladder.length - 1; i++) {
    const narrower = ladder[i];
    if (narrower === null) continue;

    for (let j = i + 1; j < ladder.length; j++) {
      const wider = ladder[j];
      if (wider !== null && narrower > wider) {
        throw new BadRequestException(COIN_ECONOMY_ERRORS.LIMIT_OVERFLOW);
      }
    }
  }
}

/**
 * A cooldown longer than a day makes a multi-grant daily limit unreachable —
 * the two settings contradict each other, so reject rather than silently
 * honouring the stricter one.
 */
function validateCooldownAgainstLimits(shape: CoinRuleShape): void {
  if (shape.cooldownSeconds <= 0 || shape.dailyLimit === null) return;

  const maxGrantsPerDay = Math.floor(SECONDS_PER_DAY / shape.cooldownSeconds);
  const impliedMinCoinsPerGrant = shape.minCoins ?? shape.coinAmount;

  if (impliedMinCoinsPerGrant <= 0) return;

  const reachableCoins = maxGrantsPerDay * impliedMinCoinsPerGrant;
  if (shape.dailyLimit > reachableCoins) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.COOLDOWN_CONFLICT);
  }
}

export function validateDateRange(from: Date | null, until: Date | null): void {
  if (from && until && from >= until) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE);
  }
}

export function validateMultiplierValue(multiplier: number): void {
  if (
    !Number.isFinite(multiplier) ||
    multiplier <= 0 ||
    multiplier > COIN_ECONOMY_DEFAULTS.MAX_MULTIPLIER
  ) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_MULTIPLIER);
  }
}

export function validateDaysOfWeek(days: number[] | undefined): void {
  if (!days) return;
  for (const day of days) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_DAY_OF_WEEK);
    }
  }
}

export interface CoinLimitShape {
  scope: CoinLimitScope;
  maxCoins: number | null;
  maxClaims: number | null;
  windowSeconds: number | null;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
}

export function validateCoinLimitShape(shape: CoinLimitShape): void {
  assertNonNegative(shape.maxCoins, COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  assertNonNegative(shape.maxClaims, COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);

  if (shape.maxCoins === null && shape.maxClaims === null) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.EMPTY_LIMIT);
  }

  if (shape.windowSeconds !== null && shape.windowSeconds <= 0) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.NEGATIVE_LIMIT);
  }

  validateDateRange(shape.effectiveFrom, shape.effectiveUntil);
}

function assertNonNegative(value: number | null, message: string): void {
  if (value !== null && value < 0) {
    throw new BadRequestException(message);
  }
}

/** Normalises an optional ISO date string into a Date the shape can use. */
export function toDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(COIN_ECONOMY_ERRORS.INVALID_DATE_RANGE);
  }
  return parsed;
}

/** Treats undefined as "leave alone" and null as "clear". */
export function resolveOptional<T>(
  incoming: T | null | undefined,
  existing: T | null,
): T | null {
  if (incoming === undefined) return existing;
  return incoming ?? null;
}
