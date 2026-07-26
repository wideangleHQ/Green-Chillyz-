import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AuditActorType, AuditSeverity } from '@prisma/client';
import { AUDIT_DEFAULTS } from '../constants';

/**
 * Cursor-based paging. Audit tables are unbounded, so offsets are not offered.
 */
export class AuditCursorDto {
  @ApiPropertyOptional({
    description: 'Opaque cursor from the previous page (nextCursor)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: AUDIT_DEFAULTS.MAX_PAGE_SIZE,
    default: AUDIT_DEFAULTS.PAGE_SIZE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AUDIT_DEFAULTS.MAX_PAGE_SIZE)
  @IsOptional()
  limit: number = AUDIT_DEFAULTS.PAGE_SIZE;
}

export class AuditQueryDto extends AuditCursorDto {
  @ApiPropertyOptional({ description: 'ISO date; inclusive lower bound' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'ISO date; inclusive upper bound' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Acting or subject user' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Acting employee' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ enum: AuditActorType })
  @IsEnum(AuditActorType)
  @IsOptional()
  actorType?: AuditActorType;

  @ApiPropertyOptional({ description: 'Role name recorded on the action' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  actorRole?: string;

  @ApiPropertyOptional({ enum: AuditSeverity })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @ApiPropertyOptional({ description: 'e.g. WALLET, REWARD, VOUCHER, STORE' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Identifier of the audited entity' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  entityId?: string;

  @ApiPropertyOptional({ description: 'e.g. CREATE, UPDATE, REDEEM' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  action?: string;

  @ApiPropertyOptional({ description: 'e.g. wallet.credited' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  eventType?: string;
}

/**
 * Free-text lookup across the identifiers an investigator actually has:
 * an entity id, a voucher code, a correlation id or a request id.
 */
export class AuditSearchDto extends AuditCursorDto {
  @ApiProperty({
    description:
      'Entity ID, voucher code, correlation ID or request ID. Metadata is searched too.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  q!: string;

  @ApiPropertyOptional({ description: 'Narrow the search to one entity type' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  entityType?: string;
}

export class AuditAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'ISO date; inclusive lower bound' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'ISO date; inclusive upper bound' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Scope to one store' })
  @IsUUID()
  @IsOptional()
  storeId?: string;
}

export class EntityTimelineDto extends AuditCursorDto {
  @ApiProperty({ description: 'e.g. WALLET, REWARD, VOUCHER' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  entityType!: string;

  @ApiProperty({ description: 'Identifier of the audited entity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  entityId!: string;
}
