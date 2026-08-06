import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto, SortOrder } from '../../../../common/dto';
import {
  DASHBOARD_ACTIVITY_DEFAULT_LIMIT,
  DASHBOARD_ACTIVITY_MAX_LIMIT,
} from '../../common/constants';

export const CUSTOMER_SORT_FIELDS = [
  'createdAt',
  'fullName',
  'lastLoginAt',
] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export class DashboardCustomerQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Free-text search: name, email, username, phone, customer id (UUID) or voucher code',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_SORT_FIELDS, default: 'createdAt' })
  @IsIn(CUSTOMER_SORT_FIELDS)
  @IsOptional()
  sortBy: CustomerSortField = 'createdAt';

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsIn(Object.values(SortOrder))
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;
}

export class DashboardActivityQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: DASHBOARD_ACTIVITY_MAX_LIMIT,
    default: DASHBOARD_ACTIVITY_DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_ACTIVITY_MAX_LIMIT)
  @IsOptional()
  limit: number = DASHBOARD_ACTIVITY_DEFAULT_LIMIT;
}
