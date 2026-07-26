import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditController } from './audit.controller';
import { AuditRepository } from './repositories';
import { AuditListener } from './listeners';
import {
  AuditService,
  AuditQueryService,
  AuditCacheService,
  AuditAnalyticsService,
} from './services';

/**
 * Audit & Activity Platform.
 *
 * Global so any module can inject AuditService for a direct record when an
 * event would be artificial — though the event-driven path via AuditListener
 * is the norm and keeps publishers decoupled.
 *
 * Adding a new audited area (orders, POS, kitchen, vendors, inventory) means
 * emitting an event and adding a handler here — no schema or service changes.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [
    AuditRepository,
    AuditCacheService,
    AuditService,
    AuditQueryService,
    AuditAnalyticsService,
    AuditListener,
  ],
  exports: [AuditService, AuditQueryService],
})
export class AuditModule {}
