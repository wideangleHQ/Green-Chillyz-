import { Injectable } from '@nestjs/common';
import { Prisma, JourneyStatus, JourneyTriggerType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const JOURNEY_INCLUDE = {
  triggers: { orderBy: { createdAt: 'asc' } },
  steps: {
    orderBy: { sortOrder: 'asc' },
    include: { actions: { orderBy: { sortOrder: 'asc' } } },
  },
} satisfies Prisma.JourneyInclude;

export type JourneyWithDetails = Prisma.JourneyGetPayload<{
  include: typeof JOURNEY_INCLUDE;
}>;

@Injectable()
export class CustomerJourneyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(where: Prisma.JourneyWhereInput, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.journey.findMany({
        where: { deletedAt: null, ...where },
        include: JOURNEY_INCLUDE,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.journey.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  findById(id: string) {
    return this.prisma.journey.findFirst({
      where: { id, deletedAt: null },
      include: JOURNEY_INCLUDE,
    });
  }

  findByIdIncludingDeleted(id: string) {
    return this.prisma.journey.findUnique({
      where: { id },
      include: JOURNEY_INCLUDE,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.journey.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  findForTrigger(triggerType: JourneyTriggerType, now = new Date()) {
    return this.prisma.journey.findMany({
      where: {
        deletedAt: null,
        status: { in: [JourneyStatus.PUBLISHED, JourneyStatus.ACTIVE] },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
        triggers: { some: { triggerType, enabled: true } },
      },
      include: JOURNEY_INCLUDE,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  create(data: Prisma.JourneyCreateInput) {
    return this.prisma.journey.create({ data, include: JOURNEY_INCLUDE });
  }

  update(id: string, data: Prisma.JourneyUpdateInput) {
    return this.prisma.journey.update({
      where: { id },
      data,
      include: JOURNEY_INCLUDE,
    });
  }

  async replaceMetadata(journeyId: string, metadata: Record<string, unknown>) {
    await this.prisma.journeyMetadata.deleteMany({ where: { journeyId } });
    for (const [key, value] of Object.entries(metadata)) {
      await this.prisma.journeyMetadata.create({
        data: { journeyId, key, value: value as Prisma.InputJsonValue },
      });
    }
  }

  createExecution(data: Prisma.JourneyExecutionCreateInput) {
    return this.prisma.journeyExecution.create({ data });
  }

  updateExecution(id: string, data: Prisma.JourneyExecutionUpdateInput) {
    return this.prisma.journeyExecution.update({ where: { id }, data });
  }

  findExecutionByKey(idempotencyKey: string) {
    return this.prisma.journeyExecution.findUnique({
      where: { idempotencyKey },
    });
  }

  countExecutions(journeyId: string, userId: string) {
    return this.prisma.journeyExecution.count({
      where: {
        journeyId,
        userId,
        simulation: false,
        status: { in: ['STARTED', 'COMPLETED'] },
      },
    });
  }

  recordHistory(data: Prisma.JourneyHistoryCreateInput) {
    return this.prisma.journeyHistory.create({ data });
  }

  findHistory(journeyId: string, skip = 0, take = 50) {
    return this.prisma.journeyHistory.findMany({
      where: { journeyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }
}
