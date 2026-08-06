import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto, SortOrder } from '../../../../common/dto';

export const WALLET_SORT_FIELDS = [
  'balance',
  'lifetimeEarned',
  'lifetimeSpent',
  'updatedAt',
] as const;
export type WalletSortField = (typeof WALLET_SORT_FIELDS)[number];

export class DashboardWalletQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Free-text search: customer name, email or phone',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: WALLET_SORT_FIELDS, default: 'updatedAt' })
  @IsIn(WALLET_SORT_FIELDS)
  @IsOptional()
  sortBy: WalletSortField = 'updatedAt';

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsIn(Object.values(SortOrder))
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;
}
