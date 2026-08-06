import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const REWARD_SELECT = {
  id: true,
  challengeId: true,
  rewardType: true,
  coinAmount: true,
  rewardReference: true,
  quantity: true,
  sortOrder: true,
  description: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChallengeRewardSelect;

export type ChallengeRewardRecord = Prisma.ChallengeRewardGetPayload<{
  select: typeof REWARD_SELECT;
}>;

@Injectable()
export class ChallengeRewardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChallenge(challengeId: string): Promise<ChallengeRewardRecord[]> {
    return this.prisma.challengeReward.findMany({
      where: { challengeId },
      select: REWARD_SELECT,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<ChallengeRewardRecord | null> {
    return this.prisma.challengeReward.findUnique({
      where: { id },
      select: REWARD_SELECT,
    });
  }

  async create(data: Prisma.ChallengeRewardCreateInput): Promise<ChallengeRewardRecord> {
    return this.prisma.challengeReward.create({ data, select: REWARD_SELECT });
  }

  async update(
    id: string,
    data: Prisma.ChallengeRewardUpdateInput,
  ): Promise<ChallengeRewardRecord> {
    return this.prisma.challengeReward.update({
      where: { id },
      data,
      select: REWARD_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.challengeReward.delete({ where: { id } });
  }
}
