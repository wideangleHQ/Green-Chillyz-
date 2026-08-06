import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * The only credential the dashboard accepts. No username, no email, no
 * password — the store access code alone identifies and authenticates.
 */
export class DashboardLoginDto {
  @ApiProperty({
    description: 'Store access code issued to the store',
    example: 'GC-PAT-X93KL8Q2',
    minLength: 8,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'accessCode must contain only letters, digits and hyphens',
  })
  accessCode!: string;
}
