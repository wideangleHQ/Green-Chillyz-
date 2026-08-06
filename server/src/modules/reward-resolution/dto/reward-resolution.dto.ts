import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RuleRewardType, RewardRuleType } from '@prisma/client';

export class CampaignContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  purchaseAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class StoreContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;
}

export class ResolveRewardDto {
  @ApiProperty({ description: 'Customer UUID' })
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty({ description: 'Store UUID' })
  @IsNotEmpty()
  @IsString()
  storeId!: string;

  @ApiPropertyOptional({ enum: RuleRewardType })
  @IsOptional()
  @IsEnum(RuleRewardType)
  rewardType?: RuleRewardType;

  @ApiPropertyOptional({ enum: RewardRuleType })
  @IsOptional()
  @IsEnum(RewardRuleType)
  ruleType?: RewardRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  walletBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  coinBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignContextDto)
  campaignContext?: CampaignContextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreContextDto)
  storeContext?: StoreContextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip?: string;

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
  metadata?: Record<string, unknown>;
}

export class PreviewRewardDto extends ResolveRewardDto {}

export class ResolveCoinsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ruleType?: string;

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
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip?: string;
}

export class ResolveMilestoneDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  coinBalance?: number;
}

export class ResolveVoucherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId!: string;

  @ApiProperty({ description: 'Reward rule ID to resolve voucher for' })
  @IsNotEmpty()
  @IsString()
  ruleId!: string;
}

export class ResolveCampaignRewardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CampaignContextDto)
  campaignContext!: CampaignContextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip?: string;
}

export class ResolveStoreRewardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId!: string;

  @ApiPropertyOptional({ enum: RuleRewardType })
  @IsOptional()
  @IsEnum(RuleRewardType)
  rewardType?: RuleRewardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  coinBalance?: number;
}

export class CustomerSummaryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId!: string;
}
