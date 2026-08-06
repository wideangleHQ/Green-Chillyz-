export class RewardRuleCreatedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly profileId: string,
    public readonly name: string,
    public readonly ruleType: string,
    public readonly createdBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardRuleUpdatedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly profileId: string,
    public readonly changedFields: string[],
    public readonly updatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardRuleArchivedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly profileId: string,
    public readonly name: string,
    public readonly archivedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardRuleDeletedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly profileId: string,
    public readonly name: string,
    public readonly deletedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class RewardRuleDuplicatedEvent {
  constructor(
    public readonly sourceRuleId: string,
    public readonly newRuleId: string,
    public readonly profileId: string,
    public readonly duplicatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
