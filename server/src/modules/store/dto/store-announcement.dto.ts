import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { AnnouncementPriority } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';

export class CreateStoreAnnouncementDto {
  @ApiProperty({ example: 'Special Buffet This Weekend' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Join us for an unlimited buffet with live music' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-07-25T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-27T23:59:59.000Z' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ enum: AnnouncementPriority, default: AnnouncementPriority.MEDIUM })
  @IsEnum(AnnouncementPriority)
  @IsOptional()
  priority?: AnnouncementPriority;
}

export class UpdateStoreAnnouncementDto extends PartialType(CreateStoreAnnouncementDto) {}
