import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionSource, TransactionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class TransactionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionSource })
  @IsEnum(TransactionSource)
  @IsOptional()
  source?: TransactionSource;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
