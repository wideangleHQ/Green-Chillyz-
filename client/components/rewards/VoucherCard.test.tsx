import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoucherCard } from "./VoucherCard";
import type { Voucher, VoucherStatus } from "@/types/rewards";

const makeVoucher = (overrides: Partial<Voucher> = {}): Voucher => ({
  id: "voucher-1",
  code: "ABCD1234EFGH",
  status: "ACTIVE",
  qrCodeDataUrl: "data:image/png;base64,iVBORw0KGgo=",
  expiresAt: "2026-12-31T00:00:00.000Z",
  redeemedAt: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  reward: {
    id: "reward-1",
    title: "Free Coffee",
    slug: "free-coffee",
    image: null,
    coinCost: 100,
    rewardType: "FREE_ITEM",
  },
  store: { id: "store-1", name: "Bhubaneswar Central" },
  ...overrides,
});

describe("VoucherCard", () => {
  it("should render the reward title, code and store", () => {
    render(<VoucherCard voucher={makeVoucher()} />);

    expect(screen.getByText("Free Coffee")).toBeInTheDocument();
    expect(screen.getByText("ABCD1234EFGH")).toBeInTheDocument();
    expect(screen.getByText("Bhubaneswar Central")).toBeInTheDocument();
  });

  it("should show the active status badge", () => {
    render(<VoucherCard voucher={makeVoucher()} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it.each<[VoucherStatus, string]>([
    ["USED", "Used"],
    ["EXPIRED", "Expired"],
    ["CANCELLED", "Cancelled"],
    ["INVALID", "Invalid"],
  ])("should label a %s voucher as %s", (status, label) => {
    render(<VoucherCard voucher={makeVoucher({ status })} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("should offer the QR toggle only for active vouchers", () => {
    render(<VoucherCard voucher={makeVoucher()} />);

    expect(screen.getByRole("button", { name: /Show QR Code/i })).toBeInTheDocument();
  });

  it("should hide the QR toggle for a used voucher", () => {
    render(
      <VoucherCard voucher={makeVoucher({ status: "USED", qrCodeDataUrl: null })} />,
    );

    expect(screen.queryByRole("button", { name: /QR Code/i })).not.toBeInTheDocument();
  });

  it("should reveal the QR image on toggle", async () => {
    const user = userEvent.setup();
    render(<VoucherCard voucher={makeVoucher()} />);

    await user.click(screen.getByRole("button", { name: /Show QR Code/i }));

    expect(
      screen.getByRole("img", { name: /QR code for voucher ABCD1234EFGH/i }),
    ).toBeInTheDocument();
  });

  it("should track expanded state with aria-expanded", async () => {
    const user = userEvent.setup();
    render(<VoucherCard voucher={makeVoucher()} />);

    const toggle = screen.getByRole("button", { name: /Show QR Code/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: /Hide QR Code/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("should collapse the QR again on second toggle", async () => {
    const user = userEvent.setup();
    render(<VoucherCard voucher={makeVoucher()} />);

    await user.click(screen.getByRole("button", { name: /Show QR Code/i }));
    await user.click(screen.getByRole("button", { name: /Hide QR Code/i }));

    expect(screen.queryByRole("img", { name: /QR code/i })).not.toBeInTheDocument();
  });

  it("should show the redemption date for a used voucher", () => {
    render(
      <VoucherCard
        voucher={makeVoucher({
          status: "USED",
          qrCodeDataUrl: null,
          redeemedAt: "2026-07-20T00:00:00.000Z",
        })}
      />,
    );

    expect(screen.getByText(/Used on/i)).toBeInTheDocument();
  });

  it("should show the expiry for an active voucher", () => {
    render(<VoucherCard voucher={makeVoucher()} />);

    expect(screen.getByText(/Valid until/i)).toBeInTheDocument();
  });

  it("should be keyboard operable", async () => {
    const user = userEvent.setup();
    render(<VoucherCard voucher={makeVoucher()} />);

    await user.tab();
    expect(screen.getByRole("button", { name: /Show QR Code/i })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("img", { name: /QR code/i })).toBeInTheDocument();
  });
});
