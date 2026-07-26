import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/api/notificationsApi", () => ({
  getNotifications: vi.fn(),
  getLatestNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  trackNotificationClick: vi.fn(),
  archiveNotification: vi.fn(),
  deleteNotification: vi.fn(),
}));

import * as api from "@/lib/api/notificationsApi";
import {
  useUnreadCount,
  useLatestNotifications,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useUpdateNotificationPreferences,
  NOTIFICATION_KEYS,
} from "./useNotifications";
import type { AppNotification } from "@/types/notifications";

const makeNotification = (
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id: "notif-1",
  title: "You earned 50 coins",
  message: "Balance updated.",
  type: "WALLET",
  priority: "NORMAL",
  status: "UNREAD",
  icon: "coins",
  image: null,
  actionLabel: null,
  actionUrl: null,
  deepLink: null,
  readAt: null,
  createdAt: new Date().toISOString(),
  expiresAt: null,
  ...overrides,
});

const makeClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const makeWrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

describe("useNotifications hooks", () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
  });

  describe("query keys", () => {
    it("should namespace every key", () => {
      expect(NOTIFICATION_KEYS.unreadCount()[0]).toBe("notifications");
      expect(NOTIFICATION_KEYS.latest()[0]).toBe("notifications");
      expect(NOTIFICATION_KEYS.preferences()[0]).toBe("notifications");
    });
  });

  describe("useUnreadCount", () => {
    it("should load the count", async () => {
      vi.mocked(api.getUnreadCount).mockResolvedValue({ unread: 4 });

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.unread).toBe(4);
    });

    it("should not fetch when disabled", () => {
      renderHook(() => useUnreadCount(false), { wrapper: makeWrapper(client) });

      expect(api.getUnreadCount).not.toHaveBeenCalled();
    });
  });

  describe("useLatestNotifications", () => {
    it("should load the dropdown payload", async () => {
      vi.mocked(api.getLatestNotifications).mockResolvedValue([makeNotification()]);

      const { result } = renderHook(() => useLatestNotifications(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
    });
  });

  describe("useNotifications", () => {
    it("should paginate", async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({
        items: [makeNotification()],
        meta: {
          page: 1, pageSize: 20, totalItems: 40, totalPages: 2,
          hasNextPage: true, hasPreviousPage: false,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(true);
      expect(api.getNotifications).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });
  });

  describe("useMarkNotificationRead", () => {
    it("should optimistically flip status and decrement the badge", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [makeNotification()]);
      client.setQueryData(NOTIFICATION_KEYS.unreadCount(), { unread: 3 });
      vi.mocked(api.markNotificationRead).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useMarkNotificationRead(), {
        wrapper: makeWrapper(client),
      });

      act(() => result.current.mutate("notif-1"));

      await waitFor(() => {
        const latest = client.getQueryData<AppNotification[]>(
          NOTIFICATION_KEYS.latest(),
        );
        expect(latest?.[0].status).toBe("READ");
      });

      expect(
        client.getQueryData<{ unread: number }>(NOTIFICATION_KEYS.unreadCount())
          ?.unread,
      ).toBe(2);
    });

    it("should not decrement when the item was already read", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [
        makeNotification({ status: "READ" }),
      ]);
      client.setQueryData(NOTIFICATION_KEYS.unreadCount(), { unread: 3 });
      vi.mocked(api.markNotificationRead).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useMarkNotificationRead(), {
        wrapper: makeWrapper(client),
      });

      act(() => result.current.mutate("notif-1"));

      await waitFor(() =>
        expect(
          client.getQueryData<{ unread: number }>(NOTIFICATION_KEYS.unreadCount())
            ?.unread,
        ).toBe(3),
      );
    });

    it("should roll back when the request fails", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [makeNotification()]);
      client.setQueryData(NOTIFICATION_KEYS.unreadCount(), { unread: 3 });
      vi.mocked(api.markNotificationRead).mockRejectedValue(new Error("offline"));

      const { result } = renderHook(() => useMarkNotificationRead(), {
        wrapper: makeWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync("notif-1").catch(() => undefined);
      });

      await waitFor(() => {
        const latest = client.getQueryData<AppNotification[]>(
          NOTIFICATION_KEYS.latest(),
        );
        expect(latest?.[0].status).toBe("UNREAD");
      });
    });
  });

  describe("useMarkAllNotificationsRead", () => {
    it("should zero the badge optimistically", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [makeNotification()]);
      client.setQueryData(NOTIFICATION_KEYS.unreadCount(), { unread: 7 });
      vi.mocked(api.markAllNotificationsRead).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useMarkAllNotificationsRead(), {
        wrapper: makeWrapper(client),
      });

      act(() => result.current.mutate());

      await waitFor(() =>
        expect(
          client.getQueryData<{ unread: number }>(NOTIFICATION_KEYS.unreadCount())
            ?.unread,
        ).toBe(0),
      );
    });

    it("should restore the badge on failure", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [makeNotification()]);
      client.setQueryData(NOTIFICATION_KEYS.unreadCount(), { unread: 7 });
      vi.mocked(api.markAllNotificationsRead).mockRejectedValue(new Error("offline"));

      const { result } = renderHook(() => useMarkAllNotificationsRead(), {
        wrapper: makeWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync().catch(() => undefined);
      });

      await waitFor(() =>
        expect(
          client.getQueryData<{ unread: number }>(NOTIFICATION_KEYS.unreadCount())
            ?.unread,
        ).toBe(7),
      );
    });
  });

  describe("useDeleteNotification", () => {
    it("should remove the row optimistically", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [makeNotification()]);
      vi.mocked(api.deleteNotification).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: makeWrapper(client),
      });

      act(() => result.current.mutate("notif-1"));

      await waitFor(() =>
        expect(
          client.getQueryData<AppNotification[]>(NOTIFICATION_KEYS.latest()),
        ).toHaveLength(0),
      );
    });

    it("should restore the row on failure", async () => {
      client.setQueryData(NOTIFICATION_KEYS.latest(), [makeNotification()]);
      vi.mocked(api.deleteNotification).mockRejectedValue(new Error("offline"));

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: makeWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync("notif-1").catch(() => undefined);
      });

      await waitFor(() =>
        expect(
          client.getQueryData<AppNotification[]>(NOTIFICATION_KEYS.latest()),
        ).toHaveLength(1),
      );
    });
  });

  describe("useUpdateNotificationPreferences", () => {
    it("should seed the cache with the saved preferences", async () => {
      const prefs = { marketing: false } as never;
      vi.mocked(api.updateNotificationPreferences).mockResolvedValue(prefs);

      const { result } = renderHook(() => useUpdateNotificationPreferences(), {
        wrapper: makeWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ marketing: false });
      });

      expect(client.getQueryData(NOTIFICATION_KEYS.preferences())).toEqual(prefs);
    });
  });
});
