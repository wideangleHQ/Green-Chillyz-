import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/services/audit.service';
import { REWARD_RULE_EVENTS } from '../constants';
import {
  RewardRuleCreatedEvent,
  RewardRuleUpdatedEvent,
  RewardRuleArchivedEvent,
  RewardRuleDeletedEvent,
  RewardRuleDuplicatedEvent,
} from '../events';

@Injectable()
export class RewardRulesListener {
  private readonly logger = new Logger(RewardRulesListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(REWARD_RULE_EVENTS.CREATED)
  async onCreated(event: RewardRuleCreatedEvent) {
    await this.audit.record({
      eventType: REWARD_RULE_EVENTS.CREATED,
      entityType: 'rewardRule',
      entityId: event.ruleId,
      action: 'CREATE',
      userId: event.createdBy ?? undefined,
      metadata: {
        profileId: event.profileId,
        name: event.name,
        ruleType: event.ruleType,
      },
    });
    this.logger.log(`Reward rule created: ${event.name}`);
  }

  @OnEvent(REWARD_RULE_EVENTS.UPDATED)
  async onUpdated(event: RewardRuleUpdatedEvent) {
    await this.audit.record({
      eventType: REWARD_RULE_EVENTS.UPDATED,
      entityType: 'rewardRule',
      entityId: event.ruleId,
      action: 'UPDATE',
      userId: event.updatedBy ?? undefined,
      metadata: {
        profileId: event.profileId,
        changedFields: event.changedFields,
      },
    });
  }

  @OnEvent(REWARD_RULE_EVENTS.ARCHIVED)
  async onArchived(event: RewardRuleArchivedEvent) {
    await this.audit.record({
      eventType: REWARD_RULE_EVENTS.ARCHIVED,
      entityType: 'rewardRule',
      entityId: event.ruleId,
      action: 'ARCHIVE',
      userId: event.archivedBy ?? undefined,
      metadata: {
        profileId: event.profileId,
        name: event.name,
      },
    });
    this.logger.log(`Reward rule archived: ${event.name}`);
  }

  @OnEvent(REWARD_RULE_EVENTS.DELETED)
  async onDeleted(event: RewardRuleDeletedEvent) {
    await this.audit.record({
      eventType: REWARD_RULE_EVENTS.DELETED,
      entityType: 'rewardRule',
      entityId: event.ruleId,
      action: 'DELETE',
      userId: event.deletedBy ?? undefined,
      metadata: {
        profileId: event.profileId,
        name: event.name,
      },
    });
  }

  @OnEvent(REWARD_RULE_EVENTS.DUPLICATED)
  async onDuplicated(event: RewardRuleDuplicatedEvent) {
    await this.audit.record({
      eventType: REWARD_RULE_EVENTS.DUPLICATED,
      entityType: 'rewardRule',
      entityId: event.newRuleId,
      action: 'DUPLICATE',
      userId: event.duplicatedBy ?? undefined,
      metadata: {
        sourceRuleId: event.sourceRuleId,
        profileId: event.profileId,
      },
    });
    this.logger.log(`Reward rule duplicated: ${event.sourceRuleId} → ${event.newRuleId}`);
  }
}
