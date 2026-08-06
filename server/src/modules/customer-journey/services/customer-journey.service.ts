import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AuditActorType,
  AuditSeverity,
  JourneyActionExecutionStatus,
  JourneyExecutionStatus,
  JourneyStatus,
  JourneyTriggerType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WalletService } from '../../wallet/services';
import { AuditService } from '../../audit/services';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../../audit/constants';
import {
  CUSTOMER_JOURNEY_DEFAULTS,
  CUSTOMER_JOURNEY_ERRORS,
  CUSTOMER_JOURNEY_EVENTS,
} from '../constants';
import {
  CreateJourneyDto,
  DuplicateJourneyDto,
  JourneyQueryDto,
  SimulateJourneyDto,
  TriggerJourneyDto,
  UpdateJourneyDto,
} from '../dto';
import {
  JourneyActionResult,
  JourneyEventContext,
  JourneyExecutionResult,
  JourneyResponse,
  PagedJourneyResult,
} from '../interfaces';
import {
  assertJourneyEffective,
  validateJourneyDefinition,
  validateJourneyShape,
} from '../validators';
import {
  CustomerJourneyRepository,
  JourneyWithDetails,
} from '../repositories';
import { CustomerJourneyCacheService } from '../cache';
import { JourneyActionExecutorService } from './journey-action-executor.service';
import {
  JourneyActionExecutedEvent,
  JourneyCompletedEvent,
  JourneyFailedEvent,
  JourneyPausedEvent,
  JourneyPublishedEvent,
  JourneyStartedEvent,
} from '../events';

