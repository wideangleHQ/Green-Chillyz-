import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  DeliveryStatus,
} from '@prisma/client';

/**
 * A fully-resolved message ready for delivery. Produced by the template
 * service (or supplied directly) and handed to one or more channels.
 */
export interface ResolvedNotification {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  icon?: string | null;
  image?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  deepLink?: string | null;
  templateKey?: string | null;
  groupKey?: string | null;
  /** Unique per logical event; the DB unique constraint stops duplicates. */
  dedupeKey?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown> | null;
  expiresAt?: Date | null;
}

/**
 * Contract every delivery channel implements.
 *
 * Push, Email, WhatsApp, SMS and Webhook become available by adding a class
 * that satisfies this interface and registering it with the dispatcher —
 * no change to publishers, listeners or the dispatcher itself.
 */
export interface NotificationChannelHandler {
  readonly channel: NotificationChannel;

  /** False short-circuits delivery (missing credentials, disabled, etc.). */
  isAvailable(): boolean;

  send(notification: ResolvedNotification): Promise<ChannelSendResult>;
}

export interface ChannelSendResult {
  status: DeliveryStatus;
  /** Set when the channel persisted a record (in-app writes a row). */
  notificationId?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DispatchRequest {
  userId: string;
  templateKey?: string;
  /** Variables interpolated into the template. */
  variables?: Record<string, unknown>;
  /** Supply to bypass templates entirely. */
  override?: Partial<ResolvedNotification> & { title?: string; message?: string };
  channels?: NotificationChannel[];
  dedupeKey?: string;
  referenceId?: string;
  /** Skips preference checks — reserved for CRITICAL security messages. */
  force?: boolean;
}

export interface DispatchResult {
  delivered: boolean;
  skippedReason?: string;
  results: Array<{
    channel: NotificationChannel;
    status: DeliveryStatus;
    notificationId?: string | null;
    failureReason?: string | null;
  }>;
}

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  icon: string | null;
  image: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  deepLink: string | null;
  readAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface UnreadCountResponse {
  unread: number;
}

export interface NotificationPreferenceResponse {
  wallet: boolean;
  games: boolean;
  rewards: boolean;
  marketing: boolean;
  campaigns: boolean;
  storeUpdates: boolean;
  referral: boolean;
  security: boolean;
  system: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

export interface NotificationTemplateResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  titleTemplate: string;
  bodyTemplate: string;
  icon: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  channels: NotificationChannel[];
  expiryDays: number | null;
  isActive: boolean;
}

export interface NotificationStats {
  sent: number;
  read: number;
  clicked: number;
  unread: number;
  readRate: number;
  clickRate: number;
  channelUsage: Array<{ channel: NotificationChannel; count: number }>;
  mostClicked: Array<{ templateKey: string; clicks: number }>;
  mostIgnored: Array<{ templateKey: string; sent: number; read: number }>;
}
