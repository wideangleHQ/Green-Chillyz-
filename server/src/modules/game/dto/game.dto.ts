import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsUUID,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateGameDto {
  @ApiProperty({ example: 'Spin Wheel' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'spin-wheel' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ example: 'Spin the wheel to win daily coins' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Max plays per day. 0 = unlimited' })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 86400, description: 'Cooldown period in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cooldown?: number;

  @ApiPropertyOptional({ example: 1, description: 'Minimum user level required' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minLevel?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRewards?: number;

  @ApiPropertyOptional({ example: 'COINS' })
  @IsOptional()
  @IsString()
  rewardType?: string;

  @ApiPropertyOptional({ description: 'Configuration for game rewards (slices, odds, etc.)' })
  @IsOptional()
  @IsObject()
  rewardConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: [], description: 'List of store IDs eligible for this game' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  storeEligibility?: string[];

  @ApiPropertyOptional({ example: [], description: 'List of reward campaigns eligible for this game' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  campaignEligibility?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateGameDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  cooldown?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRewards?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rewardType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rewardConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  storeEligibility?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  campaignEligibility?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class StartGameSessionDto {
  @ApiProperty({ example: 'spin-wheel' })
  @IsString()
  gameSlug!: string;

  @ApiPropertyOptional({ description: 'Optional client data or parameters needed to start the game' })
  @IsOptional()
  @IsObject()
  clientData?: Record<string, any>;
}

export class EndGameSessionDto {
  @ApiProperty({ example: 'session-uuid-123' })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ description: 'Game outcome details sent by the frontend (e.g. chosen slice, score)' })
  @IsObject()
  clientData!: Record<string, any>;
}

export class GameQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search term for name or slug' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class GameSessionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by game ID' })
  @IsOptional()
  @IsUUID()
  gameId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}
