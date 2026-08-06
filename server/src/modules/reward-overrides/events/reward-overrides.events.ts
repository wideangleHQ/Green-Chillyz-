export class RewardOverrideCreatedEvent {
  constructor(
    public readonly overrideId: string,
    public readonly storeId: string,
    public readonly ruleId: string,
    public readonly createdBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardOverrideUpdatedEvent {
  constructor(
    public readonly overrideId: string,
    public readonly storeId: string,
    public readonly ruleId: string,
    public readonly changedFields: string[],
    public readonly updatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardOverrideArchivedEvent {
  constructor(
    public readonly overrideId: string,
    public readonly storeId: string,
    public readonly ruleId: string,
    public readonly archivedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardOverrideDeletedEvent {
  constructor(
    public readonly overrideId: string,
    public readonly storeId: string,
    public readonly ruleId: string,
    public readonly deletedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardOverrideRestoredEvent {
  constructor(
    public readonly overrideId: string,
    public readonly storeId: string,
    public readonly ruleId: string,
    public readonly restoredBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
