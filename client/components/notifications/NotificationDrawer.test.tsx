import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// The factory must be self-contained: vi.mock is hoisted above const decls.
vi.mock("@/hooks/useNotifications", () => ({
  useLatestNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
  useTrackNotificationClick: vi.fn(),
  useArchiveNotification: vi.fn(),
  useDeleteNotification: vi.fn(),
}));

import * as notificationHooks from "@/hooks/useNotifications";
import { NotificationDrawer } from "./NotificationDrawer";

const mocks = notificationHooks as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;
import type { AppNotification } from "@/types/notifications";

const makeNotification = (
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id: "notif-1",
  title: "You earned 50 coins",
  message: "Balance is now 550 coins.",
  type: "WALLET",
  priority: "NORMAL",
  status: "UNREAD",
  icon: "coins",
  image: null,
  actionLabel: "View Wallet",
  actionUrl: "/wallet",
  deepLink: null,
  readAt: null,
  createdAt: new Date().toISOString(),
  expiresAt: null,
  ...overrides,
});

const mutation = () => ({ mutate: vi.fn(), isPending: false });

describe("NotificationDrawer", () => {
  let markRead: ReturnType<typeof mutation>;
  let markAllRead: ReturnType<typeof mutation>;
  let trackClick: ReturnType<typeof mutation>;
  let archive: ReturnType<typeof mutation>;
  let remove: ReturnType<typeof mutation>;

  beforeEach(() => {
    vi.clearAllMocks();
    markRead = mutation();
    markAllRead = mutation();
    trackClick = mutation();
    archive = mutation();
    remove = mutation();

    mocks.useLatestNotifications.mockReturnValue({
      data: [makeNotification()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useMarkNotificationRead.mockReturnValue(markRead);
    mocks.useMarkAllNotificationsRead.mockReturnValue(markAllRead);
    mocks.useTrackNotificationClick.mockReturnValue(trackClick);
    mocks.useArchiveNotification.mockReturnValue(archive);
    mocks.useDeleteNotification.mockReturnValue(remove);
  });

  it("should render nothing when closed", () => {
    render(<NotificationDrawer isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render a labelled modal dialog", () => {
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Notifications");
  });

  it("should list notifications", () => {
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByText("You earned 50 coins")).toBeInTheDocument();
  });

  it("should show a loading state", () => {
    mocks.useLatestNotifications.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByLabelText("Loading notifications")).toBeInTheDocument();
  });

  it("should show an error state with a retry", async () => {
    const refetch = vi.fn();
    mocks.useLatestNotifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("should show an empty state", () => {
    mocks.useLatestNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/You are all caught up/i)).toBeInTheDocument();
  });

  it("should offer mark-all-read only when something is unread", () => {
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Mark all read/i }),
    ).toBeInTheDocument();
  });

  it("should hide mark-all-read when everything is read", () => {
    mocks.useLatestNotifications.mockReturnValue({
      data: [makeNotification({ status: "READ" })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /Mark all read/i }),
    ).not.toBeInTheDocument();
  });

  it("should mark all read on click", async () => {
    const user = userEvent.setup();
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Mark all read/i }));

    expect(markAllRead.mutate).toHaveBeenCalled();
  });

  it("should navigate to the action target and close", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={onClose} />);
    await user.click(screen.getByText("You earned 50 coins"));

    expect(trackClick.mutate).toHaveBeenCalledWith("notif-1");
    expect(push).toHaveBeenCalledWith("/wallet");
    expect(onClose).toHaveBeenCalled();
  });

  it("should mark read instead of navigating when there is no target", async () => {
    mocks.useLatestNotifications.mockReturnValue({
      data: [makeNotification({ actionUrl: null, deepLink: null })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);
    await user.click(screen.getByText("You earned 50 coins"));

    expect(markRead.mutate).toHaveBeenCalledWith("notif-1");
    expect(push).not.toHaveBeenCalled();
  });

  it("should prefer deepLink over actionUrl", async () => {
    mocks.useLatestNotifications.mockReturnValue({
      data: [makeNotification({ deepLink: "/rewards/vouchers" })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);
    await user.click(screen.getByText("You earned 50 coins"));

    expect(push).toHaveBeenCalledWith("/rewards/vouchers");
  });

  it("should refuse to navigate to an external target", async () => {
    mocks.useLatestNotifications.mockReturnValue({
      data: [makeNotification({ actionUrl: "https://evil.example.com" })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={vi.fn()} />);
    await user.click(screen.getByText("You earned 50 coins"));

    expect(push).not.toHaveBeenCalled();
    expect(markRead.mutate).toHaveBeenCalled();
  });

  it("should close on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={onClose} />);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("should close via the close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<NotificationDrawer isOpen onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Close notifications/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("should move focus into the dialog on open", async () => {
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Close notifications/i }),
      ).toHaveFocus(),
    );
  });

  it("should keep Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    await user.tab();

    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it("should archive a notification", async () => {
    const user = userEvent.setup();
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Archive notification/i }));

    expect(archive.mutate).toHaveBeenCalledWith("notif-1");
  });

  it("should delete a notification", async () => {
    const user = userEvent.setup();
    render(<NotificationDrawer isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Delete notification/i }));

    expect(remove.mutate).toHaveBeenCalledWith("notif-1");
  });

  it("should only fetch while open", () => {
    render(<NotificationDrawer isOpen={false} onClose={vi.fn()} />);

    expect(mocks.useLatestNotifications).toHaveBeenCalledWith(false);
  });
});
