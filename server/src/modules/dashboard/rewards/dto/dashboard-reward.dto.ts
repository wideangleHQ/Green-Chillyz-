import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RedemptionStatus } from '@prisma/client';
import { PaginationDto } from '../../../../common/dto';

export class DashboardRedemptionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RedemptionStatus })
  @IsEnum(RedemptionStatus)
  @IsOptional()
  status?: RedemptionStatus;
}
