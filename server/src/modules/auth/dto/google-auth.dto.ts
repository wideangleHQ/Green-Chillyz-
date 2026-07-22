import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Supabase access token from Google OAuth flow' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
