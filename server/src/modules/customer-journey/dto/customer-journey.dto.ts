import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  JourneyActionType,
  JourneyStatus,
  JourneyTriggerType,
  JourneyType,
} from '@prisma/client';

export class CreateJourneyTriggerDto {
  @ApiProperty({ enum: JourneyTriggerType })
  @IsEnum(JourneyTriggerType)
  triggerType!: JourneyTriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateJourneyActionDto {
  @ApiProperty({ enum: JourneyActionType })
  @IsEnum(JourneyActionType)
  actionType!: JourneyActionType;

  @ApiProperty()
  @IsObject()
  config!: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateJourneyStepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  conditions?: Record<string, unknown>[] | Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ type: [CreateJourneyActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJourneyActionDto)
  actions!: CreateJourneyActionDto[];
}

export class CreateJourneyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: JourneyType, default: JourneyType.CUSTOM })
  @IsOptional()
  @IsEnum(JourneyType)
  type?: JourneyType;

  @ApiPropertyOptional({ enum: JourneyStatus, default: JourneyStatus.DRAFT })
  @IsOptional()
  @IsEnum(JourneyStatus)
  status?: JourneyStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxExecutions?: number;

  @ApiProperty({ type: [CreateJourneyTriggerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJourneyTriggerDto)
  triggers!: CreateJourneyTriggerDto[];

  @ApiProperty({ type: [CreateJourneyStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJourneyStepDto)
  steps!: CreateJourneyStepDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateJourneyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: JourneyType })
  @IsOptional()
  @IsEnum(JourneyType)
  type?: JourneyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxExecutions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class DuplicateJourneyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;
}

export class JourneyQueryDto {
  @ApiPropertyOptional({ enum: JourneyType })
  @IsOptional()
  @IsEnum(JourneyType)
  type?: JourneyType;

  @ApiPropertyOptional({ enum: JourneyStatus })
  @IsOptional()
  @IsEnum(JourneyStatus)
  status?: JourneyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class TriggerJourneyDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: JourneyTriggerType })
  @IsEnum(JourneyTriggerType)
  triggerType!: JourneyTriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class SimulateJourneyDto extends TriggerJourneyDto {
  @ApiProperty()
  @IsUUID()
  journeyId!: string;
}
