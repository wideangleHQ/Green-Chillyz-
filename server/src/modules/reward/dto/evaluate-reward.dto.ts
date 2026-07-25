import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardEventType, RewardSourceType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class EvaluateRewardDto {
  @ApiProperty({ enum: RewardEventType })
  @IsEnum(RewardEventType)
  eventType!: RewardEventType;

  @ApiProperty({ description: 'User ID to evaluate reward for' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: RewardSourceType })
  @IsEnum(RewardSourceType)
  source!: RewardSourceType;

  @ApiPropertyOptional({ description: 'Reference ID (e.g. order ID, game ID)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type (e.g. ORDER, GAME)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Store ID for store-specific campaigns' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Brand ID for brand-specific campaigns' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Purchase amount for cashback calculations' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  purchaseAmount?: number;

  @ApiPropertyOptional({ description: 'Additional event metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
