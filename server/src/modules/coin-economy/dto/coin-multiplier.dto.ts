import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CoinMultiplierStatus, CoinMultiplierType, CoinRuleType } from '@prisma/client';
import { COIN_ECONOMY_DEFAULTS } from '../constants';

export class CreateCoinMultiplierDto {
  @ApiProperty({ example: 'Weekend 2x' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CoinMultiplierType, default: CoinMultiplierType.FLAT })
  @IsOptional()
  @IsEnum(CoinMultiplierType)
  type?: CoinMultiplierType;

  @ApiProperty({ example: 2, description: 'Factor applied to base coins' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(COIN_ECONOMY_DEFAULTS.MAX_MULTIPLIER)
  multiplier!: number;

  @ApiPropertyOptional({ description: 'Scopes the multiplier to one rule' })
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({ enum: CoinRuleType, description: 'Scopes to a rule type' })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;

  @ApiPropertyOptional({ description: 'Scopes the multiplier to one store' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'Reserved for the Campaign Engine; not resolved yet',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaignReference?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: '0 (Sunday) to 6 (Saturday); empty applies every day',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    default: false,
    description: 'Stackable multipliers compound; otherwise the highest wins',
  })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: CoinMultiplierStatus, default: CoinMultiplierStatus.DRAFT })
  @IsOptional()
  @IsEnum(CoinMultiplierStatus)
  status?: CoinMultiplierStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}

export class UpdateCoinMultiplierDto {
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

  @ApiPropertyOptional({ enum: CoinMultiplierType })
  @IsOptional()
  @IsEnum(CoinMultiplierType)
  type?: CoinMultiplierType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(COIN_ECONOMY_DEFAULTS.MAX_MULTIPLIER)
  multiplier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({ enum: CoinRuleType })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaignReference?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: CoinMultiplierStatus })
  @IsOptional()
  @IsEnum(CoinMultiplierStatus)
  status?: CoinMultiplierStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}

export class CoinMultiplierQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({ enum: CoinRuleType })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ enum: CoinMultiplierType })
  @IsOptional()
  @IsEnum(CoinMultiplierType)
  type?: CoinMultiplierType;

  @ApiPropertyOptional({ enum: CoinMultiplierStatus })
  @IsOptional()
  @IsEnum(CoinMultiplierStatus)
  status?: CoinMultiplierStatus;

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
}
