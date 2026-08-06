import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { RewardRuleStatus, RewardRuleType, RuleRewardType } from '@prisma/client';

export class CreateRewardRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  profileId!: string;

  @ApiProperty({ example: '100 Coins Reward' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RewardRuleType, default: 'COIN_MILESTONE' })
  @IsOptional()
  @IsEnum(RewardRuleType)
  ruleType?: RewardRuleType;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  coinRequirement!: number;

  @ApiProperty({ enum: RuleRewardType })
  @IsEnum(RuleRewardType)
  rewardType!: RuleRewardType;

  @ApiPropertyOptional({ example: 'menu-item-uuid or voucher-uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rewardReference?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: RewardRuleStatus, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(RewardRuleStatus)
  status?: RewardRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateRewardRuleDto {
  @ApiPropertyOptional({ example: 'Updated Rule Name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RewardRuleType })
  @IsOptional()
  @IsEnum(RewardRuleType)
  ruleType?: RewardRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  coinRequirement?: number;

  @ApiPropertyOptional({ enum: RuleRewardType })
  @IsOptional()
  @IsEnum(RuleRewardType)
  rewardType?: RuleRewardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rewardReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: RewardRuleStatus })
  @IsOptional()
  @IsEnum(RewardRuleStatus)
  status?: RewardRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class DuplicateRewardRuleDto {
  @ApiPropertyOptional({ example: 'Copied Rule Name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class RewardRuleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiPropertyOptional({ enum: RewardRuleStatus })
  @IsOptional()
  @IsEnum(RewardRuleStatus)
  status?: RewardRuleStatus;

  @ApiPropertyOptional({ enum: RewardRuleType })
  @IsOptional()
  @IsEnum(RewardRuleType)
  ruleType?: RewardRuleType;

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
