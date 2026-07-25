import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionSource } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';

export class DebitWalletDto {
  @ApiProperty({ description: 'User ID to debit' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Amount to debit', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: TransactionSource })
  @IsEnum(TransactionSource)
  source!: TransactionSource;

  @ApiProperty({ description: 'Description of the transaction' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate debits' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g. order ID)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type (e.g. ORDER)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
