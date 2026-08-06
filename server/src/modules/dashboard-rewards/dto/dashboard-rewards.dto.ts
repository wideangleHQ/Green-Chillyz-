import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  RewardProfileStatus,
  RewardProfileType,
  RewardRuleStatus,
  RewardRuleType,
  RuleRewardType,
  RewardOverrideStatus,
  RewardAssignmentType,
} from '@prisma/client';

// ── Profile DTOs ───────────────────────────────────────

export class DashboardCreateProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RewardProfileType, default: 'STANDARD' })
  @IsOptional()
  @IsEnum(RewardProfileType)
  type?: RewardProfileType;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class DashboardUpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  metadata?: Record<string, unknown>;
}

export class DashboardDuplicateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class DashboardPublishProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeReason?: string;
}

export class DashboardProfileQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

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
}

// ── Rule DTOs ──────────────────────────────────────────

export class DashboardCreateRuleDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  profileId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RewardRuleType, default: 'COIN_MILESTONE' })
  @IsOptional()
  @IsEnum(RewardRuleType)
  ruleType?: RewardRuleType;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coinRequirement!: number;

  @ApiProperty({ enum: RuleRewardType })
  @IsEnum(RuleRewardType)
  rewardType!: RuleRewardType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rewardReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class DashboardUpdateRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
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
  rewardReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

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
}

export class DashboardBulkUpdateRulesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  ruleIds!: string[];

  @ApiPropertyOptional({ enum: RewardRuleStatus })
  @IsOptional()
  @IsEnum(RewardRuleStatus)
  status?: RewardRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;
}

export class DashboardDuplicateRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class DashboardRuleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @ApiPropertyOptional({ enum: RewardRuleStatus })
  @IsOptional()
  @IsEnum(RewardRuleStatus)
  status?: RewardRuleStatus;

  @ApiPropertyOptional({ enum: RewardRuleType })
  @IsOptional()
  @IsEnum(RewardRuleType)
  ruleType?: RewardRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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

// ── Assignment DTOs ────────────────────────────────────

export class DashboardAssignProfileDto {
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
}

export class DashboardChangeAssignmentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  profileId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DashboardBulkAssignDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  storeIds!: string[];

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  profileId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// ── Override DTOs ──────────────────────────────────────

export class DashboardCreateOverrideDto {
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
}

export class DashboardUpdateOverrideDto {
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
}

export class DashboardBulkOverrideDto {
  @ApiProperty({ type: () => [DashboardCreateOverrideDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardCreateOverrideDto)
  overrides!: DashboardCreateOverrideDto[];
}

// ── Search DTO ─────────────────────────────────────────

export class DashboardRewardSearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query!: string;

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
