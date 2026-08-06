import { RewardProfileStatus, RewardProfileType } from '@prisma/client';

export class RewardProfileCreatedEvent {
  constructor(
    public readonly profileId: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly type: RewardProfileType,
    public readonly createdBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileUpdatedEvent {
  constructor(
    public readonly profileId: string,
    public readonly changedFields: string[],
    public readonly previousStatus: RewardProfileStatus,
    public readonly currentStatus: RewardProfileStatus,
    public readonly updatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileArchivedEvent {
  constructor(
    public readonly profileId: string,
    public readonly slug: string,
    public readonly archivedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileRestoredEvent {
  constructor(
    public readonly profileId: string,
    public readonly slug: string,
    public readonly restoredBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileDuplicatedEvent {
  constructor(
    public readonly sourceProfileId: string,
    public readonly newProfileId: string,
    public readonly newSlug: string,
    public readonly duplicatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileActivatedEvent {
  constructor(
    public readonly profileId: string,
    public readonly slug: string,
    public readonly activatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileDefaultChangedEvent {
  constructor(
    public readonly previousDefaultId: string | null,
    public readonly newDefaultId: string,
    public readonly changedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
