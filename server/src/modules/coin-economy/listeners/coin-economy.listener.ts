import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditSeverity } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { COIN_ECONOMY_EVENTS } from '../constants';
import {
  CoinLimitChangedEvent,
  CoinLimitReachedEvent,
  CoinMultiplierChangedEvent,
  CoinRuleArchivedEvent,
  CoinRuleCreatedEvent,
  CoinRuleDisabledEvent,
  CoinRuleDuplicatedEvent,
  CoinRuleEnabledEvent,
  CoinRuleRestoredEvent,
  CoinRuleUpdatedEvent,
} from '../events';

const ENTITY_RULE = 'coinRule';
const ENTITY_LIMIT = 'coinLimit';
const ENTITY_MULTIPLIER = 'coinMultiplier';

/**
 * Turns coin economy events into audit rows. This is the only subscriber —
 * no business logic consumes these events yet.
 */
@Injectable()
export class CoinEconomyListener {
  private readonly logger = new Logger(CoinEconomyListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_CREATED)
  async onRuleCreated(event: CoinRuleCreatedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_CREATED,
      entityType: ENTITY_RULE,
      entityId: event.ruleId,
      action: 'CREATE',
      userId: event.createdBy,
      metadata: {
        name: event.name,
        ruleType: event.ruleType,
        coinAmount: event.coinAmount,
      },
    });
    this.logger.log(`Coin rule created: ${event.name}`);
  }

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_UPDATED)
  async onRuleUpdated(event: CoinRuleUpdatedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_UPDATED,
      entityType: ENTITY_RULE,
      entityId: event.ruleId,
      action: 'UPDATE',
      userId: event.updatedBy,
      oldValue: event.oldValue,
      newValue: event.newValue,
      metadata: { ruleType: event.ruleType, changedFields: event.changedFields },
    });
  }

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_ENABLED)
  async onRuleEnabled(event: CoinRuleEnabledEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_ENABLED,
      entityType: ENTITY_RULE,
      entityId: event.ruleId,
      action: 'ENABLE',
      userId: event.enabledBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name, ruleType: event.ruleType },
    });
    this.logger.log(`Coin rule enabled: ${event.name}`);
  }

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_DISABLED)
  async onRuleDisabled(event: CoinRuleDisabledEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_DISABLED,
      entityType: ENTITY_RULE,
      entityId: event.ruleId,
      action: 'DISABLE',
      userId: event.disabledBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name, ruleType: event.ruleType },
    });
    this.logger.log(`Coin rule disabled: ${event.name}`);
  }

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_ARCHIVED)
  async onRuleArchived(event: CoinRuleArchivedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_ARCHIVED,
      entityType: ENTITY_RULE,
      entityId: event.ruleId,
      action: 'ARCHIVE',
      userId: event.archivedBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name, ruleType: event.ruleType },
    });
  }

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_RESTORED)
  async onRuleRestored(event: CoinRuleRestoredEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_RESTORED,
      entityType: ENTITY_RULE,
      entityId: event.ruleId,
      action: 'RESTORE',
      userId: event.restoredBy,
      metadata: { name: event.name, ruleType: event.ruleType },
    });
  }

  @OnEvent(COIN_ECONOMY_EVENTS.RULE_DUPLICATED)
  async onRuleDuplicated(event: CoinRuleDuplicatedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.RULE_DUPLICATED,
      entityType: ENTITY_RULE,
      entityId: event.newRuleId,
      action: 'DUPLICATE',
      userId: event.duplicatedBy,
      metadata: { sourceRuleId: event.sourceRuleId, ruleType: event.ruleType },
    });
  }

  @OnEvent(COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED)
  async onMultiplierChanged(event: CoinMultiplierChangedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
      entityType: ENTITY_MULTIPLIER,
      entityId: event.multiplierId,
      action: event.action,
      userId: event.changedBy,
      severity: AuditSeverity.HIGH,
      oldValue: { multiplier: event.oldMultiplier },
      newValue: { multiplier: event.newMultiplier },
      metadata: { name: event.name },
    });
    this.logger.log(
      `Coin multiplier ${event.action.toLowerCase()}: ${event.name} (${event.oldMultiplier} → ${event.newMultiplier})`,
    );
  }

  @OnEvent(COIN_ECONOMY_EVENTS.LIMIT_CHANGED)
  async onLimitChanged(event: CoinLimitChangedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
      entityType: ENTITY_LIMIT,
      entityId: event.limitId,
      action: event.action,
      userId: event.changedBy,
      severity: AuditSeverity.WARNING,
      metadata: { name: event.name, scope: event.scope, ruleId: event.ruleId },
    });
  }

  @OnEvent(COIN_ECONOMY_EVENTS.LIMIT_REACHED)
  async onLimitReached(event: CoinLimitReachedEvent): Promise<void> {
    await this.audit.record({
      eventType: COIN_ECONOMY_EVENTS.LIMIT_REACHED,
      entityType: ENTITY_LIMIT,
      entityId: event.limitId,
      action: 'LIMIT_REACHED',
      userId: event.userId,
      metadata: {
        ruleId: event.ruleId,
        ruleType: event.ruleType,
        scope: event.scope,
        usedCoins: event.usedCoins,
        maxCoins: event.maxCoins,
      },
      // One row per user per limit per day is enough signal.
      dedupeKey: `coin-limit-reached:${event.userId}:${event.ruleId}:${event.scope}:${event.occurredAt.toISOString().slice(0, 10)}`,
    });
  }
}
