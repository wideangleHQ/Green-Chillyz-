import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CoinLimitScope } from '@prisma/client';
import { COIN_ECONOMY_DEFAULTS } from '../constants';

export class CreateCoinLimitDto {
  @ApiPropertyOptional({
    description: 'Rule this limit caps; omit for a limit spanning every rule',
  })
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiProperty({ example: 'Daily coin ceiling' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CoinLimitScope })
  @IsEnum(CoinLimitScope)
  scope!: CoinLimitScope;

  @ApiPropertyOptional({ description: 'Coin ceiling within the scope' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCoins?: number;

  @ApiPropertyOptional({ description: 'Grant-count ceiling within the scope' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxClaims?: number;

  @ApiPropertyOptional({
    description: 'Rolling window override in seconds for non-calendar scopes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  windowSeconds?: number;

  @ApiPropertyOptional({ description: 'Restricts the limit to one store' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}

export class UpdateCoinLimitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CoinLimitScope })
  @IsOptional()
  @IsEnum(CoinLimitScope)
  scope?: CoinLimitScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxClaims?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  windowSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}

export class CoinLimitQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({ enum: CoinLimitScope })
  @IsOptional()
  @IsEnum(CoinLimitScope)
  scope?: CoinLimitScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: COIN_ECONOMY_DEFAULTS.PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
