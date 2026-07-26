import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/hooks/useNotifications", () => ({
  useUnreadCount: vi.fn(),
}));

import { useUnreadCount } from "@/hooks/useNotifications";
import { NotificationBell } from "./NotificationBell";

const mockUseUnreadCount = useUnreadCount as unknown as ReturnType<typeof vi.fn>;

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUnreadCount.mockReturnValue({ data: { unread: 0 } });
  });

  it("should render a button", () => {
    render(<NotificationBell onClick={vi.fn()} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should hide the badge when nothing is unread", () => {
    render(<NotificationBell onClick={vi.fn()} />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("should show the unread count", () => {
    mockUseUnreadCount.mockReturnValue({ data: { unread: 5 } });

    render(<NotificationBell onClick={vi.fn()} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should cap the badge at 99+", () => {
    mockUseUnreadCount.mockReturnValue({ data: { unread: 250 } });

    render(<NotificationBell onClick={vi.fn()} />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("should describe the unread count to assistive tech", () => {
    mockUseUnreadCount.mockReturnValue({ data: { unread: 3 } });

    render(<NotificationBell onClick={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Notifications, 3 unread/i }),
    ).toBeInTheDocument();
  });

  it("should describe an empty state to assistive tech", () => {
    render(<NotificationBell onClick={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /none unread/i }),
    ).toBeInTheDocument();
  });

  it("should announce updates via a live region", () => {
    mockUseUnreadCount.mockReturnValue({ data: { unread: 2 } });

    render(<NotificationBell onClick={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("2 unread notifications");
  });

  it("should call onClick when activated", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<NotificationBell onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should be reachable and activatable by keyboard", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<NotificationBell onClick={onClick} />);

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalled();
  });

  it("should not poll when disabled", () => {
    render(<NotificationBell onClick={vi.fn()} enabled={false} />);

    expect(mockUseUnreadCount).toHaveBeenCalledWith(false);
  });

  it("should tolerate a missing count", () => {
    mockUseUnreadCount.mockReturnValue({ data: undefined });

    render(<NotificationBell onClick={vi.fn()} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
