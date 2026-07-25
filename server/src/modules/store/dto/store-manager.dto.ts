import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { StoreManagerRole } from '@prisma/client';

export class CreateStoreManagerDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: StoreManagerRole, default: StoreManagerRole.STAFF })
  @IsEnum(StoreManagerRole)
  @IsOptional()
  role?: StoreManagerRole;
}

export class UpdateStoreManagerDto {
  @ApiProperty({ enum: StoreManagerRole })
  @IsEnum(StoreManagerRole)
  role!: StoreManagerRole;
}
