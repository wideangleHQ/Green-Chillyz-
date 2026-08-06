import { Decimal } from '@prisma/client/runtime/library';
import { JsonValue } from '@prisma/client/runtime/library';
import {
  ChallengeType,
  ChallengeStatus,
  ChallengeRuleType,
  ChallengeRewardType,
  ChallengeProgressStatus,
} from '@prisma/client';

export interface ChallengeResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  image: string | null;
  icon: string | null;
  type: ChallengeType;
  status: ChallengeStatus;
  priority: number;
  isFeatured: boolean;
  maxParticipants: number | null;
  currentParticipants: number;
  startsAt: Date;
  endsAt: Date;
  storeIds: string[];
  brandIds: string[];
  campaignRef: string | null;
  autoEnroll: boolean;
  repeatableAfterDays: number | null;
  publishedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  rules?: ChallengeRuleResponse[];
  rewards?: ChallengeRewardResponse[];
}

export interface ChallengeRuleResponse {
  id: string;
  challengeId: string;
  ruleType: ChallengeRuleType;
  targetCount: number;
  targetAmount: Decimal | null;
  gameSlug: string | null;
  storeId: string | null;
  sortOrder: number;
  description: string | null;
  metadata: JsonValue;
}

export interface ChallengeRewardResponse {
  id: string;
  challengeId: string;
  rewardType: ChallengeRewardType;
  coinAmount: number | null;
  rewardReference: string | null;
  quantity: number;
  sortOrder: number;
  description: string | null;
  metadata: JsonValue;
}

export interface ChallengeProgressResponse {
  id: string;
  challengeId: string;
  userId: string;
  status: ChallengeProgressStatus;
  currentProgress: number;
  currentAmount: Decimal;
  targetCount: number;
  targetAmount: Decimal | null;
  completedAt: Date | null;
  rewardClaimedAt: Date | null;
  expiresAt: Date;
  metadata: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CustomerChallengeView {
  challengeId: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  image: string | null;
  icon: string | null;
  type: ChallengeType;
  isFeatured: boolean;
  startsAt: Date;
  endsAt: Date;
  status: ChallengeProgressStatus;
  currentProgress: number;
  targetCount: number;
  currentAmount: Decimal | number;
  targetAmount: Decimal | null;
  completedAt: Date | null;
  rewardClaimedAt: Date | null;
  rewards: ChallengeRewardResponse[];
  percentComplete: number;
}
