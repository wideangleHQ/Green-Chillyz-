import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StoreVoucherType, StoreVoucherStatus } from '@prisma/client';
import { PaginationDto } from '../../../../common/dto';

export class CreateStoreVoucherDto {
  @ApiProperty({ description: 'Voucher display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Short title for cards/badges' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortTitle?: string;

  @ApiPropertyOptional({ description: 'Full description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Offer tag label', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  offerTag?: string;

  @ApiPropertyOptional({ description: 'Discount badge text', maxLength: 30 })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  discountBadge?: string;

  @ApiPropertyOptional({ description: 'Offer image URL' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  offerImage?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bannerImage?: string;

  @ApiPropertyOptional({
    description: 'Custom coupon code (auto-generated if omitted)',
    maxLength: 32,
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  couponCode?: string;

  @ApiProperty({ enum: StoreVoucherType })
  @IsEnum(StoreVoucherType)
  voucherType!: StoreVoucherType;

  @ApiPropertyOptional({ description: 'Minimum order value to apply' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minimumOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum discount cap' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maximumDiscount?: number;

  @ApiPropertyOptional({ description: 'Voucher value (percentage or flat amount)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  voucherValue?: number;

  @ApiPropertyOptional({ description: 'Items included (free item / combo details)' })
  @IsString()
  @IsOptional()
  itemsIncluded?: string;

  @ApiPropertyOptional({ description: 'Where the voucher can be redeemed' })
  @IsString()
  @IsOptional()
  redeemVenue?: string;

  @ApiPropertyOptional({
    description: 'Days of the week the voucher is valid',
    type: [String],
    example: ['MONDAY', 'TUESDAY'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  validDays?: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Valid time range (e.g. "11:00-14:00")',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  validTime?: string;

  @ApiPropertyOptional({ description: 'Total redemption limit', default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  totalLimit?: number;

  @ApiPropertyOptional({ description: 'Mark as featured' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Priority for ordering' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Terms and conditions',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  terms?: string[];

  @ApiPropertyOptional({
    description: 'Initial status (defaults to ACTIVE)',
    enum: StoreVoucherStatus,
  })
  @IsEnum(StoreVoucherStatus)
  @IsOptional()
  status?: StoreVoucherStatus;

  @ApiPropertyOptional({ description: 'Arbitrary metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateStoreVoucherDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  offerTag?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  discountBadge?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  offerImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bannerImage?: string;

  @ApiPropertyOptional({ enum: StoreVoucherType })
  @IsEnum(StoreVoucherType)
  @IsOptional()
  voucherType?: StoreVoucherType;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minimumOrderValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maximumDiscount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  voucherValue?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itemsIncluded?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  redeemVenue?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  validDays?: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  validTime?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  totalLimit?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  terms?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class StoreVoucherQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name or coupon code' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: StoreVoucherStatus })
  @IsEnum(StoreVoucherStatus)
  @IsOptional()
  status?: StoreVoucherStatus;

  @ApiPropertyOptional({ description: 'Filter by offer tag' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tag?: string;

  @ApiPropertyOptional({ description: 'From date (ISO)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}

export class RedeemStoreVoucherDto {
  @ApiProperty({ description: 'Coupon code to redeem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  couponCode!: string;
}
