import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/services/audit.service';
import { REWARD_OVERRIDE_EVENTS } from '../constants';
import {
  RewardOverrideCreatedEvent,
  RewardOverrideUpdatedEvent,
  RewardOverrideArchivedEvent,
  RewardOverrideDeletedEvent,
  RewardOverrideRestoredEvent,
} from '../events';

@Injectable()
export class RewardOverridesListener {
  private readonly logger = new Logger(RewardOverridesListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(REWARD_OVERRIDE_EVENTS.CREATED)
  async onCreated(event: RewardOverrideCreatedEvent) {
    await this.audit.record({
      eventType: REWARD_OVERRIDE_EVENTS.CREATED,
      entityType: 'rewardOverride',
      entityId: event.overrideId,
      action: 'CREATE',
      userId: event.createdBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        ruleId: event.ruleId,
      },
    });
    this.logger.log(`Override created: ${event.overrideId} for store ${event.storeId}`);
  }

  @OnEvent(REWARD_OVERRIDE_EVENTS.UPDATED)
  async onUpdated(event: RewardOverrideUpdatedEvent) {
    await this.audit.record({
      eventType: REWARD_OVERRIDE_EVENTS.UPDATED,
      entityType: 'rewardOverride',
      entityId: event.overrideId,
      action: 'UPDATE',
      userId: event.updatedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        ruleId: event.ruleId,
        changedFields: event.changedFields,
      },
    });
  }

  @OnEvent(REWARD_OVERRIDE_EVENTS.ARCHIVED)
  async onArchived(event: RewardOverrideArchivedEvent) {
    await this.audit.record({
      eventType: REWARD_OVERRIDE_EVENTS.ARCHIVED,
      entityType: 'rewardOverride',
      entityId: event.overrideId,
      action: 'ARCHIVE',
      userId: event.archivedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        ruleId: event.ruleId,
      },
    });
    this.logger.log(`Override archived: ${event.overrideId}`);
  }

  @OnEvent(REWARD_OVERRIDE_EVENTS.DELETED)
  async onDeleted(event: RewardOverrideDeletedEvent) {
    await this.audit.record({
      eventType: REWARD_OVERRIDE_EVENTS.DELETED,
      entityType: 'rewardOverride',
      entityId: event.overrideId,
      action: 'DELETE',
      userId: event.deletedBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        ruleId: event.ruleId,
      },
    });
    this.logger.log(`Override deleted: ${event.overrideId}`);
  }

  @OnEvent(REWARD_OVERRIDE_EVENTS.RESTORED)
  async onRestored(event: RewardOverrideRestoredEvent) {
    await this.audit.record({
      eventType: REWARD_OVERRIDE_EVENTS.RESTORED,
      entityType: 'rewardOverride',
      entityId: event.overrideId,
      action: 'RESTORE',
      userId: event.restoredBy ?? undefined,
      metadata: {
        storeId: event.storeId,
        ruleId: event.ruleId,
      },
    });
    this.logger.log(`Override restored: ${event.overrideId}`);
  }
}
