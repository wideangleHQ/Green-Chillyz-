import { TransactionSource } from '@prisma/client';
import { ChallengeRewardType } from '../enums';

export const CHALLENGE_ERRORS = {
  NOT_FOUND: 'Challenge not found',
  RULE_NOT_FOUND: 'Challenge rule not found',
  REWARD_NOT_FOUND: 'Challenge reward not found',
  PROGRESS_NOT_FOUND: 'Challenge progress not found',

  DUPLICATE_NAME: 'A challenge with this name already exists',
  DUPLICATE_SLUG: 'A challenge with this slug already exists',
  INVALID_DATE_RANGE: 'Start date must be before end date',
  INVALID_TARGET: 'Target count must be at least 1',
  INVALID_REWARD: 'Coin reward must specify a positive amount',
  NEGATIVE_AMOUNT: 'Amount must be zero or positive',
  CANNOT_ARCHIVE_ACTIVE: 'Pause or end the challenge before archiving',
  CANNOT_PUBLISH_NO_RULES: 'A challenge must have at least one rule to publish',
  CANNOT_PUBLISH_NO_REWARDS: 'A challenge must have at least one reward to publish',
  ALREADY_PUBLISHED: 'Challenge is already published or active',
  ALREADY_COMPLETED: 'Challenge already completed',
  ALREADY_CLAIMED: 'Reward already claimed',
  NOT_COMPLETED: 'Challenge not yet completed',
  CHALLENGE_EXPIRED: 'Challenge has expired',
  CHALLENGE_NOT_ACTIVE: 'Challenge is not currently active',
  MAX_PARTICIPANTS_REACHED: 'Maximum participants reached',
  DATE_CONFLICT: 'Conflicting challenge dates',
} as const;

export const CHALLENGE_PERMISSIONS = {
  CREATE: 'CHALLENGE_CREATE',
  UPDATE: 'CHALLENGE_UPDATE',
  DELETE: 'CHALLENGE_DELETE',
  VIEW: 'CHALLENGE_VIEW',
  PUBLISH: 'CHALLENGE_PUBLISH',
} as const;

export const CHALLENGE_CACHE = {
  PREFIX: 'challenges:',
  LIST: 'challenges:list',
  ITEM: 'challenges:item:',
  ACTIVE: 'challenges:active',
  CUSTOMER: 'challenges:customer:',
  PROGRESS: 'challenges:progress:',

  TTL_LIST: 300,
  TTL_ITEM: 300,
  TTL_ACTIVE: 300,
  TTL_CUSTOMER: 120,
  TTL_PROGRESS: 120,
} as const;

export const CHALLENGE_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const CHALLENGE_EVENTS = {
  CREATED: 'challenge.created',
  UPDATED: 'challenge.updated',
  PUBLISHED: 'challenge.published',
  PAUSED: 'challenge.paused',
  ENDED: 'challenge.ended',
  ARCHIVED: 'challenge.archived',
  RESTORED: 'challenge.restored',
  STARTED: 'challenge.started',
  PROGRESSED: 'challenge.progressed',
  COMPLETED: 'challenge.completed',
  EXPIRED: 'challenge.expired',
  REWARD_CLAIMED: 'challenge.reward.claimed',
} as const;

export const CHALLENGE_HISTORY_ACTIONS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  ENDED: 'ENDED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  DUPLICATED: 'DUPLICATED',
} as const;

export const CHALLENGE_REWARD_WALLET_SOURCE: Partial<
  Record<ChallengeRewardType, TransactionSource>
> = {
  COINS: TransactionSource.SYSTEM_REWARD,
};

export const CHALLENGE_REFERENCE_TYPE = 'challenge';
