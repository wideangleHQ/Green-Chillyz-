export class RewardProfileAssignedEvent {
  constructor(
    public readonly assignmentId: string,
    public readonly storeId: string,
    public readonly profileId: string,
    public readonly assignedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileChangedEvent {
  constructor(
    public readonly storeId: string,
    public readonly previousProfileId: string,
    public readonly newProfileId: string,
    public readonly changedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileRemovedEvent {
  constructor(
    public readonly assignmentId: string,
    public readonly storeId: string,
    public readonly profileId: string,
    public readonly removedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardProfileExpiredEvent {
  constructor(
    public readonly assignmentId: string,
    public readonly storeId: string,
    public readonly profileId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
