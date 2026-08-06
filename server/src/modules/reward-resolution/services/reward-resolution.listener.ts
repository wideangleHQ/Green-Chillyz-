import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/services/audit.service';
import { REWARD_RESOLUTION_EVENTS, REWARD_RESOLUTION_AUDIT } from '../constants';
import {
  RewardResolvedEvent,
  CampaignAppliedEvent,
  MilestoneReachedEvent,
  VoucherUnlockedEvent,
  RewardUnlockedEvent,
} from '../events';

@Injectable()
export class RewardResolutionListener {
  private readonly logger = new Logger(RewardResolutionListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(REWARD_RESOLUTION_EVENTS.REWARD_RESOLVED)
  async onRewardResolved(event: RewardResolvedEvent) {
    this.logger.debug(`Reward resolved for ${event.customerId}@${event.storeId}: ${event.result.source}`);
  }

  @OnEvent(REWARD_RESOLUTION_EVENTS.CAMPAIGN_APPLIED)
  async onCampaignApplied(event: CampaignAppliedEvent) {
    this.audit.record({
      eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.CAMPAIGN_APPLIED,
      entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
      action: REWARD_RESOLUTION_AUDIT.ACTIONS.CAMPAIGN_APPLIED,
      entityId: event.campaignId,
      userId: event.customerId,
      storeId: event.storeId,
      newValue: {
        campaignId: event.campaignId,
        campaignName: event.campaignName,
        totalCoins: event.totalCoins,
      },
    });
  }

  @OnEvent(REWARD_RESOLUTION_EVENTS.MILESTONE_REACHED)
  async onMilestoneReached(event: MilestoneReachedEvent) {
    this.audit.record({
      eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.RESOLVED,
      entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
      action: 'MILESTONE_REACHED',
      entityId: event.milestoneId,
      userId: event.customerId,
      storeId: event.storeId,
      newValue: {
        milestoneId: event.milestoneId,
        milestoneName: event.milestoneName,
        coinRequirement: event.coinRequirement,
      },
    });
  }

  @OnEvent(REWARD_RESOLUTION_EVENTS.REWARD_UNLOCKED)
  async onRewardUnlocked(event: RewardUnlockedEvent) {
    this.audit.record({
      eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.RESOLVED,
      entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
      action: 'REWARD_UNLOCKED',
      entityId: event.rewardId,
      userId: event.customerId,
      storeId: event.storeId,
      newValue: {
        rewardId: event.rewardId,
        rewardName: event.rewardName,
        rewardType: event.rewardType,
      },
    });
  }

  @OnEvent(REWARD_RESOLUTION_EVENTS.VOUCHER_UNLOCKED)
  async onVoucherUnlocked(event: VoucherUnlockedEvent) {
    this.audit.record({
      eventType: REWARD_RESOLUTION_AUDIT.ACTIONS.VOUCHER_GENERATED,
      entityType: REWARD_RESOLUTION_AUDIT.ENTITY_TYPE,
      action: REWARD_RESOLUTION_AUDIT.ACTIONS.VOUCHER_GENERATED,
      entityId: event.voucherId,
      userId: event.customerId,
      storeId: event.storeId,
      newValue: {
        voucherId: event.voucherId,
        voucherCode: event.voucherCode,
        expiresAt: event.expiresAt,
      },
    });
  }
}
