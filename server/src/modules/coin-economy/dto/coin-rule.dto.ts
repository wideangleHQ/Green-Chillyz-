import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CoinRuleStatus, CoinRuleType } from '@prisma/client';
import { COIN_ECONOMY_DEFAULTS } from '../constants';

export class CreateCoinRuleDto {
  @ApiProperty({ example: 'Daily Login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CoinRuleType })
  @IsEnum(CoinRuleType)
  ruleType!: CoinRuleType;

  @ApiProperty({ example: 5, description: 'Base coins awarded by this rule' })
  @IsInt()
  @Min(0)
  coinAmount!: number;

  @ApiPropertyOptional({ example: 5, description: 'Lower bound for ranged rules' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minCoins?: number;

  @ApiPropertyOptional({ example: 25, description: 'Upper bound for ranged rules' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCoins?: number;

  @ApiPropertyOptional({ description: 'Max coins earnable per calendar day' })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({ description: 'Max coins earnable per calendar week' })
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyLimit?: number;

  @ApiPropertyOptional({ description: 'Max coins earnable per calendar month' })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyLimit?: number;

  @ApiPropertyOptional({ description: 'Max coins earnable ever' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lifetimeLimit?: number;

  @ApiPropertyOptional({ default: 0, description: 'Seconds between grants' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cooldownSeconds?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ enum: CoinRuleStatus, default: CoinRuleStatus.DRAFT })
  @IsOptional()
  @IsEnum(CoinRuleStatus)
  status?: CoinRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateCoinRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CoinRuleType })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  coinAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  lifetimeLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  cooldownSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ enum: CoinRuleStatus })
  @IsOptional()
  @IsEnum(CoinRuleStatus)
  status?: CoinRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class DuplicateCoinRuleDto {
  @ApiPropertyOptional({ example: 'Daily Login (Copy)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    enum: CoinRuleType,
    description: 'Rule type for the copy; defaults to the source rule type',
  })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;
}

export class CoinRuleQueryDto {
  @ApiPropertyOptional({ enum: CoinRuleType })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;

  @ApiPropertyOptional({ enum: CoinRuleStatus })
  @IsOptional()
  @IsEnum(CoinRuleStatus)
  status?: CoinRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: COIN_ECONOMY_DEFAULTS.PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ description: 'Include soft-deleted rules' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived?: boolean;
}
