import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from '@prisma/client';

export class RequestOtpDto {
  @ApiProperty({ description: 'Phone number or email to send OTP to' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @ApiProperty({ enum: OtpPurpose, description: 'Purpose of the OTP' })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
