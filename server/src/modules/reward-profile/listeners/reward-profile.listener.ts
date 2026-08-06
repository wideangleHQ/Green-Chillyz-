import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/services/audit.service';
import { REWARD_PROFILE_EVENTS } from '../constants';
import {
  RewardProfileCreatedEvent,
  RewardProfileUpdatedEvent,
  RewardProfileArchivedEvent,
  RewardProfileRestoredEvent,
  RewardProfileDuplicatedEvent,
  RewardProfileActivatedEvent,
  RewardProfileDefaultChangedEvent,
} from '../events';

@Injectable()
export class RewardProfileListener {
  private readonly logger = new Logger(RewardProfileListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(REWARD_PROFILE_EVENTS.CREATED)
  async onCreated(event: RewardProfileCreatedEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.CREATED,
      entityType: 'rewardProfile',
      entityId: event.profileId,
      action: 'CREATE',
      userId: event.createdBy ?? undefined,
      metadata: {
        name: event.name,
        slug: event.slug,
        type: event.type,
      },
    });
    this.logger.log(`Reward profile created: ${event.name} (${event.slug})`);
  }

  @OnEvent(REWARD_PROFILE_EVENTS.UPDATED)
  async onUpdated(event: RewardProfileUpdatedEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.UPDATED,
      entityType: 'rewardProfile',
      entityId: event.profileId,
      action: 'UPDATE',
      userId: event.updatedBy ?? undefined,
      metadata: {
        changedFields: event.changedFields,
        previousStatus: event.previousStatus,
        currentStatus: event.currentStatus,
      },
    });
  }

  @OnEvent(REWARD_PROFILE_EVENTS.ARCHIVED)
  async onArchived(event: RewardProfileArchivedEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.ARCHIVED,
      entityType: 'rewardProfile',
      entityId: event.profileId,
      action: 'ARCHIVE',
      userId: event.archivedBy ?? undefined,
      metadata: { slug: event.slug },
    });
    this.logger.log(`Reward profile archived: ${event.slug}`);
  }

  @OnEvent(REWARD_PROFILE_EVENTS.RESTORED)
  async onRestored(event: RewardProfileRestoredEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.RESTORED,
      entityType: 'rewardProfile',
      entityId: event.profileId,
      action: 'RESTORE',
      userId: event.restoredBy ?? undefined,
      metadata: { slug: event.slug },
    });
    this.logger.log(`Reward profile restored: ${event.slug}`);
  }

  @OnEvent(REWARD_PROFILE_EVENTS.DUPLICATED)
  async onDuplicated(event: RewardProfileDuplicatedEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.DUPLICATED,
      entityType: 'rewardProfile',
      entityId: event.newProfileId,
      action: 'DUPLICATE',
      userId: event.duplicatedBy ?? undefined,
      metadata: {
        sourceProfileId: event.sourceProfileId,
        newSlug: event.newSlug,
      },
    });
    this.logger.log(`Reward profile duplicated: ${event.sourceProfileId} → ${event.newProfileId}`);
  }

  @OnEvent(REWARD_PROFILE_EVENTS.ACTIVATED)
  async onActivated(event: RewardProfileActivatedEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.ACTIVATED,
      entityType: 'rewardProfile',
      entityId: event.profileId,
      action: 'ACTIVATE',
      userId: event.activatedBy ?? undefined,
      metadata: { slug: event.slug },
    });
  }

  @OnEvent(REWARD_PROFILE_EVENTS.DEFAULT_CHANGED)
  async onDefaultChanged(event: RewardProfileDefaultChangedEvent) {
    await this.audit.record({
      eventType: REWARD_PROFILE_EVENTS.DEFAULT_CHANGED,
      entityType: 'rewardProfile',
      entityId: event.newDefaultId,
      action: 'SET_DEFAULT',
      userId: event.changedBy ?? undefined,
      metadata: {
        previousDefaultId: event.previousDefaultId,
        newDefaultId: event.newDefaultId,
      },
    });
    this.logger.log(`Default reward profile changed to: ${event.newDefaultId}`);
  }
}
