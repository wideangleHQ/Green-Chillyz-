import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationCacheService } from './notification-cache.service';
import { UpdateNotificationPreferencesDto } from '../dto';
import { NotificationPreferenceResponse } from '../interfaces';
import { TYPE_TO_PREFERENCE } from '../constants';

type PreferenceRecord = NotificationPreferenceResponse;

const CHANNEL_TO_FLAG: Partial<Record<NotificationChannel, keyof PreferenceRecord>> = {
  IN_APP: 'inAppEnabled',
  PUSH: 'pushEnabled',
  EMAIL: 'emailEnabled',
  WHATSAPP: 'whatsappEnabled',
  SMS: 'smsEnabled',
};

/**
 * Per-user delivery preferences. Rows are created lazily with permissive
 * defaults so a user who has never touched settings still receives messages.
 */
@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: NotificationCacheService,
  ) {}

  async get(userId: string): Promise<NotificationPreferenceResponse> {
    const cached = await this.cache.getPreferences<NotificationPreferenceResponse>(userId);
    if (cached) return cached;

    const record = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const response = this.toResponse(record);
    await this.cache.setPreferences(userId, response);
    return response;
  }

  async update(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferenceResponse> {
    const record = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });

    await this.cache.invalidatePreferences(userId);
    this.logger.log(`Notification preferences updated for user ${userId}`);

    return this.toResponse(record);
  }

  /**
   * Whether a message of this type may go out on this channel.
   * Both the category switch and the channel switch must be on.
   */
  async allows(
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const prefs = await this.get(userId);

    const channelFlag = CHANNEL_TO_FLAG[channel];
    if (channelFlag && prefs[channelFlag] === false) {
      return false;
    }

    const categoryKey = TYPE_TO_PREFERENCE[type];
    if (!categoryKey) {
      // Types without a mapping (ORDER, CUSTOM) are always allowed.
      return true;
    }

    return prefs[categoryKey as keyof PreferenceRecord] !== false;
  }

  private toResponse(
    record: Record<string, unknown>,
  ): NotificationPreferenceResponse {
    return {
      wallet: record.wallet as boolean,
      games: record.games as boolean,
      rewards: record.rewards as boolean,
      marketing: record.marketing as boolean,
      campaigns: record.campaigns as boolean,
      storeUpdates: record.storeUpdates as boolean,
      referral: record.referral as boolean,
      security: record.security as boolean,
      system: record.system as boolean,
      inAppEnabled: record.inAppEnabled as boolean,
      pushEnabled: record.pushEnabled as boolean,
      emailEnabled: record.emailEnabled as boolean,
      whatsappEnabled: record.whatsappEnabled as boolean,
      smsEnabled: record.smsEnabled as boolean,
      quietHoursStart: (record.quietHoursStart as number | null) ?? null,
      quietHoursEnd: (record.quietHoursEnd as number | null) ?? null,
    };
  }
}
