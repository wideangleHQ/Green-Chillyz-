export type NotificationType =
  | "SYSTEM"
  | "WALLET"
  | "GAME"
  | "REWARD"
  | "REDEMPTION"
  | "REFERRAL"
  | "LOYALTY"
  | "STORE"
  | "CAMPAIGN"
  | "MARKETING"
  | "SECURITY"
  | "ORDER"
  | "CUSTOM";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED" | "DELETED";

export interface AppNotification {
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
  readAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface UnreadCount {
  unread: number;
}

export interface NotificationPreferences {
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

export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
  type?: NotificationType;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  meta: PaginationMeta;
}

/** Compact relative time, e.g. "just now", "5m", "3d". */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Where a notification should navigate. Server-provided deepLink wins, then
 * actionUrl. Only same-origin relative paths are accepted so a malformed or
 * hostile value cannot redirect the user off-site.
 */
export function resolveNotificationHref(
  notification: AppNotification,
): string | null {
  const target = notification.deepLink ?? notification.actionUrl;
  if (!target) return null;
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}
