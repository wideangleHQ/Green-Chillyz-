import { Injectable } from '@nestjs/common';
import { Prisma, AuditSeverity } from '@prisma/client';
import { AuditRepository } from '../repositories';
import { AuditCacheService } from './audit-cache.service';
import { AuditAnalyticsQueryDto } from '../dto';
import { AuditAnalytics, AuditFraudIndicators } from '../interfaces';
import { AUDIT_EVENTS, AUDIT_DEFAULTS } from '../constants';

/**
 * Aggregations over the audit stream. Every figure comes from grouped queries
 * rather than per-row loops, so adding dimensions costs one query, not N.
 */
@Injectable()
export class AuditAnalyticsService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly cache: AuditCacheService,
  ) {}

  async getAnalytics(dto: AuditAnalyticsQueryDto): Promise<AuditAnalytics> {
    const cacheKey = `${dto.fromDate ?? '-'}:${dto.toDate ?? '-'}:${dto.storeId ?? '-'}`;
    const cached = await this.cache.getAnalytics<AuditAnalytics>(cacheKey);
    if (cached) return cached;

    const where = this.buildWhere(dto);
    const topN = AUDIT_DEFAULTS.ANALYTICS_TOP_N;

    const [
      totalEvents,
      highSeverityEvents,
      criticalEvents,
      manualAdjustments,
      rewardRedemptions,
      mostFrequentActions,
      mostFrequentEvents,
      employeeActivity,
      storeActivity,
      severityBreakdown,
      actorBreakdown,
    ] = await Promise.all([
      this.repository.countBy(where),
      this.repository.countBy({ ...where, severity: AuditSeverity.HIGH }),
      this.repository.countBy({ ...where, severity: AuditSeverity.CRITICAL }),
      this.repository.countBy({
        ...where,
        eventType: AUDIT_EVENTS.MANUAL_WALLET_ADJUSTMENT,
      }),
      this.repository.countBy({ ...where, eventType: AUDIT_EVENTS.REWARD_REDEEMED }),
      this.repository.groupByAction(where, topN),
      this.repository.groupByEventType(where, topN),
      this.repository.groupByUser(
        { ...where, actorType: { in: ['EMPLOYEE', 'STORE_MANAGER'] } },
        topN,
      ),
      this.repository.groupByStore(where, topN),
      this.repository.groupBySeverity(where),
      this.repository.groupByActorType(where),
    ]);

    const analytics: AuditAnalytics = {
      totalEvents,
      highSeverityEvents,
      criticalEvents,
      manualAdjustments,
      rewardRedemptions,
      mostFrequentActions,
      mostFrequentEvents,
      employeeActivity,
      storeActivity,
      severityBreakdown,
      actorBreakdown,
    };

    await this.cache.setAnalytics(cacheKey, analytics);
    return analytics;
  }

  /**
   * Patterns a reviewer should look at, not automated judgements: who is
   * adjusting balances by hand, who is pulling up customer records, and
   * everything already marked CRITICAL.
   */
  async getFraudIndicators(
    dto: AuditAnalyticsQueryDto,
  ): Promise<AuditFraudIndicators> {
    const where = this.buildWhere(dto);
    const topN = AUDIT_DEFAULTS.ANALYTICS_TOP_N;

    const [manualAdjustmentsByActor, customerLookupsByActor, criticalPage, highSeverityCount] =
      await Promise.all([
        this.repository.groupByUser(
          { ...where, eventType: AUDIT_EVENTS.MANUAL_WALLET_ADJUSTMENT },
          topN,
        ),
        this.repository.groupByUser(
          { ...where, eventType: AUDIT_EVENTS.CUSTOMER_LOOKUP },
          topN,
        ),
        this.repository.findPage(
          { ...where, severity: AuditSeverity.CRITICAL },
          topN,
        ),
        this.repository.countBy({ ...where, severity: AuditSeverity.HIGH }),
      ]);

    return {
      manualAdjustmentsByActor,
      customerLookupsByActor,
      criticalEvents: criticalPage.items,
      highSeverityCount,
    };
  }

  private buildWhere(dto: AuditAnalyticsQueryDto): Prisma.AuditLogWhereInput {
    return {
      ...(dto.storeId && { storeId: dto.storeId }),
      ...((dto.fromDate || dto.toDate) && {
        createdAt: {
          ...(dto.fromDate && { gte: new Date(dto.fromDate) }),
          ...(dto.toDate && { lte: new Date(dto.toDate) }),
        },
      }),
    };
  }
}
