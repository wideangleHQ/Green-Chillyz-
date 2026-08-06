import { ResolvedRewardOutput } from '../interfaces';

export class RewardResolvedEvent {
  constructor(
    public readonly customerId: string,
    public readonly storeId: string,
    public readonly result: ResolvedRewardOutput,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class RewardUnlockedEvent {
  constructor(
    public readonly customerId: string,
    public readonly storeId: string,
    public readonly rewardId: string,
    public readonly rewardName: string,
    public readonly rewardType: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class VoucherUnlockedEvent {
  constructor(
    public readonly customerId: string,
    public readonly storeId: string,
    public readonly voucherId: string,
    public readonly voucherCode: string,
    public readonly expiresAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class CampaignAppliedEvent {
  constructor(
    public readonly customerId: string,
    public readonly storeId: string,
    public readonly campaignId: string,
    public readonly campaignName: string,
    public readonly totalCoins: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class MilestoneReachedEvent {
  constructor(
    public readonly customerId: string,
    public readonly storeId: string,
    public readonly milestoneId: string,
    public readonly milestoneName: string,
    public readonly coinRequirement: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
