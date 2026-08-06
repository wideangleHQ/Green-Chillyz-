import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditSeverity } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { CHALLENGE_EVENTS } from '../constants';
import {
  ChallengeCreatedEvent,
  ChallengeUpdatedEvent,
  ChallengePublishedEvent,
  ChallengePausedEvent,
  ChallengeEndedEvent,
  ChallengeArchivedEvent,
  ChallengeRestoredEvent,
  ChallengeStartedEvent,
  ChallengeProgressedEvent,
  ChallengeCompletedEvent,
  ChallengeExpiredEvent,
  ChallengeRewardClaimedEvent,
} from '../events';

const ENTITY = 'challenge';

@Injectable()
export class ChallengeListener {
  private readonly logger = new Logger(ChallengeListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(CHALLENGE_EVENTS.CREATED)
  async onCreated(event: ChallengeCreatedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.CREATED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'CREATE',
      userId: event.createdBy,
      metadata: { name: event.name, type: event.type },
    });
    this.logger.log(`Challenge created: ${event.name}`);
  }

  @OnEvent(CHALLENGE_EVENTS.UPDATED)
  async onUpdated(event: ChallengeUpdatedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.UPDATED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'UPDATE',
      userId: event.updatedBy,
      oldValue: event.oldValue,
      newValue: event.newValue,
      metadata: { name: event.name, changedFields: event.changedFields },
    });
  }

  @OnEvent(CHALLENGE_EVENTS.PUBLISHED)
  async onPublished(event: ChallengePublishedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.PUBLISHED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'PUBLISH',
      userId: event.publishedBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name, type: event.type },
    });
    this.logger.log(`Challenge published: ${event.name}`);
  }

  @OnEvent(CHALLENGE_EVENTS.PAUSED)
  async onPaused(event: ChallengePausedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.PAUSED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'PAUSE',
      userId: event.pausedBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name },
    });
    this.logger.log(`Challenge paused: ${event.name}`);
  }

  @OnEvent(CHALLENGE_EVENTS.ENDED)
  async onEnded(event: ChallengeEndedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.ENDED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'END',
      userId: event.endedBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name },
    });
  }

  @OnEvent(CHALLENGE_EVENTS.ARCHIVED)
  async onArchived(event: ChallengeArchivedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.ARCHIVED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'ARCHIVE',
      userId: event.archivedBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name },
    });
  }

  @OnEvent(CHALLENGE_EVENTS.RESTORED)
  async onRestored(event: ChallengeRestoredEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.RESTORED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'RESTORE',
      userId: event.restoredBy,
      metadata: { name: event.name },
    });
  }

  @OnEvent(CHALLENGE_EVENTS.STARTED)
  async onStarted(event: ChallengeStartedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.STARTED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'START',
      userId: event.userId,
      metadata: { challengeName: event.challengeName },
    });
  }

  @OnEvent(CHALLENGE_EVENTS.PROGRESSED)
  async onProgressed(event: ChallengeProgressedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.PROGRESSED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'PROGRESS',
      userId: event.userId,
      metadata: {
        currentProgress: event.currentProgress,
        targetCount: event.targetCount,
      },
      dedupeKey: `challenge-progress:${event.userId}:${event.challengeId}:${event.occurredAt.toISOString().slice(0, 10)}`,
    });
  }

  @OnEvent(CHALLENGE_EVENTS.COMPLETED)
  async onCompleted(event: ChallengeCompletedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.COMPLETED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'COMPLETE',
      userId: event.userId,
      severity: AuditSeverity.HIGH,
      metadata: { challengeName: event.challengeName },
    });
    this.logger.log(
      `Challenge completed: ${event.challengeName} by ${event.userId}`,
    );
  }

  @OnEvent(CHALLENGE_EVENTS.EXPIRED)
  async onExpired(event: ChallengeExpiredEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.EXPIRED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'EXPIRE',
      userId: event.userId,
    });
  }

  @OnEvent(CHALLENGE_EVENTS.REWARD_CLAIMED)
  async onRewardClaimed(event: ChallengeRewardClaimedEvent): Promise<void> {
    await this.audit.record({
      eventType: CHALLENGE_EVENTS.REWARD_CLAIMED,
      entityType: ENTITY,
      entityId: event.challengeId,
      action: 'REWARD_CLAIM',
      userId: event.userId,
      severity: AuditSeverity.HIGH,
      metadata: {
        challengeName: event.challengeName,
        rewardType: event.rewardType,
        coinAmount: event.coinAmount,
      },
    });
    this.logger.log(
      `Challenge reward claimed: ${event.challengeName} by ${event.userId}`,
    );
  }
}
