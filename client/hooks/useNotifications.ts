"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotifications,
  getLatestNotifications,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  markNotificationRead,
  markAllNotificationsRead,
  trackNotificationClick,
  archiveNotification,
  deleteNotification,
} from "@/lib/api/notificationsApi";
import type {
  AppNotification,
  UnreadCount,
  NotificationQueryParams,
  PaginatedNotifications,
} from "@/types/notifications";

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  list: (params?: Omit<NotificationQueryParams, "page">) =>
    [...NOTIFICATION_KEYS.all, "list", params] as const,
  latest: () => [...NOTIFICATION_KEYS.all, "latest"] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, "unread-count"] as const,
  preferences: () => [...NOTIFICATION_KEYS.all, "preferences"] as const,
};

/**
 * The badge polls in the background so a notification raised by another tab
 * or a server-side event surfaces without a reload. The interval is modest
 * because the count is served from Redis.
 */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: getUnreadCount,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: enabled ? 60 * 1000 : false,
    refetchOnWindowFocus: true,
  });
}

/** Small payload backing the dropdown; kept warm so opening feels instant. */
export function useLatestNotifications(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.latest(),
    queryFn: getLatestNotifications,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useNotifications(
  filters?: Omit<NotificationQueryParams, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      getNotifications({ ...filters, page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: getNotificationPreferences,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.preferences(), preferences);
    },
  });
}

/**
 * Read status is optimistic: flipping a row and decrementing the badge is
 * safe to show immediately, and any failure rolls the cache back.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      const previousLatest = queryClient.getQueryData<AppNotification[]>(
        NOTIFICATION_KEYS.latest(),
      );
      const previousCount = queryClient.getQueryData<UnreadCount>(
        NOTIFICATION_KEYS.unreadCount(),
      );

      const wasUnread = previousLatest?.find((n) => n.id === id)?.status === "UNREAD";

      queryClient.setQueryData<AppNotification[]>(
        NOTIFICATION_KEYS.latest(),
        (old) =>
          old?.map((n) =>
            n.id === id
              ? { ...n, status: "READ" as const, readAt: new Date().toISOString() }
              : n,
          ),
      );

      if (wasUnread && previousCount) {
        queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), {
          unread: Math.max(0, previousCount.unread - 1),
        });
      }

      return { previousLatest, previousCount };
    },

    onError: (_error, _id, context) => {
      if (context?.previousLatest) {
        queryClient.setQueryData(NOTIFICATION_KEYS.latest(), context.previousLatest);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.unreadCount(),
          context.previousCount,
        );
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      const previousLatest = queryClient.getQueryData<AppNotification[]>(
        NOTIFICATION_KEYS.latest(),
      );
      const previousCount = queryClient.getQueryData<UnreadCount>(
        NOTIFICATION_KEYS.unreadCount(),
      );

      queryClient.setQueryData<AppNotification[]>(
        NOTIFICATION_KEYS.latest(),
        (old) =>
          old?.map((n) =>
            n.status === "UNREAD"
              ? { ...n, status: "READ" as const, readAt: new Date().toISOString() }
              : n,
          ),
      );
      queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), {
        unread: 0,
      });

      return { previousLatest, previousCount };
    },

    onError: (_error, _vars, context) => {
      if (context?.previousLatest) {
        queryClient.setQueryData(NOTIFICATION_KEYS.latest(), context.previousLatest);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.unreadCount(),
          context.previousCount,
        );
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useTrackNotificationClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trackNotificationClick(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),

    // Removing the row immediately is safe; a failure restores it.
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.latest() });

      const previousLatest = queryClient.getQueryData<AppNotification[]>(
        NOTIFICATION_KEYS.latest(),
      );

      queryClient.setQueryData<AppNotification[]>(
        NOTIFICATION_KEYS.latest(),
        (old) => old?.filter((n) => n.id !== id),
      );

      return { previousLatest };
    },

    onError: (_error, _id, context) => {
      if (context?.previousLatest) {
        queryClient.setQueryData(NOTIFICATION_KEYS.latest(), context.previousLatest);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export type { PaginatedNotifications };
