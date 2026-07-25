import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRuleDto {
  @ApiProperty({ description: 'Campaign to attach this rule to' })
  @IsUUID()
  @IsNotEmpty()
  campaignId!: string;

  @ApiProperty({ description: 'Rule type (e.g. DAILY_LIMIT, MIN_PURCHASE)', example: 'DAILY_LIMIT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ruleType!: string;

  @ApiProperty({ description: 'Rule operator (e.g. GREATER_THAN, EQUALS)', example: 'LESS_THAN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  operator!: string;

  @ApiProperty({ description: 'Rule value', example: '5' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value!: string;

  @ApiPropertyOptional({ description: 'Evaluation priority (lower = first)', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;
}
