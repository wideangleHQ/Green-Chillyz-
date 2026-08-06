import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeRewardType } from '../enums';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsUUID,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';

export class CreateChallengeRewardDto {
  @ApiProperty() @IsUUID() challengeId!: string;
  @ApiProperty({ enum: ChallengeRewardType }) @IsEnum(ChallengeRewardType) rewardType!: ChallengeRewardType;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() coinAmount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(500) rewardReference?: string;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() quantity?: number;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() metadata?: Record<string, unknown>;
}

export class UpdateChallengeRewardDto {
  @ApiPropertyOptional({ enum: ChallengeRewardType }) @IsEnum(ChallengeRewardType) @IsOptional() rewardType?: ChallengeRewardType;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() coinAmount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() @MaxLength(500) rewardReference?: string;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() quantity?: number;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() metadata?: Record<string, unknown>;
}
