import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationCacheService } from './notification-cache.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto';
import {
  NotificationTemplateResponse,
  ResolvedNotification,
} from '../interfaces';
import {
  NOTIFICATION_ERRORS,
  TEMPLATE_KEYS,
  NOTIFICATION_DEFAULTS,
} from '../constants';

interface SeedTemplate {
  key: string;
  name: string;
  type: NotificationType;
  priority: NotificationPriority;
  titleTemplate: string;
  bodyTemplate: string;
  icon: string;
  actionLabel?: string;
  actionUrl?: string;
}

/**
 * Built-in templates. New notification copy is data, not code — adding a
 * template here (or via the admin endpoint) requires no new classes.
 */
const SEED_TEMPLATES: SeedTemplate[] = [
  {
    key: TEMPLATE_KEYS.WALLET_CREDITED,
    name: 'Wallet Credited',
    type: NotificationType.WALLET,
    priority: NotificationPriority.NORMAL,
    titleTemplate: 'You earned {{amount}} coins',
    bodyTemplate: '{{description}} Your balance is now {{newBalance}} coins.',
    icon: 'coins',
    actionLabel: 'View Wallet',
    actionUrl: '/wallet',
  },
  {
    key: TEMPLATE_KEYS.WALLET_DEBITED,
    name: 'Wallet Debited',
    type: NotificationType.WALLET,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '{{amount}} coins spent',
    bodyTemplate: '{{description}} Your balance is now {{newBalance}} coins.',
    icon: 'arrow-up-circle',
    actionLabel: 'View Wallet',
    actionUrl: '/wallet',
  },
  {
    key: TEMPLATE_KEYS.COINS_EXPIRED,
    name: 'Coins Expired',
    type: NotificationType.WALLET,
    priority: NotificationPriority.HIGH,
    titleTemplate: '{{amount}} coins expired',
    bodyTemplate: 'Some of your coins have expired. Balance is now {{newBalance}} coins.',
    icon: 'timer',
    actionLabel: 'View Wallet',
    actionUrl: '/wallet',
  },
  {
    key: TEMPLATE_KEYS.GAME_WON,
    name: 'Game Won',
    type: NotificationType.GAME,
    priority: NotificationPriority.NORMAL,
    titleTemplate: 'You won {{coinsWon}} coins!',
    bodyTemplate: 'Nice play on {{gameName}}. Your coins have been added.',
    icon: 'gamepad-2',
    actionLabel: 'View Wallet',
    actionUrl: '/wallet',
  },
  {
    key: TEMPLATE_KEYS.REWARD_REDEEMED,
    name: 'Reward Redeemed',
    type: NotificationType.REDEMPTION,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '{{rewardTitle}} redeemed',
    bodyTemplate: 'You spent {{coinsSpent}} coins. Your voucher is ready.',
    icon: 'gift',
    actionLabel: 'My Vouchers',
    actionUrl: '/rewards/vouchers',
  },
  {
    key: TEMPLATE_KEYS.VOUCHER_GENERATED,
    name: 'Voucher Generated',
    type: NotificationType.REDEMPTION,
    priority: NotificationPriority.HIGH,
    titleTemplate: 'Your voucher is ready',
    bodyTemplate: 'Voucher {{voucherCode}} for {{rewardTitle}}. Show it at the counter.',
    icon: 'ticket',
    actionLabel: 'View Voucher',
    actionUrl: '/rewards/vouchers',
  },
  {
    key: TEMPLATE_KEYS.REFERRAL_BONUS,
    name: 'Referral Bonus',
    type: NotificationType.REFERRAL,
    priority: NotificationPriority.NORMAL,
    titleTemplate: 'Referral bonus: {{bonusCoins}} coins',
    bodyTemplate: '{{referredUserName}} joined using your code. Enjoy your bonus!',
    icon: 'users',
    actionLabel: 'View Wallet',
    actionUrl: '/wallet',
  },
  {
    key: TEMPLATE_KEYS.BIRTHDAY_REWARD,
    name: 'Birthday Reward',
    type: NotificationType.REWARD,
    priority: NotificationPriority.HIGH,
    titleTemplate: 'Happy birthday! {{coins}} coins for you',
    bodyTemplate: 'A little gift from all of us at GreenChillyz.',
    icon: 'cake',
    actionLabel: 'View Wallet',
    actionUrl: '/wallet',
  },
  {
    key: TEMPLATE_KEYS.CAMPAIGN_STARTED,
    name: 'Campaign Started',
    type: NotificationType.CAMPAIGN,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '{{campaignName}} is live',
    bodyTemplate: '{{description}}',
    icon: 'sparkles',
    actionLabel: 'Explore',
    actionUrl: '/rewards',
  },
  {
    key: TEMPLATE_KEYS.STORE_ANNOUNCEMENT,
    name: 'Store Announcement',
    type: NotificationType.STORE,
    priority: NotificationPriority.NORMAL,
    titleTemplate: '{{title}}',
    bodyTemplate: '{{body}}',
    icon: 'store',
  },
  {
    key: TEMPLATE_KEYS.SECURITY_ALERT,
    name: 'Security Alert',
    type: NotificationType.SECURITY,
    priority: NotificationPriority.CRITICAL,
    titleTemplate: 'Security alert',
    bodyTemplate: '{{detail}}',
    icon: 'shield-alert',
  },
  {
    key: TEMPLATE_KEYS.WELCOME,
    name: 'Welcome',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.NORMAL,
    titleTemplate: 'Welcome to GreenChillyz, {{fullName}}',
    bodyTemplate: 'Play games, earn coins and redeem rewards. Your wallet is ready.',
    icon: 'party-popper',
    actionLabel: 'Explore Rewards',
    actionUrl: '/rewards',
  },
];

