import { ApiPropertyOptional } from '@nestjs/swagger';
import { RewardEventType, RewardSourceType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class RewardHistoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RewardEventType })
  @IsEnum(RewardEventType)
  @IsOptional()
  eventType?: RewardEventType;

  @ApiPropertyOptional({ enum: RewardSourceType })
  @IsEnum(RewardSourceType)
  @IsOptional()
  source?: RewardSourceType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
