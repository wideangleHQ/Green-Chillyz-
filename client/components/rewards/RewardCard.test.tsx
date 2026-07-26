import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RewardCard } from "./RewardCard";
import type { RewardListItem } from "@/types/rewards";

const makeReward = (overrides: Partial<RewardListItem> = {}): RewardListItem => ({
  id: "reward-1",
  title: "Free Coffee",
  slug: "free-coffee",
  shortDescription: "A hot cup on us",
  image: null,
  coinCost: 100,
  rewardType: "FREE_ITEM",
  availability: "GLOBAL",
  status: "PUBLISHED",
  isFeatured: false,
  priority: 0,
  remainingStock: null,
  category: { id: "cat-1", name: "Beverages", slug: "beverages" },
  brand: null,
  validUntil: null,
  ...overrides,
});

describe("RewardCard", () => {
  it("should render the title, cost and category", () => {
    render(<RewardCard reward={makeReward()} />);

    expect(screen.getByText("Free Coffee")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Beverages")).toBeInTheDocument();
  });

  it("should link to the reward detail page", () => {
    render(<RewardCard reward={makeReward()} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/rewards/free-coffee");
  });

  it("should expose an accessible label with the cost", () => {
    render(<RewardCard reward={makeReward()} />);

    expect(
      screen.getByRole("link", { name: /Free Coffee, 100 coins/i }),
    ).toBeInTheDocument();
  });

  it("should show a featured badge when featured", () => {
    render(<RewardCard reward={makeReward({ isFeatured: true })} />);

    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("should mark a sold-out reward", () => {
    render(<RewardCard reward={makeReward({ remainingStock: 0 })} />);

    expect(screen.getByText("Sold Out")).toBeInTheDocument();
  });

  it("should warn on low stock", () => {
    render(<RewardCard reward={makeReward({ remainingStock: 3 })} />);

    expect(screen.getByText("3 left")).toBeInTheDocument();
  });

  it("should not warn when stock is comfortable", () => {
    render(<RewardCard reward={makeReward({ remainingStock: 50 })} />);

    expect(screen.queryByText(/left$/)).not.toBeInTheDocument();
  });

  it("should dim the cost when the balance is too low", () => {
    render(<RewardCard reward={makeReward({ coinCost: 500 })} balance={100} />);

    expect(screen.getByText("500").className).toContain("text-stone-400");
  });

  it("should highlight the cost when affordable", () => {
    render(<RewardCard reward={makeReward({ coinCost: 50 })} balance={100} />);

    expect(screen.getByText("50").className).toContain("text-brand-green");
  });

  it("should render an image with an empty alt so the link label is not duplicated", () => {
    render(<RewardCard reward={makeReward({ image: "https://cdn/x.png" })} />);

    const img = document.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
  });
});
