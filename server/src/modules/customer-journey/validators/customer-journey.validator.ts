import { BadRequestException } from '@nestjs/common';
import { JourneyActionType } from '@prisma/client';
import { CUSTOMER_JOURNEY_DEFAULTS, CUSTOMER_JOURNEY_ERRORS } from '../constants';
import { CreateJourneyDto, UpdateJourneyDto } from '../dto';

const REQUIRED_ACTION_KEYS: Partial<Record<JourneyActionType, string[]>> = {
  CREDIT_COINS: ['ruleType'],
  DEBIT_COINS: ['amount'],
  UNLOCK_REWARD: ['rewardId'],
  UNLOCK_VOUCHER: ['rewardId'],
  ASSIGN_CHALLENGE: ['challengeId'],
  ASSIGN_CAMPAIGN: ['campaignId'],
  SEND_NOTIFICATION: ['title', 'message'],
  SEND_IN_APP_MESSAGE: ['title', 'message'],
  GENERATE_VOUCHER: ['rewardId'],
  EXPIRE_VOUCHER: ['voucherId'],
  TAG_CUSTOMER: ['tag'],
};

export function validateJourneyShape(dto: CreateJourneyDto | UpdateJourneyDto): void {
  if (dto.startsAt && dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
    throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.INVALID_DATE_RANGE);
  }
}

export function validateJourneyDefinition(dto: CreateJourneyDto): void {
  validateJourneyShape(dto);
  validateDuplicateTriggers(dto.triggers ?? []);

  const actionCount = (dto.steps ?? []).reduce(
    (total, step) => total + (step.actions?.length ?? 0),
    0,
  );
  if (actionCount > CUSTOMER_JOURNEY_DEFAULTS.MAX_ACTIONS_PER_EXECUTION) {
    throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.INFINITE_LOOP);
  }

  for (const step of dto.steps ?? []) {
    validateConditions(step.conditions);
    for (const action of step.actions ?? []) {
      validateAction(action.actionType, action.config);
    }
  }
}

export function validateDuplicateTriggers(
  triggers: Array<{ triggerType: string; eventName?: string | null }>,
): void {
  const seen = new Set<string>();
  for (const trigger of triggers) {
    const key = `${trigger.triggerType}:${trigger.eventName ?? ''}`;
    if (seen.has(key)) {
      throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.DUPLICATE_TRIGGER);
    }
    seen.add(key);
  }
}

export function validateAction(
  actionType: JourneyActionType,
  config: Record<string, unknown>,
): void {
  if ((config as { journeyId?: unknown }).journeyId) {
    throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.CIRCULAR_JOURNEY);
  }

  const required = REQUIRED_ACTION_KEYS[actionType] ?? [];
  const missing = required.some((key) => config[key] === undefined || config[key] === null);
  if (missing) {
    throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.BROKEN_ACTION);
  }
}

export function validateConditions(conditions: unknown): void {
  if (!conditions) return;
  const items = Array.isArray(conditions) ? conditions : [conditions];
  for (const item of items) {
    const condition = item as { type?: unknown; operator?: unknown };
    if (!condition.type || !condition.operator) {
      throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.INVALID_CONDITION);
    }
  }
}

export function assertJourneyEffective(
  journey: { startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
): void {
  if ((journey.startsAt && now < journey.startsAt) || (journey.endsAt && now > journey.endsAt)) {
    throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.EXPIRED);
  }
}
