import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class UpdateStoreGalleryDto {
  @ApiPropertyOptional({ example: 'Main dining area with ambient lighting' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}
