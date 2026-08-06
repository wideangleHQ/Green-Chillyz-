import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeType, ChallengeStatus } from '../enums';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  IsArray,
  IsUUID,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateChallengeDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(250) slug?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(300) shortDescription?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(500) image?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(100) icon?: string;
  @ApiPropertyOptional({ enum: ChallengeType }) @IsEnum(ChallengeType) @IsOptional() type?: ChallengeType;
  @ApiPropertyOptional({ enum: ChallengeStatus }) @IsEnum(ChallengeStatus) @IsOptional() status?: ChallengeStatus;
  @ApiPropertyOptional() @IsInt() @IsOptional() priority?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isFeatured?: boolean;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() maxParticipants?: number;
  @ApiProperty() @IsDateString() startsAt!: string;
  @ApiProperty() @IsDateString() endsAt!: string;
  @ApiPropertyOptional() @IsArray() @IsUUID('4', { each: true }) @IsOptional() storeIds?: string[];
  @ApiPropertyOptional() @IsArray() @IsUUID('4', { each: true }) @IsOptional() brandIds?: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(255) campaignRef?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() autoEnroll?: boolean;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() repeatableAfterDays?: number;
  @ApiPropertyOptional() @IsObject() @IsOptional() metadata?: Record<string, unknown>;
}

export class UpdateChallengeDto {
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(300) shortDescription?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(500) image?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(100) icon?: string;
  @ApiPropertyOptional({ enum: ChallengeType }) @IsEnum(ChallengeType) @IsOptional() type?: ChallengeType;
  @ApiPropertyOptional() @IsInt() @IsOptional() priority?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isFeatured?: boolean;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() maxParticipants?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() startsAt?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() endsAt?: string;
  @ApiPropertyOptional() @IsArray() @IsUUID('4', { each: true }) @IsOptional() storeIds?: string[];
  @ApiPropertyOptional() @IsArray() @IsUUID('4', { each: true }) @IsOptional() brandIds?: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(255) campaignRef?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() autoEnroll?: boolean;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() repeatableAfterDays?: number;
  @ApiPropertyOptional() @IsObject() @IsOptional() metadata?: Record<string, unknown>;
}

export class DuplicateChallengeDto {
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(200) name?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() startsAt?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() endsAt?: string;
}

export class ChallengeQueryDto {
  @ApiPropertyOptional({ enum: ChallengeType }) @IsEnum(ChallengeType) @IsOptional() type?: ChallengeType;
  @ApiPropertyOptional({ enum: ChallengeStatus }) @IsEnum(ChallengeStatus) @IsOptional() status?: ChallengeStatus;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) isFeatured?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) includeArchived?: boolean;
  @ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @IsOptional() pageSize?: number;
}
