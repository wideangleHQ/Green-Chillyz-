import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardEventType, RewardSourceType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Double Coins Weekend' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'double-coins-weekend' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  slug!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: RewardEventType })
  @IsEnum(RewardEventType)
  eventType!: RewardEventType;

  @ApiProperty({ enum: RewardSourceType })
  @IsEnum(RewardSourceType)
  source!: RewardSourceType;

  @ApiProperty({ description: 'Base coins to reward', minimum: 0 })
  @IsInt()
  @Min(0)
  baseCoins!: number;

  @ApiPropertyOptional({ description: 'Reward multiplier', default: 1.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  @IsOptional()
  multiplier?: number;

  @ApiPropertyOptional({ description: 'Bonus coins on top of base', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  bonusCoins?: number;

  @ApiPropertyOptional({ description: 'Maximum number of claims per user' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxClaims?: number;

  @ApiPropertyOptional({ description: 'Daily claim limit per user' })
  @IsInt()
  @Min(1)
  @IsOptional()
  dailyLimit?: number;

  @ApiPropertyOptional({ description: 'Total campaign budget in coins' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  totalBudget?: number;

  @ApiPropertyOptional({ description: 'Days until earned coins expire' })
  @IsInt()
  @Min(1)
  @IsOptional()
  coinExpiryDays?: number;

  @ApiPropertyOptional({ description: 'Eligible store UUIDs', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  storeIds?: string[];

  @ApiPropertyOptional({ description: 'Eligible brand UUIDs', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  brandIds?: string[];

  @ApiPropertyOptional({ description: 'Minimum purchase amount for eligibility' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minPurchase?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Campaign start date (ISO 8601)' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'Campaign end date (ISO 8601)' })
  @IsDateString()
  endsAt!: string;
}
