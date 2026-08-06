import { BadRequestException } from '@nestjs/common';
import { CHALLENGE_ERRORS } from '../constants';

export interface ChallengeShape {
  startsAt: Date;
  endsAt: Date;
  maxParticipants: number | null;
  repeatableAfterDays: number | null;
}

export interface ChallengeRuleShape {
  targetCount: number;
  targetAmount: number | null;
}

export interface ChallengeRewardShape {
  rewardType: string;
  coinAmount: number | null;
  quantity: number;
}

export function validateChallengeShape(shape: ChallengeShape): void {
  validateDateRange(shape.startsAt, shape.endsAt);

  if (shape.maxParticipants !== null && shape.maxParticipants < 1) {
    throw new BadRequestException(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  }

  if (shape.repeatableAfterDays !== null && shape.repeatableAfterDays < 0) {
    throw new BadRequestException(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  }
}

export function validateChallengeRuleShape(shape: ChallengeRuleShape): void {
  if (shape.targetCount < 1) {
    throw new BadRequestException(CHALLENGE_ERRORS.INVALID_TARGET);
  }

  if (shape.targetAmount !== null && Number(shape.targetAmount) < 0) {
    throw new BadRequestException(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  }
}

export function validateChallengeRewardShape(shape: ChallengeRewardShape): void {
  if (shape.rewardType === 'COINS' && (shape.coinAmount === null || shape.coinAmount <= 0)) {
    throw new BadRequestException(CHALLENGE_ERRORS.INVALID_REWARD);
  }

  if (shape.quantity < 1) {
    throw new BadRequestException(CHALLENGE_ERRORS.NEGATIVE_AMOUNT);
  }
}

export function validateDateRange(from: Date, until: Date): void {
  if (from >= until) {
    throw new BadRequestException(CHALLENGE_ERRORS.INVALID_DATE_RANGE);
  }
}

export function toDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(CHALLENGE_ERRORS.INVALID_DATE_RANGE);
  }
  return parsed;
}

export function resolveOptional<T>(
  incoming: T | null | undefined,
  existing: T | null,
): T | null {
  if (incoming === undefined) return existing;
  return incoming ?? null;
}
