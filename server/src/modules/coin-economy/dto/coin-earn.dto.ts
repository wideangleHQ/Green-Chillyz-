import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CoinRuleType } from '@prisma/client';

/**
 * A request to earn coins. Either ruleType or ruleId identifies the rule;
 * the caller never states an amount unless it already rolled an outcome
 * (games do), and even then the rule's bounds clamp it.
 */
export class EarnCoinsDto {
  @ApiPropertyOptional({ enum: CoinRuleType })
  @IsOptional()
  @IsEnum(CoinRuleType)
  ruleType?: CoinRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Originating entity id (session, order, referral)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Originating entity kind' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Pre-rolled coin outcome; still clamped by the rule bounds',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  requestedCoins?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/** Same inputs as an earn, but resolves the decision without crediting. */
export class PreviewCoinsDto extends EarnCoinsDto {}

export class CustomerCoinQueryDto {
  @ApiPropertyOptional({ description: 'Store context for store-scoped rules' })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}