@Injectable()
export class NotificationTemplateService implements OnModuleInit {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: NotificationCacheService,
  ) {}

  /** Idempotently ensures built-in templates exist on boot. */
  async onModuleInit(): Promise<void> {
    try {
      await this.seedDefaults();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Template seeding skipped: ${message}`);
    }
  }

  async seedDefaults(): Promise<number> {
    let created = 0;
    for (const template of SEED_TEMPLATES) {
      const existing = await this.prisma.notificationTemplate.findUnique({
        where: { key: template.key },
        select: { id: true },
      });
      if (existing) continue;

      await this.prisma.notificationTemplate.create({
        data: { ...template, channels: [NotificationChannel.IN_APP] },
      });
      created++;
    }
    if (created > 0) {
      this.logger.log(`Seeded ${created} notification template(s)`);
    }
    return created;
  }

  /**
   * Build a deliverable message from a template plus variables.
   * Returns null when the template is missing or inactive so the dispatcher
   * can fall back to an override instead of throwing.
   */
  async resolve(
    key: string,
    userId: string,
    variables: Record<string, unknown> = {},
  ): Promise<ResolvedNotification | null> {
    const template = await this.findByKeyCached(key);
    if (!template || !template.isActive) return null;

    const expiresAt = template.expiryDays
      ? new Date(Date.now() + template.expiryDays * 86_400_000)
      : new Date(
          Date.now() + NOTIFICATION_DEFAULTS.DEFAULT_EXPIRY_DAYS * 86_400_000,
        );

    return {
      userId,
      title: this.interpolate(template.titleTemplate, variables),
      message: this.interpolate(template.bodyTemplate, variables),
      type: template.type,
      priority: template.priority,
      icon: template.icon,
      actionLabel: template.actionLabel,
      actionUrl: template.actionUrl
        ? this.interpolate(template.actionUrl, variables)
        : null,
      templateKey: template.key,
      expiresAt,
    };
  }

  /**
   * Replace {{token}} placeholders. Unknown tokens collapse to an empty
   * string so a missing variable never leaks the raw placeholder to a user.
   */
  interpolate(template: string, variables: Record<string, unknown>): string {
    return template
      .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, token: string) => {
        const value = variables[token];
        if (value === undefined || value === null) return '';
        return this.sanitize(String(value));
      })
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /** Strips angle brackets so rendered copy can never inject markup. */
  private sanitize(value: string): string {
    return value.replace(/[<>]/g, '');
  }

  async findByKeyCached(key: string): Promise<NotificationTemplateResponse | null> {
    const cached = await this.cache.getTemplate<NotificationTemplateResponse>(key);
    if (cached) return cached;

    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key },
    });
    if (!template) return null;

    const response = this.toResponse(template);
    await this.cache.setTemplate(key, response);
    return response;
  }

  async findAll(): Promise<NotificationTemplateResponse[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      orderBy: [{ type: 'asc' }, { key: 'asc' }],
    });
    return templates.map((t) => this.toResponse(t));
  }

  async create(dto: CreateTemplateDto): Promise<NotificationTemplateResponse> {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { key: dto.key },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(NOTIFICATION_ERRORS.TEMPLATE_KEY_EXISTS);
    }

    const template = await this.prisma.notificationTemplate.create({
      data: { ...dto, channels: dto.channels ?? [NotificationChannel.IN_APP] },
    });

    this.logger.log(`Notification template created: ${dto.key}`);
    return this.toResponse(template);
  }

  async update(
    key: string,
    dto: UpdateTemplateDto,
  ): Promise<NotificationTemplateResponse> {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { key },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND);
    }

    const template = await this.prisma.notificationTemplate.update({
      where: { key },
      data: dto,
    });

    await this.cache.invalidateTemplate(key);
    return this.toResponse(template);
  }

  private toResponse(
    template: Record<string, unknown>,
  ): NotificationTemplateResponse {
    return {
      id: template.id as string,
      key: template.key as string,
      name: template.name as string,
      description: (template.description as string | null) ?? null,
      type: template.type as NotificationType,
      priority: template.priority as NotificationPriority,
      titleTemplate: template.titleTemplate as string,
      bodyTemplate: template.bodyTemplate as string,
      icon: (template.icon as string | null) ?? null,
      actionLabel: (template.actionLabel as string | null) ?? null,
      actionUrl: (template.actionUrl as string | null) ?? null,
      channels: template.channels as NotificationChannel[],
      expiryDays: (template.expiryDays as number | null) ?? null,
      isActive: template.isActive as boolean,
    };
  }
}
