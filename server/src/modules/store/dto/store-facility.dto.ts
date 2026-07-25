import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateStoreFacilityDto {
  @ApiProperty({ example: 'WiFi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'wifi' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;
}
