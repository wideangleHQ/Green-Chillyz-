import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { RewardProfileStatus, RewardProfileType } from '@prisma/client';

export class CreateRewardProfileDto {
  @ApiProperty({ example: 'Premium Rewards' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'premium-rewards' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RewardProfileType, default: 'STANDARD' })
  @IsOptional()
  @IsEnum(RewardProfileType)
  type?: RewardProfileType;

  @ApiPropertyOptional({ enum: RewardProfileStatus, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(RewardProfileStatus)
  status?: RewardProfileStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateRewardProfileDto {
  @ApiPropertyOptional({ example: 'Premium Rewards V2' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RewardProfileType })
  @IsOptional()
  @IsEnum(RewardProfileType)
  type?: RewardProfileType;

  @ApiPropertyOptional({ enum: RewardProfileStatus })
  @IsOptional()
  @IsEnum(RewardProfileStatus)
  status?: RewardProfileStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class DuplicateRewardProfileDto {
  @ApiPropertyOptional({ example: 'Premium Rewards Copy' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeReason?: string;
}

export class RewardProfileQueryDto {
  @ApiPropertyOptional({ enum: RewardProfileStatus })
  @IsOptional()
  @IsEnum(RewardProfileStatus)
  status?: RewardProfileStatus;

  @ApiPropertyOptional({ enum: RewardProfileType })
  @IsOptional()
  @IsEnum(RewardProfileType)
  type?: RewardProfileType;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}
