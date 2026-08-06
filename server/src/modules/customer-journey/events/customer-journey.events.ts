import { JourneyActionType, JourneyTriggerType } from '@prisma/client';

export class JourneyStartedEvent {
  constructor(
    public readonly journeyId: string,
    public readonly executionId: string,
    public readonly userId: string,
    public readonly triggerType: JourneyTriggerType,
  ) {}
}

export class JourneyCompletedEvent {
  constructor(
    public readonly journeyId: string,
    public readonly executionId: string,
    public readonly userId: string,
  ) {}
}

export class JourneyPausedEvent {
  constructor(
    public readonly journeyId: string,
    public readonly pausedBy: string | null,
  ) {}
}

export class JourneyFailedEvent {
  constructor(
    public readonly journeyId: string,
    public readonly executionId: string | null,
    public readonly userId: string | null,
    public readonly reason: string,
  ) {}
}

export class JourneyActionExecutedEvent {
  constructor(
    public readonly journeyId: string,
    public readonly executionId: string,
    public readonly actionType: JourneyActionType,
    public readonly userId: string,
  ) {}
}

export class JourneyPublishedEvent {
  constructor(
    public readonly journeyId: string,
    public readonly publishedBy: string | null,
  ) {}
}
