import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com or johndoe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
