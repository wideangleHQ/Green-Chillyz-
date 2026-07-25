import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum StoreSortField {
  NAME = 'name',
  CITY = 'city',
  CREATED_AT = 'createdAt',
  AVERAGE_RATING = 'averageRating',
  TOTAL_REVIEWS = 'totalReviews',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class StoreQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Bangalore' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'uuid-of-brand' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ example: 'GreenChillyz' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  supportsDelivery?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  supportsTakeaway?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  supportsDineIn?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  openNow?: boolean;

  @ApiPropertyOptional({ example: 'Parking,WiFi' })
  @IsString()
  @IsOptional()
  facilities?: string;

  @ApiPropertyOptional({ example: 'green chillyz bangalore' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: StoreSortField, default: StoreSortField.CREATED_AT })
  @IsEnum(StoreSortField)
  @IsOptional()
  sortBy?: StoreSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ description: 'Cursor for cursor-based pagination' })
  @IsString()
  @IsOptional()
  cursor?: string;
}
