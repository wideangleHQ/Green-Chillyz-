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
import { Type } from 'class-transformer';
import { RuleRewardType, RewardOverrideStatus } from '@prisma/client';

export class CreateRewardOverrideDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  storeId!: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  ruleId!: string;

  @ApiProperty({ enum: RuleRewardType })
  @IsEnum(RuleRewardType)
  overrideRewardType!: RuleRewardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overrideRewardRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overrideCoinReq?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overrideDisplayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  overridePriority?: number;

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

export class UpdateRewardOverrideDto {
  @ApiPropertyOptional({ enum: RuleRewardType })
  @IsOptional()
  @IsEnum(RuleRewardType)
  overrideRewardType?: RuleRewardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overrideRewardRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overrideCoinReq?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overrideDisplayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  overridePriority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ enum: RewardOverrideStatus })
  @IsOptional()
  @IsEnum(RewardOverrideStatus)
  status?: RewardOverrideStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class RewardOverrideQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({ enum: RewardOverrideStatus })
  @IsOptional()
  @IsEnum(RewardOverrideStatus)
  status?: RewardOverrideStatus;

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
