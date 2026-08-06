import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { RewardAssignmentStatus, RewardAssignmentType } from '@prisma/client';

export class CreateRewardAssignmentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  storeId!: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  profileId!: string;

  @ApiPropertyOptional({ enum: RewardAssignmentType, default: 'STORE' })
  @IsOptional()
  @IsEnum(RewardAssignmentType)
  assignmentType?: RewardAssignmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateRewardAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ enum: RewardAssignmentType })
  @IsOptional()
  @IsEnum(RewardAssignmentType)
  assignmentType?: RewardAssignmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ChangeAssignmentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  profileId!: string;

  @ApiPropertyOptional({ enum: RewardAssignmentType, default: 'STORE' })
  @IsOptional()
  @IsEnum(RewardAssignmentType)
  assignmentType?: RewardAssignmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RewardAssignmentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @ApiPropertyOptional({ enum: RewardAssignmentStatus })
  @IsOptional()
  @IsEnum(RewardAssignmentStatus)
  status?: RewardAssignmentStatus;

  @ApiPropertyOptional({ enum: RewardAssignmentType })
  @IsOptional()
  @IsEnum(RewardAssignmentType)
  assignmentType?: RewardAssignmentType;

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
