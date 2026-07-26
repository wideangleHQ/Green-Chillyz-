import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  RewardType,
  RewardStatus,
  RewardAvailability,
  VoucherStatus,
} from '@prisma/client';
import { PaginationDto } from '../../../common/dto';
import { REWARDS_SORT } from '../constants';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateRewardCategoryDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'URL-safe unique slug', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(SLUG_PATTERN, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateRewardCategoryDto extends PartialType(
  OmitType(CreateRewardCategoryDto, ['slug'] as const),
) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateRewardDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'URL-safe unique slug', maxLength: 220 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  @Matches(SLUG_PATTERN, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bannerImage?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ description: 'Coins required to redeem', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  coinCost!: number;

  @ApiPropertyOptional({ description: 'Cash equivalent (future compatibility)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  cashAmount?: number;

  @ApiPropertyOptional({ enum: RewardType, default: RewardType.FREE_ITEM })
  @IsEnum(RewardType)
  @IsOptional()
  rewardType?: RewardType;

  @ApiPropertyOptional({ enum: RewardAvailability, default: RewardAvailability.GLOBAL })
  @IsEnum(RewardAvailability)
  @IsOptional()
  availability?: RewardAvailability;

  @ApiPropertyOptional({ enum: RewardStatus, default: RewardStatus.DRAFT })
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Total stock; null means unlimited', minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'Max redemptions per day across all users', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  dailyLimit?: number;

  @ApiPropertyOptional({ description: 'Max redemptions per user', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  userLimit?: number;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  minimumLoyaltyTier?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Campaign-specific availability' })
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Days a generated voucher stays valid', default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  voucherValidDays?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid', description: 'Stores this reward is available at' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  storeIds?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateRewardDto extends PartialType(
  OmitType(CreateRewardDto, ['slug'] as const),
) {}

export class RewardQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Free-text search across title and description' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Only rewards redeemable at this store' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ enum: RewardType })
  @IsEnum(RewardType)
  @IsOptional()
  rewardType?: RewardType;

  @ApiPropertyOptional({ description: 'Only rewards the user can currently afford' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  affordableOnly?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxCoinCost?: number;

  @ApiPropertyOptional({ default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  featuredOnly?: boolean;

  @ApiPropertyOptional({
    enum: Object.values(REWARDS_SORT),
    default: REWARDS_SORT.PRIORITY,
  })
  @IsEnum(REWARDS_SORT)
  @IsOptional()
  sort?: (typeof REWARDS_SORT)[keyof typeof REWARDS_SORT];
}

export class AdminRewardQueryDto extends RewardQueryDto {
  @ApiPropertyOptional({ enum: RewardStatus })
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;
}

export class RedeemRewardDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Store to collect the reward from; defaults to the user assigned store',
  })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({
    maxLength: 255,
    description:
      'Client-supplied key that makes retries safe. Omit and the server derives one.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  idempotencyKey?: string;
}

export class VoucherQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: VoucherStatus })
  @IsEnum(VoucherStatus)
  @IsOptional()
  status?: VoucherStatus;
}

export class VerifyVoucherDto {
  @ApiProperty({ description: 'Voucher code from the QR payload' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string;

  @ApiProperty({ description: 'Signature from the QR payload' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  signature!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Store performing the scan' })
  @IsUUID()
  @IsOptional()
  storeId?: string;
}

export class TrackRewardEventDto {
  @ApiProperty({ description: 'Analytics event name, e.g. REWARD_CLICK' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  eventType!: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
