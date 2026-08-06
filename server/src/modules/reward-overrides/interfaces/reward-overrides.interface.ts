import { RuleRewardType, RewardOverrideStatus } from '@prisma/client';

export interface RewardOverrideResponse {
  id: string;
  storeId: string;
  ruleId: string;
  overrideRewardType: RuleRewardType;
  overrideRewardRef: string | null;
  overrideCoinReq: number | null;
  overrideDisplayOrder: number | null;
  overridePriority: number | null;
  status: RewardOverrideStatus;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  reason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  store: { id: string; name: string; code: string };
  rule: { id: string; name: string; coinRequirement: number; rewardType: RuleRewardType };
  _count: { metadata: number };
}

export interface RewardOverrideListResult {
  items: RewardOverrideResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ResolvedReward {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  coinRequirement: number;
  rewardType: RuleRewardType;
  rewardReference: string | null;
  displayOrder: number;
  priority: number;
  source: 'OVERRIDE' | 'PROFILE';
  overrideId: string | null;
  validFrom: Date | null;
  expiryDate: Date | null;
}
