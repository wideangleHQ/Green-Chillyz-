import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuditQueryService, AuditAnalyticsService } from './services';
import {
  AuditQueryDto,
  AuditSearchDto,
  AuditAnalyticsQueryDto,
  AuditCursorDto,
  EntityTimelineDto,
} from './dto';
import { AUDIT_PERMISSIONS } from './constants';

/**
 * Read-only surface over the audit trail, for the future dashboard.
 *
 * There is intentionally no POST, PATCH, PUT or DELETE here — audit records
 * are written only by the listener in response to domain events, and are
 * never modified. Every route requires an explicit audit permission.
 */
@ApiTags('Audit & Activity')
@Controller({ path: 'audit', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(
    private readonly queryService: AuditQueryService,
    private readonly analyticsService: AuditAnalyticsService,
  ) {}

  @Get()
  @Permissions(AUDIT_PERMISSIONS.VIEW)
  @ApiOperation({
    summary: 'Query the audit timeline',
    description:
      'Cursor-paginated. Filter by date range, store, actor, role, entity, severity, action and event type.',
  })
  async query(@Query() dto: AuditQueryDto) {
    return this.queryService.query(dto);
  }

  @Get('recent')
  @Permissions(AUDIT_PERMISSIONS.VIEW)
  @ApiOperation({
    summary: 'Recent activity feed',
    description: 'Small cached payload for a dashboard activity widget.',
  })
  async recent() {
    return this.queryService.recent();
  }

  @Get('search')
  @Permissions(AUDIT_PERMISSIONS.SEARCH)
  @ApiOperation({
    summary: 'Search the audit trail',
    description:
      'Matches entity ID, voucher code, correlation ID, request ID and indexed metadata fields.',
  })
  async search(@Query() dto: AuditSearchDto) {
    return this.queryService.search(dto);
  }

  @Get('analytics')
  @Permissions(AUDIT_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({
    summary: 'Audit analytics',
    description:
      'Most frequent actions and events, employee and store activity, severity and actor breakdowns.',
  })
  async analytics(@Query() dto: AuditAnalyticsQueryDto) {
    return this.analyticsService.getAnalytics(dto);
  }

  @Get('fraud-indicators')
  @Permissions(AUDIT_PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({
    summary: 'Fraud review signals',
    description:
      'Manual balance adjustments and customer lookups by actor, plus critical events. Signals for human review, not automated judgements.',
  })
  async fraudIndicators(@Query() dto: AuditAnalyticsQueryDto) {
    return this.analyticsService.getFraudIndicators(dto);
  }

  @Get('entity')
  @Permissions(AUDIT_PERMISSIONS.VIEW)
  @ApiOperation({
    summary: 'Full trail for one entity',
    description: 'Every recorded action against a given entity, newest first.',
  })
  async entityTimeline(@Query() dto: EntityTimelineDto) {
    return this.queryService.entityTimeline(dto);
  }

  @Get('user/:userId')
  @Permissions(AUDIT_PERMISSIONS.VIEW_ALL)
  @ApiOperation({ summary: 'Customer activity timeline' })
  async userTimeline(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() dto: AuditCursorDto,
  ) {
    return this.queryService.userTimeline(userId, dto);
  }

  @Get('employee/:employeeId')
  @Permissions(AUDIT_PERMISSIONS.VIEW_ALL)
  @ApiOperation({ summary: 'Employee activity timeline' })
  async employeeTimeline(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query() dto: AuditCursorDto,
  ) {
    return this.queryService.employeeTimeline(employeeId, dto);
  }

  @Get('store/:storeId')
  @Permissions(AUDIT_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'Store activity timeline' })
  async storeTimeline(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() dto: AuditCursorDto,
  ) {
    return this.queryService.storeTimeline(storeId, dto);
  }

  @Get(':id')
  @Permissions(AUDIT_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'Get a single audit record' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryService.getById(id);
  }
}
