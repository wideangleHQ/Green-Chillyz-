import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardRewardSearchDto } from '../dto';

@Injectable()
export class DashboardRewardSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: DashboardRewardSearchDto) {
    const term = `%${query.query}%`;
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const [profiles, rules, stores, assignments, overrides] = await Promise.all([
      this.prisma.rewardProfile.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query.query, mode: 'insensitive' } },
            { slug: { contains: query.query, mode: 'insensitive' } },
            { description: { contains: query.query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          type: true,
          isDefault: true,
        },
        take: pageSize,
        skip,
      }),
      this.prisma.profileRewardRule.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query.query, mode: 'insensitive' } },
            { description: { contains: query.query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          ruleType: true,
          coinRequirement: true,
          rewardType: true,
          status: true,
          profile: { select: { id: true, name: true } },
        },
        take: pageSize,
        skip,
      }),
      this.prisma.store.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [
            { name: { contains: query.query, mode: 'insensitive' } },
            { code: { contains: query.query, mode: 'insensitive' } },
            { slug: { contains: query.query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          slug: true,
          city: true,
        },
        take: pageSize,
        skip,
      }),
      this.prisma.rewardAssignment.findMany({
        where: {
          deletedAt: null,
          OR: [
            { store: { name: { contains: query.query, mode: 'insensitive' } } },
            { profile: { name: { contains: query.query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          status: true,
          assignmentType: true,
          store: { select: { id: true, name: true, code: true } },
          profile: { select: { id: true, name: true } },
        },
        take: pageSize,
        skip,
      }),
      this.prisma.rewardOverride.findMany({
        where: {
          deletedAt: null,
          OR: [
            { store: { name: { contains: query.query, mode: 'insensitive' } } },
            { rule: { name: { contains: query.query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          status: true,
          overrideRewardType: true,
          store: { select: { id: true, name: true, code: true } },
          rule: { select: { id: true, name: true } },
        },
        take: pageSize,
        skip,
      }),
    ]);

    return { profiles, rules, stores, assignments, overrides };
  }
}
