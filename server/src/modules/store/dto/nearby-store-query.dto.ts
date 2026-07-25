import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsOptional, IsInt, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_SEARCH_RADIUS_KM, MAX_SEARCH_RADIUS_KM } from '../constants';

export class NearbyStoreQueryDto {
  @ApiProperty({ example: 20.2961, description: 'User latitude (-90 to 90)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 85.8245, description: 'User longitude (-180 to 180)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 10, default: DEFAULT_SEARCH_RADIUS_KM })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(MAX_SEARCH_RADIUS_KM)
  @IsOptional()
  radius?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by brand UUID' })
  @IsUUID()
  @IsOptional()
  brandId?: string;
}
