import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeRuleType } from '../enums';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsUUID,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';

export class CreateChallengeRuleDto {
  @ApiProperty() @IsUUID() challengeId!: string;
  @ApiProperty({ enum: ChallengeRuleType }) @IsEnum(ChallengeRuleType) ruleType!: ChallengeRuleType;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() targetCount?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() targetAmount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(100) gameSlug?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() storeId?: string;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() metadata?: Record<string, unknown>;
}

export class UpdateChallengeRuleDto {
  @ApiPropertyOptional({ enum: ChallengeRuleType }) @IsEnum(ChallengeRuleType) @IsOptional() ruleType?: ChallengeRuleType;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() targetCount?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() targetAmount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(100) gameSlug?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() storeId?: string;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() metadata?: Record<string, unknown>;
}
