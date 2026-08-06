import { RewardProfileStatus, RewardProfileType } from '@prisma/client';

export interface RewardProfileResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: RewardProfileStatus;
  type: RewardProfileType;
  isDefault: boolean;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { versions: number; metadata: number };
}

export interface RewardProfileVersionResponse {
  id: string;
  profileId: string;
  versionNumber: number;
  name: string;
  slug: string;
  description: string | null;
  status: RewardProfileStatus;
  type: RewardProfileType;
  isDefault: boolean;
  snapshot: Record<string, unknown> | null;
  changeReason: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface RewardProfileListResult {
  items: RewardProfileResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
