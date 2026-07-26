import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationCard } from "./NotificationCard";
import type { AppNotification } from "@/types/notifications";

const makeNotification = (
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id: "notif-1",
  title: "You earned 50 coins",
  message: "Cashback applied. Balance is now 550 coins.",
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

describe("NotificationCard", () => {
  it("should render title and message", () => {
    render(
      <NotificationCard notification={makeNotification()} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("You earned 50 coins")).toBeInTheDocument();
    expect(screen.getByText(/Balance is now 550 coins/)).toBeInTheDocument();
  });

  it("should mark unread notifications", () => {
    render(
      <NotificationCard notification={makeNotification()} onSelect={vi.fn()} />,
    );

    expect(screen.getByLabelText("Unread")).toBeInTheDocument();
  });

  it("should not mark read notifications", () => {
    render(
      <NotificationCard
        notification={makeNotification({ status: "READ" })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Unread")).not.toBeInTheDocument();
  });

  it("should show a relative timestamp", () => {
    render(
      <NotificationCard notification={makeNotification()} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("should show the action label", () => {
    render(
      <NotificationCard notification={makeNotification()} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("View Wallet")).toBeInTheDocument();
  });

  it("should flag a critical priority", () => {
    render(
      <NotificationCard
        notification={makeNotification({ priority: "CRITICAL", type: "SECURITY" })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("should flag a high priority", () => {
    render(
      <NotificationCard
        notification={makeNotification({ priority: "HIGH" })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Important")).toBeInTheDocument();
  });

  it("should not flag a normal priority", () => {
    render(
      <NotificationCard notification={makeNotification()} onSelect={vi.fn()} />,
    );

    expect(screen.queryByText("Urgent")).not.toBeInTheDocument();
    expect(screen.queryByText("Important")).not.toBeInTheDocument();
  });

  it("should call onSelect when the body is activated", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const notification = makeNotification();

    render(<NotificationCard notification={notification} onSelect={onSelect} />);
    await user.click(screen.getByText("You earned 50 coins"));

    expect(onSelect).toHaveBeenCalledWith(notification);
  });

  it("should archive with an accessible label", async () => {
    const onArchive = vi.fn();
    const user = userEvent.setup();

    render(
      <NotificationCard
        notification={makeNotification()}
        onSelect={vi.fn()}
        onArchive={onArchive}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Archive notification/i }),
    );

    expect(onArchive).toHaveBeenCalledWith("notif-1");
  });

  it("should delete with an accessible label", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <NotificationCard
        notification={makeNotification()}
        onSelect={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Delete notification/i }));

    expect(onDelete).toHaveBeenCalledWith("notif-1");
  });

  it("should omit action buttons when no handlers are given", () => {
    render(
      <NotificationCard notification={makeNotification()} onSelect={vi.fn()} />,
    );

    expect(
      screen.queryByRole("button", { name: /Archive/i }),
    ).not.toBeInTheDocument();
  });

  it("should never render raw metadata", () => {
    const { container } = render(
      <NotificationCard
        notification={makeNotification()}
        onSelect={vi.fn()}
      />,
    );

    expect(container.textContent).not.toContain("metadata");
    expect(container.textContent).not.toContain("dedupeKey");
  });

  it("should be keyboard operable", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <NotificationCard notification={makeNotification()} onSelect={onSelect} />,
    );

    await user.tab();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalled();
  });
});
