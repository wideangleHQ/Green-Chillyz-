import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const RULE_SELECT = {
  id: true,
  challengeId: true,
  ruleType: true,
  targetCount: true,
  targetAmount: true,
  gameSlug: true,
  storeId: true,
  sortOrder: true,
  description: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChallengeRuleSelect;

export type ChallengeRuleRecord = Prisma.ChallengeRuleGetPayload<{
  select: typeof RULE_SELECT;
}>;

@Injectable()
export class ChallengeRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChallenge(challengeId: string): Promise<ChallengeRuleRecord[]> {
    return this.prisma.challengeRule.findMany({
      where: { challengeId },
      select: RULE_SELECT,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<ChallengeRuleRecord | null> {
    return this.prisma.challengeRule.findUnique({
      where: { id },
      select: RULE_SELECT,
    });
  }

  async create(data: Prisma.ChallengeRuleCreateInput): Promise<ChallengeRuleRecord> {
    return this.prisma.challengeRule.create({ data, select: RULE_SELECT });
  }

  async update(
    id: string,
    data: Prisma.ChallengeRuleUpdateInput,
  ): Promise<ChallengeRuleRecord> {
    return this.prisma.challengeRule.update({
      where: { id },
      data,
      select: RULE_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.challengeRule.delete({ where: { id } });
  }
}
