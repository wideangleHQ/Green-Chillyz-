import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from '../repositories';
import { AuditCacheService } from './audit-cache.service';
import { AuditRecordInput, AuditLogResponse } from '../interfaces';

/**
 * Write side of the audit platform.
 *
 * Exposes only `record` — there is no update or delete anywhere in the module,
 * which is what makes the trail immutable. Recording never throws into the
 * caller: an audit failure must not roll back the business action it describes.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly repository: AuditRepository,
    private readonly cache: AuditCacheService,
  ) {}

  /**
   * Append an audit record. Returns null when the event was a duplicate or
   * the write failed — callers treat audit as fire-and-forget.
   */
  async record(input: AuditRecordInput): Promise<AuditLogResponse | null> {
    try {
      const row = await this.repository.append(input);

      if (row) {
        await this.cache.invalidateOnAppend(input.entityType, input.entityId);
      }

      return row;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Logged loudly: a gap in the audit trail is itself worth investigating.
      this.logger.error(
        `Failed to record audit ${input.eventType}/${input.action} for entity ${input.entityType}:${input.entityId ?? '-'}: ${message}`,
      );
      return null;
    }
  }
}
