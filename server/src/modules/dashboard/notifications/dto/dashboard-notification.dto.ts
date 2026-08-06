import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { PaginationDto } from '../../../../common/dto';

export class DashboardNotificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'From date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
