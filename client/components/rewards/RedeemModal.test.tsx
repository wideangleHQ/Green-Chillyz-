import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RedeemModal } from "./RedeemModal";
import type { RewardDetail, EligibilityResult } from "@/types/rewards";

const reward = {
  id: "reward-1",
  title: "Free Coffee",
  slug: "free-coffee",
  coinCost: 100,
  shortDescription: null,
  image: null,
  rewardType: "FREE_ITEM",
  availability: "GLOBAL",
  status: "PUBLISHED",
  isFeatured: false,
  priority: 0,
  remainingStock: null,
  category: null,
  brand: null,
  validUntil: null,
  description: null,
  bannerImage: null,
  cashAmount: null,
  terms: null,
  userLimit: null,
  dailyLimit: null,
  minimumLoyaltyTier: null,
  validFrom: null,
  voucherValidDays: 30,
  totalRedemptions: 0,
  stores: [],
  metadata: null,
} as RewardDetail;

const eligible: EligibilityResult = {
  eligible: true,
  checks: [],
  balance: 500,
  coinCost: 100,
  shortBy: 0,
};

describe("RedeemModal", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onConfirm: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onConfirm = vi.fn();
  });

  const renderModal = (props: Partial<Parameters<typeof RedeemModal>[0]> = {}) =>
    render(
      <RedeemModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        reward={reward}
        eligibility={eligible}
        isRedeeming={false}
        {...props}
      />,
    );

  it("should render nothing when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render as a labelled modal dialog", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Confirm Redemption")).toBeInTheDocument();
  });

  it("should show the cost and resulting balance", () => {
    renderModal();

    expect(screen.getByText("Reward cost")).toBeInTheDocument();
    expect(screen.getByText("Balance after")).toBeInTheDocument();
    expect(screen.getByText("400 coins")).toBeInTheDocument();
  });

  it("should confirm on click", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Redeem" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should cancel on click", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should close on Escape", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not close on Escape while redeeming", async () => {
    const user = userEvent.setup();
    renderModal({ isRedeeming: true });

    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should focus the confirm button on open", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Redeem" })).toHaveFocus();
  });

  it("should disable confirm when ineligible", () => {
    renderModal({
      eligibility: {
        eligible: false,
        reason: "Insufficient coin balance for this reward",
        checks: [],
        balance: 10,
        coinCost: 100,
        shortBy: 90,
      },
    });

    expect(screen.getByRole("button", { name: "Redeem" })).toBeDisabled();
  });

  it("should surface the ineligibility reason as an alert", () => {
    renderModal({
      eligibility: {
        eligible: false,
        reason: "Insufficient coin balance for this reward",
        checks: [],
        balance: 10,
        coinCost: 100,
        shortBy: 90,
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Insufficient coin balance for this reward",
    );
  });

  it("should surface a server error as an alert", () => {
    renderModal({ error: "Reward is out of stock" });

    expect(screen.getByRole("alert")).toHaveTextContent("Reward is out of stock");
  });

  it("should disable both actions while redeeming", () => {
    renderModal({ isRedeeming: true });

    expect(screen.getByRole("button", { name: /Redeeming/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("should trap Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    renderModal();

    // Confirm is last in DOM order; Tab from it must wrap to the first control.
    await user.tab();

    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
  });
});
