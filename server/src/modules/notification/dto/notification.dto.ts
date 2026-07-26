import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
} from '@prisma/client';
import { PaginationDto } from '../../../common/dto';

export class NotificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional() @IsBoolean() @IsOptional() wallet?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() games?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() rewards?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() marketing?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() campaigns?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() storeUpdates?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() referral?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() security?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() system?: boolean;

  @ApiPropertyOptional() @IsBoolean() @IsOptional() inAppEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Reserved for the future Push channel' })
  @IsBoolean() @IsOptional() pushEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Reserved for the future Email channel' })
  @IsBoolean() @IsOptional() emailEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Reserved for the future WhatsApp channel' })
  @IsBoolean() @IsOptional() whatsappEnabled?: boolean;
  @ApiPropertyOptional({ description: 'Reserved for the future SMS channel' })
  @IsBoolean() @IsOptional() smsEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 23 })
  @IsInt() @Min(0) @Max(23) @IsOptional()
  quietHoursStart?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 23 })
  @IsInt() @Min(0) @Max(23) @IsOptional()
  quietHoursEnd?: number;
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Unique dotted key, e.g. wallet.credited' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, {
    message: 'key must be lowercase dotted or kebab notation',
  })
  key!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType) @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsEnum(NotificationPriority) @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ description: 'Supports {{variable}} placeholders' })
  @IsString() @IsNotEmpty() @MaxLength(300)
  titleTemplate!: string;

  @ApiProperty({ description: 'Supports {{variable}} placeholders' })
  @IsString() @IsNotEmpty()
  bodyTemplate!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString() @IsOptional() @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsString() @IsOptional() @MaxLength(80)
  actionLabel?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString() @IsOptional() @MaxLength(500)
  actionUrl?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsArray() @IsEnum(NotificationChannel, { each: true }) @IsOptional()
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ minimum: 1 })
  @IsInt() @Min(1) @IsOptional()
  expiryDays?: number;

  @ApiPropertyOptional()
  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateTemplateDto extends PartialType(
  OmitType(CreateTemplateDto, ['key'] as const),
) {}

/** Admin/dashboard entry point for sending to one user. */
export class SendNotificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Template key; omit to send an ad-hoc message' })
  @IsString() @IsOptional() @MaxLength(100)
  templateKey?: string;

  @ApiPropertyOptional({ description: 'Values interpolated into the template' })
  @IsObject() @IsOptional()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString() @IsOptional() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  message?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType) @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsEnum(NotificationPriority) @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsString() @IsOptional() @MaxLength(80)
  actionLabel?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString() @IsOptional() @MaxLength(500)
  actionUrl?: string;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    isArray: true,
    description: 'Defaults to IN_APP. Unregistered channels are skipped.',
  })
  @IsArray() @IsEnum(NotificationChannel, { each: true }) @IsOptional()
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Suppresses duplicates for the same logical event' })
  @IsString() @IsOptional() @MaxLength(255)
  dedupeKey?: string;
}

/** Broadcast to many users — the dashboard uses this for campaigns. */
export class BroadcastNotificationDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];

  @ApiPropertyOptional({ description: 'Template key; omit to send an ad-hoc message' })
  @IsString() @IsOptional() @MaxLength(100)
  templateKey?: string;

  @ApiPropertyOptional()
  @IsObject() @IsOptional()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString() @IsOptional() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  message?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType) @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsEnum(NotificationPriority) @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsArray() @IsEnum(NotificationChannel, { each: true }) @IsOptional()
  channels?: NotificationChannel[];
}
