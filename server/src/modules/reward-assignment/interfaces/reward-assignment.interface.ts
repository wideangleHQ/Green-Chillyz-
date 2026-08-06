import { RewardAssignmentStatus, RewardAssignmentType } from '@prisma/client';

export interface RewardAssignmentResponse {
  id: string;
  storeId: string;
  profileId: string;
  status: RewardAssignmentStatus;
  assignmentType: RewardAssignmentType;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  assignedBy: string | null;
  updatedBy: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  store?: { id: string; name: string; code: string };
  profile?: { id: string; name: string; slug: string };
}

export interface RewardAssignmentListResult {
  items: RewardAssignmentResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RewardAssignmentHistoryResponse {
  id: string;
  assignmentId: string;
  storeId: string;
  profileId: string;
  status: RewardAssignmentStatus;
  assignmentType: RewardAssignmentType;
  action: string;
  reason: string | null;
  changedBy: string | null;
  snapshot: Record<string, unknown> | null;
  createdAt: Date;
}
