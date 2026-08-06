import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeRuleType } from '../enums';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RecordProgressDto {
  @ApiProperty() @IsUUID() challengeId!: string;
  @ApiPropertyOptional({ enum: ChallengeRuleType }) @IsEnum(ChallengeRuleType) @IsOptional() ruleType?: ChallengeRuleType;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() incrementBy?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() amount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() storeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() gameSlug?: string;
}

export class ClaimRewardDto {
  @ApiProperty() @IsUUID() challengeId!: string;
}

export class CustomerChallengeQueryDto {
  @ApiPropertyOptional() @IsString() @IsOptional() storeId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean;
  @ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @IsOptional() pageSize?: number;
}
