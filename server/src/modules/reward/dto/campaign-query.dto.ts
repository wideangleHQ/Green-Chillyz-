import { ApiPropertyOptional } from '@nestjs/swagger';
import { RewardEventType, CampaignStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class CampaignQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RewardEventType })
  @IsEnum(RewardEventType)
  @IsOptional()
  eventType?: RewardEventType;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;
}
