import { RewardRuleStatus, RewardRuleType, RuleRewardType } from '@prisma/client';

export interface RewardRuleResponse {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  ruleType: RewardRuleType;
  coinRequirement: number;
  rewardType: RuleRewardType;
  rewardReference: string | null;
  priority: number;
  displayOrder: number;
  status: RewardRuleStatus;
  validFrom: Date | null;
  expiryDate: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { rewards: number; metadata: number };
}

export interface RewardRuleListResult {
  items: RewardRuleResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RewardMilestone {
  id: string;
  name: string;
  description: string | null;
  coinRequirement: number;
  rewardType: RuleRewardType;
  rewardReference: string | null;
  displayOrder: number;
  rewards: {
    id: string;
    rewardType: RuleRewardType;
    rewardReference: string | null;
    quantity: number;
  }[];
}
