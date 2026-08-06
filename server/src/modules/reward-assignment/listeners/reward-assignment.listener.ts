import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/services/audit.service';
import { REWARD_ASSIGNMENT_EVENTS } from '../constants';
import {
  RewardProfileAssignedEvent,
  RewardProfileChangedEvent,
  RewardProfileRemovedEvent,
  RewardProfileExpiredEvent,
} from '../events';

@Injectable()
export class RewardAssignmentListener {
  private readonly logger = new Logger(RewardAssignmentListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(REWARD_ASSIGNMENT_EVENTS.ASSIGNED)
  async onAssigned(event: RewardProfileAssignedEvent) {
    await this.audit.record({
      eventType: REWARD_ASSIGNMENT_EVENTS.ASSIGNED,
      entityType: 'rewardAssignment',
      entityId: event.assignmentId,
      action: 'ASSIGN',
      userId: event.assignedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        profileId: event.profileId,
      },
    });
    this.logger.log(`Profile ${event.profileId} assigned to store ${event.storeId}`);
  }

  @OnEvent(REWARD_ASSIGNMENT_EVENTS.CHANGED)
  async onChanged(event: RewardProfileChangedEvent) {
    await this.audit.record({
      eventType: REWARD_ASSIGNMENT_EVENTS.CHANGED,
      entityType: 'rewardAssignment',
      entityId: event.storeId,
      action: 'CHANGE',
      userId: event.changedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        previousProfileId: event.previousProfileId,
        newProfileId: event.newProfileId,
      },
    });
    this.logger.log(
      `Store ${event.storeId} profile changed: ${event.previousProfileId} → ${event.newProfileId}`,
    );
  }

  @OnEvent(REWARD_ASSIGNMENT_EVENTS.ARCHIVED)
  async onArchived(event: RewardProfileRemovedEvent) {
    await this.audit.record({
      eventType: REWARD_ASSIGNMENT_EVENTS.ARCHIVED,
      entityType: 'rewardAssignment',
      entityId: event.assignmentId,
      action: 'ARCHIVE',
      userId: event.removedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        profileId: event.profileId,
      },
    });
    this.logger.log(`Assignment ${event.assignmentId} archived for store ${event.storeId}`);
  }

  @OnEvent(REWARD_ASSIGNMENT_EVENTS.RESTORED)
  async onRestored(event: RewardProfileAssignedEvent) {
    await this.audit.record({
      eventType: REWARD_ASSIGNMENT_EVENTS.RESTORED,
      entityType: 'rewardAssignment',
      entityId: event.assignmentId,
      action: 'RESTORE',
      userId: event.assignedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        profileId: event.profileId,
      },
    });
    this.logger.log(`Assignment ${event.assignmentId} restored for store ${event.storeId}`);
  }

  @OnEvent(REWARD_ASSIGNMENT_EVENTS.EXPIRED)
  async onExpired(event: RewardProfileExpiredEvent) {
    await this.audit.record({
      eventType: REWARD_ASSIGNMENT_EVENTS.EXPIRED,
      entityType: 'rewardAssignment',
      entityId: event.assignmentId,
      action: 'EXPIRE',
      metadata: {
        storeId: event.storeId,
        profileId: event.profileId,
      },
    });
    this.logger.log(`Assignment ${event.assignmentId} expired for store ${event.storeId}`);
  }
}
