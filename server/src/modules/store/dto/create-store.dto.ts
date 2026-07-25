import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'uuid-of-brand' })
  @IsUUID()
  @IsNotEmpty()
  brandId!: string;

  @ApiProperty({ example: 'GreenChillyz Indiranagar' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'GC-BLR-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiPropertyOptional({ example: 'Our flagship restaurant in the heart of Indiranagar' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Flagship outlet with rooftop seating' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'indiranagar@greenchillyz.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'Invalid phone number format' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: 'https://greenchillyz.com/indiranagar' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  website?: string;

  @ApiProperty({ example: '12th Main Road, HAL 2nd Stage' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Indiranagar' })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  addressLine2?: string;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ example: '560038' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  postalCode!: string;

  @ApiProperty({ example: 12.9716 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 77.5946 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=12.9716,77.5946' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  googleMapsLink?: string;

  @ApiPropertyOptional({ example: 'ChIJbU60yXAWrjsR4E9onFGG1MI' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  placeId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  supportsDelivery?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  supportsTakeaway?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  supportsDineIn?: boolean;
}