@Injectable()
export class CustomerJourneyService {
  private readonly logger = new Logger(CustomerJourneyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: CustomerJourneyRepository,
    private readonly cache: CustomerJourneyCacheService,
    private readonly executor: JourneyActionExecutorService,
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: JourneyQueryDto): Promise<PagedJourneyResult<JourneyResponse>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? CUSTOMER_JOURNEY_DEFAULTS.PAGE_SIZE,
      CUSTOMER_JOURNEY_DEFAULTS.MAX_PAGE_SIZE,
    );
    const where: Prisma.JourneyWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.repo.findMany(where, (page - 1) * pageSize, pageSize);
    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<JourneyResponse> {
    const journey = await this.repo.findById(id);
    if (!journey) throw new NotFoundException(CUSTOMER_JOURNEY_ERRORS.NOT_FOUND);
    return this.toResponse(journey);
  }

  async create(dto: CreateJourneyDto, actorId: string | null): Promise<JourneyResponse> {
    validateJourneyDefinition(dto);
    const duplicate = await this.repo.findBySlug(dto.slug);
    if (duplicate) throw new ConflictException(CUSTOMER_JOURNEY_ERRORS.DUPLICATE_SLUG);

    const journey = await this.repo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      type: dto.type ?? 'CUSTOM',
      status: dto.status ?? 'DRAFT',
      priority: dto.priority ?? 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      maxExecutions: dto.maxExecutions ?? null,
      createdBy: actorId,
      updatedBy: actorId,
      triggers: {
        create: dto.triggers.map((trigger) => ({
          triggerType: trigger.triggerType,
          eventName: trigger.eventName ?? null,
          config: (trigger.config ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          enabled: trigger.enabled ?? true,
        })),
      },
      steps: {
        create: dto.steps.map((step) => ({
          name: step.name,
          sortOrder: step.sortOrder ?? 0,
          enabled: step.enabled ?? true,
          conditions: (step.conditions ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          actions: {
            create: step.actions.map((action) => ({
              actionType: action.actionType,
              config: action.config as Prisma.InputJsonValue,
              sortOrder: action.sortOrder ?? 0,
              enabled: action.enabled ?? true,
            })),
          },
        })),
      },
    });

    if (dto.metadata) await this.repo.replaceMetadata(journey.id, dto.metadata);
    await this.recordLifecycle(journey.id, 'JOURNEY_CREATED', AUDIT_ACTIONS.CREATE, actorId);
    await this.cache.invalidateAll();
    return this.toResponse(journey);
  }

  async update(id: string, dto: UpdateJourneyDto, actorId: string | null): Promise<JourneyResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(CUSTOMER_JOURNEY_ERRORS.NOT_FOUND);
    validateJourneyShape(dto);

    const journey = await this.repo.update(id, {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      type: dto.type ?? undefined,
      priority: dto.priority ?? undefined,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      maxExecutions: dto.maxExecutions ?? undefined,
      updatedBy: actorId,
    });

    if (dto.metadata) await this.repo.replaceMetadata(id, dto.metadata);
    await this.recordLifecycle(id, 'JOURNEY_UPDATED', AUDIT_ACTIONS.UPDATE, actorId);
    await this.cache.invalidateAll();
    return this.toResponse(journey);
  }

  async duplicate(id: string, dto: DuplicateJourneyDto, actorId: string | null): Promise<JourneyResponse> {
    const source = await this.repo.findById(id);
    if (!source) throw new NotFoundException(CUSTOMER_JOURNEY_ERRORS.NOT_FOUND);

    const slug = dto.slug ?? `${source.slug}-copy-${Date.now()}`;
    if (await this.repo.findBySlug(slug)) {
      throw new ConflictException(CUSTOMER_JOURNEY_ERRORS.DUPLICATE_SLUG);
    }

    const copy = await this.repo.create({
      name: dto.name ?? `${source.name} (copy)`,
      slug,
      description: source.description,
      type: source.type,
      status: JourneyStatus.DRAFT,
      priority: source.priority,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      maxExecutions: source.maxExecutions,
      createdBy: actorId,
      updatedBy: actorId,
      triggers: {
        create: source.triggers.map((trigger) => ({
          triggerType: trigger.triggerType,
          eventName: trigger.eventName,
          config: (trigger.config ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          enabled: trigger.enabled,
        })),
      },
      steps: {
        create: source.steps.map((step) => ({
          name: step.name,
          sortOrder: step.sortOrder,
          enabled: step.enabled,
          conditions: (step.conditions ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          actions: {
            create: step.actions.map((action) => ({
              actionType: action.actionType,
              config: action.config as Prisma.InputJsonValue,
              sortOrder: action.sortOrder,
              enabled: action.enabled,
            })),
          },
        })),
      },
    });

    await this.recordLifecycle(copy.id, 'JOURNEY_DUPLICATED', AUDIT_ACTIONS.CREATE, actorId, { sourceId: id });
    await this.cache.invalidateAll();
    return this.toResponse(copy);
  }

  async archive(id: string, actorId: string | null): Promise<void> {
    await this.ensureJourney(id);
    await this.repo.update(id, {
      status: JourneyStatus.ARCHIVED,
      archivedAt: new Date(),
      deletedAt: new Date(),
      updatedBy: actorId,
    });
    await this.recordLifecycle(id, 'JOURNEY_ARCHIVED', AUDIT_ACTIONS.DELETE, actorId);
    await this.cache.invalidateAll();
  }

  async publish(id: string, actorId: string | null): Promise<JourneyResponse> {
    const journey = await this.ensureJourney(id);
    if (journey.triggers.length === 0 || journey.steps.every((step) => step.actions.length === 0)) {
      throw new BadRequestException(CUSTOMER_JOURNEY_ERRORS.CANNOT_PUBLISH_EMPTY);
    }
    assertJourneyEffective(journey);
    const updated = await this.repo.update(id, {
      status: JourneyStatus.PUBLISHED,
      publishedAt: new Date(),
      updatedBy: actorId,
    });
    await this.recordLifecycle(id, 'JOURNEY_PUBLISHED', AUDIT_ACTIONS.UPDATE, actorId);
    this.events.emit(CUSTOMER_JOURNEY_EVENTS.PUBLISHED, new JourneyPublishedEvent(id, actorId));
    await this.cache.invalidateAll();
    return this.toResponse(updated);
  }

  async pause(id: string, actorId: string | null): Promise<JourneyResponse> {
    await this.ensureJourney(id);
    const updated = await this.repo.update(id, {
      status: JourneyStatus.PAUSED,
      updatedBy: actorId,
    });
    await this.recordLifecycle(id, 'JOURNEY_PAUSED', AUDIT_ACTIONS.UPDATE, actorId);
    this.events.emit(CUSTOMER_JOURNEY_EVENTS.PAUSED, new JourneyPausedEvent(id, actorId));
    await this.cache.invalidateAll();
    return this.toResponse(updated);
  }

  async resume(id: string, actorId: string | null): Promise<JourneyResponse> {
    await this.ensureJourney(id);
    const updated = await this.repo.update(id, {
      status: JourneyStatus.ACTIVE,
      updatedBy: actorId,
    });
    await this.recordLifecycle(id, 'JOURNEY_RESUMED', AUDIT_ACTIONS.UPDATE, actorId);
    await this.cache.invalidateAll();
    return this.toResponse(updated);
  }

  async trigger(dto: TriggerJourneyDto): Promise<JourneyExecutionResult[]> {
    const context: JourneyEventContext = {
      userId: dto.userId,
      triggerType: dto.triggerType,
      storeId: dto.storeId ?? null,
      referenceId: dto.referenceId ?? null,
      referenceType: dto.referenceType ?? null,
      metadata: dto.metadata ?? null,
      idempotencyKey: dto.idempotencyKey ?? null,
    };

    const cached = await this.cache.getTriggers<JourneyWithDetails[]>(dto.triggerType);
    const journeys = cached ?? await this.repo.findForTrigger(dto.triggerType);
    if (!cached) await this.cache.setTriggers(dto.triggerType, journeys);
    return Promise.all(journeys.map((journey) => this.executeJourney(journey, context, false)));
  }

  async simulate(dto: SimulateJourneyDto): Promise<JourneyExecutionResult> {
    const journey = await this.ensureJourney(dto.journeyId);
    return this.executeJourney(
      journey,
      {
        userId: dto.userId,
        triggerType: dto.triggerType,
        storeId: dto.storeId ?? null,
        referenceId: dto.referenceId ?? null,
        referenceType: dto.referenceType ?? null,
        metadata: dto.metadata ?? null,
      },
      true,
    );
  }

  async getHistory(id: string, page = 1, pageSize = 50) {
    await this.ensureJourney(id);
    return this.repo.findHistory(id, (page - 1) * pageSize, pageSize);
  }

  private async executeJourney(
    journey: JourneyWithDetails,
    context: JourneyEventContext,
    simulate: boolean,
  ): Promise<JourneyExecutionResult> {
    const now = context.now ?? new Date();
    try {
      assertJourneyEffective(journey, now);
      if (!simulate && journey.maxExecutions !== null) {
        const count = await this.repo.countExecutions(journey.id, context.userId);
        if (count >= journey.maxExecutions) {
          return this.skipped(journey.id, 'Maximum executions reached', simulate);
        }
      }

      const eligible = await this.conditionsPass(journey, context);
      if (!eligible) return this.skipped(journey.id, 'Conditions did not pass', simulate);

      const idempotencyKey = context.idempotencyKey
        ?? `journey:${journey.id}:${context.userId}:${context.triggerType}:${context.referenceId ?? this.dayKey(now)}`;
      const existing = !simulate ? await this.repo.findExecutionByKey(idempotencyKey) : null;
      if (existing) {
        return {
          executionId: existing.id,
          journeyId: journey.id,
          status: existing.status,
          simulated: false,
          actions: (existing.result as any)?.actions ?? [],
          skippedReason: 'Duplicate execution suppressed',
        };
      }

      const execution = simulate
        ? null
        : await this.repo.createExecution({
            journey: { connect: { id: journey.id } },
            userId: context.userId,
            storeId: context.storeId ?? null,
            triggerType: context.triggerType,
            status: JourneyExecutionStatus.STARTED,
            idempotencyKey,
            simulation: false,
            input: this.json(context),
          });

      if (execution) {
        this.events.emit(
          CUSTOMER_JOURNEY_EVENTS.STARTED,
          new JourneyStartedEvent(journey.id, execution.id, context.userId, context.triggerType),
        );
        await this.recordExecutionHistory(journey.id, execution.id, 'JOURNEY_STARTED');
      }

      const actions: JourneyActionResult[] = [];
      for (const step of journey.steps.filter((step) => step.enabled)) {
        for (const action of step.actions.filter((item) => item.enabled)) {
          const result = await this.executor.execute(action, context, execution?.id ?? null, simulate);
          actions.push(result);
          if (execution) {
            await this.recordExecutionHistory(
              journey.id,
              execution.id,
              'JOURNEY_ACTION_EXECUTED',
              result,
            );
            this.events.emit(
              CUSTOMER_JOURNEY_EVENTS.ACTION_EXECUTED,
              new JourneyActionExecutedEvent(journey.id, execution.id, action.actionType, context.userId),
            );
          }
        }
      }

      const status = simulate ? JourneyExecutionStatus.SIMULATED : JourneyExecutionStatus.COMPLETED;
      if (execution) {
        await this.repo.updateExecution(execution.id, {
          status,
          result: this.json({ actions }),
          completedAt: new Date(),
        });
        await this.recordExecutionHistory(journey.id, execution.id, 'JOURNEY_COMPLETED');
        this.events.emit(
          CUSTOMER_JOURNEY_EVENTS.COMPLETED,
          new JourneyCompletedEvent(journey.id, execution.id, context.userId),
        );
        await this.recordLifecycle(journey.id, 'JOURNEY_EXECUTED', AUDIT_ACTIONS.COMPLETE, null, {
          executionId: execution.id,
          userId: context.userId,
          triggerType: context.triggerType,
        });
        await this.cache.invalidateCustomer(context.userId);
      }

      return {
        executionId: execution?.id ?? null,
        journeyId: journey.id,
        status,
        simulated: simulate,
        actions,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Journey execution failed';
      this.events.emit(
        CUSTOMER_JOURNEY_EVENTS.FAILED,
        new JourneyFailedEvent(journey.id, null, context.userId, reason),
      );
      await this.recordLifecycle(journey.id, 'JOURNEY_FAILED', AUDIT_ACTIONS.ERROR, null, {
        reason,
        userId: context.userId,
      });
      this.logger.error(`Journey ${journey.id} failed for ${context.userId}: ${reason}`);
      return {
        executionId: null,
        journeyId: journey.id,
        status: JourneyExecutionStatus.FAILED,
        simulated: simulate,
        actions: [],
        skippedReason: reason,
      };
    }
  }

  private async conditionsPass(
    journey: JourneyWithDetails,
    context: JourneyEventContext,
  ): Promise<boolean> {
    const allConditions = journey.steps
      .flatMap((step) => {
        if (!step.conditions) return [];
        return Array.isArray(step.conditions) ? step.conditions : [step.conditions];
      })
      .filter(Boolean) as Array<Record<string, any>>;

    if (allConditions.length === 0) return true;

    const wallet = await this.wallet.getBalance(context.userId).catch(() => ({
      balance: 0,
      pendingBalance: 0,
    }));
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId: context.userId },
      select: { assignedStoreId: true, dateOfBirth: true, referredById: true },
    });

    for (const condition of allConditions) {
      const actual = await this.resolveConditionValue(condition, context, wallet.balance, customer);
      if (!this.compare(actual, condition.operator, condition.value)) return false;
    }
    return true;
  }

  private async resolveConditionValue(
    condition: Record<string, any>,
    context: JourneyEventContext,
    balance: number,
    customer: { assignedStoreId: string; dateOfBirth: Date | null; referredById: string | null } | null,
  ): Promise<unknown> {
    switch (condition.type) {
      case 'COIN_BALANCE':
      case 'WALLET_BALANCE':
        return balance;
      case 'STORE':
        return context.storeId ?? customer?.assignedStoreId ?? null;
      case 'CUSTOMER_AGE':
        return customer?.dateOfBirth ? this.age(customer.dateOfBirth) : null;
      case 'REFERRAL_COUNT':
        return this.prisma.customerProfile.count({ where: { referredById: context.userId } });
      case 'CUSTOM_CONDITION':
        return context.metadata?.[condition.key];
      default:
        return context.metadata?.[condition.type] ?? null;
    }
  }

  private compare(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'EQ': return actual === expected;
      case 'NEQ': return actual !== expected;
      case 'GT': return Number(actual) > Number(expected);
      case 'GTE': return Number(actual) >= Number(expected);
      case 'LT': return Number(actual) < Number(expected);
      case 'LTE': return Number(actual) <= Number(expected);
      case 'IN': return Array.isArray(expected) && expected.includes(actual);
      case 'NOT_IN': return Array.isArray(expected) && !expected.includes(actual);
      case 'EXISTS': return actual !== null && actual !== undefined;
      default: return false;
    }
  }

  private async ensureJourney(id: string): Promise<JourneyWithDetails> {
    const journey = await this.repo.findById(id);
    if (!journey) throw new NotFoundException(CUSTOMER_JOURNEY_ERRORS.NOT_FOUND);
    return journey;
  }

  private async recordLifecycle(
    journeyId: string,
    eventType: string,
    action: string,
    actorId: string | null,
    metadata: Record<string, unknown> | null = null,
  ): Promise<void> {
    await this.repo.recordHistory({
      journey: { connect: { id: journeyId } },
      eventType,
      status: JourneyActionExecutionStatus.COMPLETED,
      message: eventType,
      createdBy: actorId,
      snapshot: this.json(metadata ?? {}),
    });
    await this.audit.record({
      eventType,
      entityType: AUDIT_ENTITY_TYPES.SYSTEM,
      entityId: journeyId,
      action,
      actorType: actorId ? AuditActorType.EMPLOYEE : AuditActorType.SYSTEM,
      employeeId: actorId,
      severity: eventType === 'JOURNEY_FAILED' ? AuditSeverity.HIGH : AuditSeverity.INFO,
      metadata,
      dedupeKey: metadata?.executionId ? `${eventType}:${metadata.executionId}` : null,
    });
  }

  private recordExecutionHistory(
    journeyId: string,
    executionId: string,
    eventType: string,
    result?: JourneyActionResult,
  ) {
    return this.repo.recordHistory({
      journey: { connect: { id: journeyId } },
      execution: { connect: { id: executionId } },
      eventType,
      actionType: result?.actionType,
      status: result?.status ?? JourneyActionExecutionStatus.COMPLETED,
      message: result?.message ?? eventType,
      snapshot: this.json(result ?? {}),
    });
  }

  private skipped(
    journeyId: string,
    reason: string,
    simulate: boolean,
  ): JourneyExecutionResult {
    return {
      executionId: null,
      journeyId,
      status: JourneyExecutionStatus.SKIPPED,
      simulated: simulate,
      actions: [],
      skippedReason: reason,
    };
  }

  private toResponse(journey: JourneyWithDetails): JourneyResponse {
    return {
      id: journey.id,
      name: journey.name,
      slug: journey.slug,
      description: journey.description,
      type: journey.type,
      status: journey.status,
      priority: journey.priority,
      startsAt: journey.startsAt,
      endsAt: journey.endsAt,
      maxExecutions: journey.maxExecutions,
      publishedAt: journey.publishedAt,
      archivedAt: journey.archivedAt,
      createdAt: journey.createdAt,
      updatedAt: journey.updatedAt,
      triggers: journey.triggers.map((trigger) => ({
        id: trigger.id,
        triggerType: trigger.triggerType,
        eventName: trigger.eventName,
        enabled: trigger.enabled,
        config: trigger.config,
      })),
      steps: journey.steps.map((step) => ({
        id: step.id,
        name: step.name,
        sortOrder: step.sortOrder,
        enabled: step.enabled,
        conditions: step.conditions,
        actions: step.actions.map((action) => ({
          id: action.id,
          actionType: action.actionType,
          sortOrder: action.sortOrder,
          enabled: action.enabled,
          config: action.config,
        })),
      })),
    };
  }

  private json(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
  }

  private dayKey(now: Date): string {
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  private age(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const month = today.getMonth() - dateOfBirth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dateOfBirth.getDate())) age--;
    return age;
  }
}
