import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChallengeProgressStatus } from '../enums';
import { PrismaService } from '../../../database/prisma.service';

const PROGRESS_SELECT = {
  id: true,
  challengeId: true,
  userId: true,
  status: true,
  currentProgress: true,
  currentAmount: true,
  targetCount: true,
  targetAmount: true,
  completedAt: true,
  rewardClaimedAt: true,
  expiresAt: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChallengeProgressSelect;

export type ChallengeProgressRecord = Prisma.ChallengeProgressGetPayload<{
  select: typeof PROGRESS_SELECT;
}>;

@Injectable()
export class ChallengeProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ChallengeProgressRecord | null> {
    return this.prisma.challengeProgress.findUnique({
      where: { uq_challenge_progress_user: { challengeId, userId } },
      select: PROGRESS_SELECT,
    });
  }

  async findByUser(
    userId: string,
    statuses?: ChallengeProgressStatus[],
  ): Promise<ChallengeProgressRecord[]> {
    return this.prisma.challengeProgress.findMany({
      where: {
        userId,
        ...(statuses?.length ? { status: { in: statuses } } : {}),
      },
      select: PROGRESS_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByChallenge(
    challengeId: string,
    statuses?: ChallengeProgressStatus[],
  ): Promise<ChallengeProgressRecord[]> {
    return this.prisma.challengeProgress.findMany({
      where: {
        challengeId,
        ...(statuses?.length ? { status: { in: statuses } } : {}),
      },
      select: PROGRESS_SELECT,
    });
  }

  async create(
    data: Prisma.ChallengeProgressCreateInput,
  ): Promise<ChallengeProgressRecord> {
    return this.prisma.challengeProgress.create({ data, select: PROGRESS_SELECT });
  }

  async update(
    id: string,
    data: Prisma.ChallengeProgressUpdateInput,
  ): Promise<ChallengeProgressRecord> {
    return this.prisma.challengeProgress.update({
      where: { id },
      data,
      select: PROGRESS_SELECT,
    });
  }

  async findCompletedHistory(
    userId: string,
    skip: number,
    take: number,
  ): Promise<[ChallengeProgressRecord[], number]> {
    const where: Prisma.ChallengeProgressWhereInput = {
      userId,
      status: { in: [ChallengeProgressStatus.COMPLETED, ChallengeProgressStatus.REWARD_CLAIMED] },
    };
    const [items, total] = await Promise.all([
      this.prisma.challengeProgress.findMany({
        where,
        select: PROGRESS_SELECT,
        orderBy: { completedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.challengeProgress.count({ where }),
    ]);
    return [items, total];
  }

  async findExpired(now: Date): Promise<ChallengeProgressRecord[]> {
    return this.prisma.challengeProgress.findMany({
      where: {
        expiresAt: { lt: now },
        status: { in: [ChallengeProgressStatus.NOT_STARTED, ChallengeProgressStatus.IN_PROGRESS] },
      },
      select: PROGRESS_SELECT,
      take: 500,
    });
  }
}
