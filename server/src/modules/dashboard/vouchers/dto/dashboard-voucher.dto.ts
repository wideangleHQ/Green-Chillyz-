import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VoucherStatus } from '@prisma/client';
import { PaginationDto } from '../../../../common/dto';

export class DashboardVoucherQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: VoucherStatus })
  @IsEnum(VoucherStatus)
  @IsOptional()
  status?: VoucherStatus;

  @ApiPropertyOptional({ description: 'Exact voucher code' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  code?: string;
}

/**
 * Redemption request from a store scan. The redeeming store is always the
 * authenticated principal — it is never accepted from the request body.
 */
export class DashboardRedeemVoucherDto {
  @ApiProperty({ description: 'Voucher code from the QR payload' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  code!: string;

  @ApiProperty({ description: 'Signature from the QR payload' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  signature!: string;
}
