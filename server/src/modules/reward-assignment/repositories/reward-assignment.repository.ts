import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const ASSIGNMENT_SELECT = {
  id: true,
  storeId: true,
  profileId: true,
  status: true,
  assignmentType: true,
  effectiveFrom: true,
  effectiveUntil: true,
  assignedBy: true,
  updatedBy: true,
  reason: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  store: { select: { id: true, name: true, code: true } },
  profile: { select: { id: true, name: true, slug: true } },
  _count: { select: { metadata: true } },
} satisfies Prisma.RewardAssignmentSelect;

const HISTORY_SELECT = {
  id: true,
  assignmentId: true,
  storeId: true,
  profileId: true,
  status: true,
  assignmentType: true,
  action: true,
  reason: true,
  changedBy: true,
  snapshot: true,
  createdAt: true,
} satisfies Prisma.RewardAssignmentHistorySelect;

@Injectable()
export class RewardAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.RewardAssignmentWhereInput,
    skip = 0,
    take = 20,
  ) {
    const [items, total] = await Promise.all([
      this.prisma.rewardAssignment.findMany({
        where: { deletedAt: null, ...where },
        select: ASSIGNMENT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.rewardAssignment.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  async findById(id: string) {
    return this.prisma.rewardAssignment.findFirst({
      where: { id, deletedAt: null },
      select: ASSIGNMENT_SELECT,
    });
  }

  async findActiveByStore(storeId: string) {
    return this.prisma.rewardAssignment.findFirst({
      where: { storeId, status: 'ACTIVE', deletedAt: null },
      select: ASSIGNMENT_SELECT,
    });
  }

  async findByStore(storeId: string) {
    return this.prisma.rewardAssignment.findMany({
      where: { storeId, deletedAt: null },
      select: ASSIGNMENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.RewardAssignmentCreateInput) {
    return this.prisma.rewardAssignment.create({
      data,
      select: ASSIGNMENT_SELECT,
    });
  }

  async update(id: string, data: Prisma.RewardAssignmentUpdateInput) {
    return this.prisma.rewardAssignment.update({
      where: { id },
      data,
      select: ASSIGNMENT_SELECT,
    });
  }

  async archiveActiveForStore(storeId: string, archivedBy?: string) {
    return this.prisma.rewardAssignment.updateMany({
      where: { storeId, status: 'ACTIVE', deletedAt: null },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedBy: archivedBy ?? null,
      },
    });
  }

  async softDelete(id: string, deletedBy?: string) {
    return this.prisma.rewardAssignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedBy: deletedBy ?? null,
      },
    });
  }

  async restore(id: string, restoredBy?: string) {
    return this.prisma.rewardAssignment.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
        archivedAt: null,
        updatedBy: restoredBy ?? null,
      },
      select: ASSIGNMENT_SELECT,
    });
  }

  async createHistory(data: Prisma.RewardAssignmentHistoryCreateInput) {
    return this.prisma.rewardAssignmentHistory.create({
      data,
      select: HISTORY_SELECT,
    });
  }

  async findHistory(storeId: string) {
    return this.prisma.rewardAssignmentHistory.findMany({
      where: { storeId },
      select: HISTORY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHistoryByAssignment(assignmentId: string) {
    return this.prisma.rewardAssignmentHistory.findMany({
      where: { assignmentId },
      select: HISTORY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertMetadata(assignmentId: string, key: string, value: unknown) {
    return this.prisma.assignmentMetadata.upsert({
      where: { uq_assignment_metadata_key: { assignmentId, key } },
      update: { value: value as Prisma.InputJsonValue },
      create: {
        assignmentId,
        key,
        value: value as Prisma.InputJsonValue,
      },
    });
  }

  async storeExists(storeId: string): Promise<boolean> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true },
    });
    return !!store;
  }
}
