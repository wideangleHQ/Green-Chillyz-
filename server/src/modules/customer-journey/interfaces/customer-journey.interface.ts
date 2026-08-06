import {
  JourneyActionExecutionStatus,
  JourneyActionType,
  JourneyConditionOperator,
  JourneyConditionType,
  JourneyExecutionStatus,
  JourneyStatus,
  JourneyTriggerType,
  JourneyType,
} from '@prisma/client';

export interface JourneyCondition {
  type: JourneyConditionType;
  operator: JourneyConditionOperator;
  value?: unknown;
  key?: string;
}

export interface JourneyEventContext {
  userId: string;
  triggerType: JourneyTriggerType;
  storeId?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  device?: string | null;
  now?: Date;
  idempotencyKey?: string | null;
}

export interface JourneyActionResult {
  actionId: string;
  actionType: JourneyActionType;
  status: JourneyActionExecutionStatus;
  message: string;
  output?: Record<string, unknown> | null;
}

export interface JourneyExecutionResult {
  executionId: string | null;
  journeyId: string;
  status: JourneyExecutionStatus;
  simulated: boolean;
  actions: JourneyActionResult[];
  skippedReason?: string | null;
}

export interface JourneyResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: JourneyType;
  status: JourneyStatus;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  maxExecutions: number | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  triggers: Array<{
    id: string;
    triggerType: JourneyTriggerType;
    eventName: string | null;
    enabled: boolean;
    config: unknown;
  }>;
  steps: Array<{
    id: string;
    name: string;
    sortOrder: number;
    enabled: boolean;
    conditions: unknown;
    actions: Array<{
      id: string;
      actionType: JourneyActionType;
      sortOrder: number;
      enabled: boolean;
      config: unknown;
    }>;
  }>;
}

export interface PagedJourneyResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
