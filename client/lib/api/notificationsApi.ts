import { api } from "./client";
import type {
  AppNotification,
  UnreadCount,
  NotificationPreferences,
  NotificationQueryParams,
  PaginatedNotifications,
} from "@/types/notifications";

const BASE = "/notifications";

export async function getNotifications(
  params?: NotificationQueryParams,
): Promise<PaginatedNotifications> {
  const { data } = await api.get<PaginatedNotifications>(`${BASE}/me`, { params });
  return data;
}

export async function getLatestNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>(`${BASE}/me/latest`);
  return data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const { data } = await api.get<UnreadCount>(`${BASE}/me/unread-count`);
  return data;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await api.get<NotificationPreferences>(`${BASE}/me/preferences`);
  return data;
}

export async function updateNotificationPreferences(
  body: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const { data } = await api.patch<NotificationPreferences>(
    `${BASE}/me/preferences`,
    body,
  );
  return data;
}

export async function markNotificationRead(
  id: string,
): Promise<AppNotification> {
  const { data } = await api.patch<AppNotification>(`${BASE}/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await api.patch<{ updated: number }>(`${BASE}/me/read-all`);
  return data;
}

export async function trackNotificationClick(
  id: string,
): Promise<AppNotification> {
  const { data } = await api.patch<AppNotification>(`${BASE}/${id}/click`);
  return data;
}

export async function archiveNotification(id: string): Promise<AppNotification> {
  const { data } = await api.patch<AppNotification>(`${BASE}/${id}/archive`);
  return data;
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
