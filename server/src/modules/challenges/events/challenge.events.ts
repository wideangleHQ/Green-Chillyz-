import { ChallengeType, ChallengeRewardType } from '../enums';

export class ChallengeCreatedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly type: ChallengeType,
    public readonly createdBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeUpdatedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly changedFields: string[],
    public readonly oldValue: Record<string, unknown>,
    public readonly newValue: Record<string, unknown>,
    public readonly updatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengePublishedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly type: ChallengeType,
    public readonly publishedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengePausedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly pausedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeEndedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly endedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeArchivedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly archivedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeRestoredEvent {
  constructor(
    public readonly challengeId: string,
    public readonly name: string,
    public readonly restoredBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeStartedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly userId: string,
    public readonly challengeName: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeProgressedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly userId: string,
    public readonly currentProgress: number,
    public readonly targetCount: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeCompletedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly userId: string,
    public readonly challengeName: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeExpiredEvent {
  constructor(
    public readonly challengeId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ChallengeRewardClaimedEvent {
  constructor(
    public readonly challengeId: string,
    public readonly userId: string,
    public readonly rewardType: ChallengeRewardType,
    public readonly coinAmount: number | null,
    public readonly challengeName: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
