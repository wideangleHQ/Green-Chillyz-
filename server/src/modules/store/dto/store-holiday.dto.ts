import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateStoreHolidayDto {
  @ApiProperty({ example: '2026-12-25' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'Christmas' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}

export class UpdateStoreHolidayDto {
  @ApiPropertyOptional({ example: 'Christmas Holiday' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}
