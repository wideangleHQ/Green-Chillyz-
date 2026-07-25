import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class StoreTimingItemDto {
  @ApiProperty({ enum: DayOfWeek, example: 'MONDAY' })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'opensAt must be in HH:mm format' })
  opensAt!: string;

  @ApiProperty({ example: '22:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closesAt must be in HH:mm format' })
  closesAt!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}

export class BulkStoreTimingDto {
  @ApiProperty({ type: [StoreTimingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreTimingItemDto)
  timings!: StoreTimingItemDto[];
}

export class UpdateStoreTimingDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'opensAt must be in HH:mm format' })
  opensAt?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closesAt must be in HH:mm format' })
  closesAt?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}
