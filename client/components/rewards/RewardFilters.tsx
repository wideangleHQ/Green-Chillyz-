"use client";

import { memo } from "react";
import { Search, X } from "lucide-react";
import type { RewardCategory, RewardSort } from "@/types/rewards";

interface RewardFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: RewardCategory[];
  activeCategory?: string;
  onCategoryChange: (slug?: string) => void;
  sort: RewardSort;
  onSortChange: (sort: RewardSort) => void;
}

const SORT_OPTIONS: Array<{ value: RewardSort; label: string }> = [
  { value: "priority", label: "Recommended" },
  { value: "coinCostAsc", label: "Coins: Low to High" },
  { value: "coinCostDesc", label: "Coins: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
];

function RewardFiltersBase({
  search,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
}: RewardFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rewards"
            aria-label="Search rewards"
            className="w-full rounded-full border border-white/80 bg-white pl-11 pr-10 py-3 text-sm font-sans text-on-surface shadow-xs outline-none transition-all placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-brand-green"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <label className="sr-only" htmlFor="reward-sort">
          Sort rewards
        </label>
        <select
          id="reward-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as RewardSort)}
          className="rounded-full border border-white/80 bg-white px-5 py-3 text-sm font-sans font-medium text-on-surface shadow-xs outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-green cursor-pointer"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div
        role="group"
        aria-label="Filter by category"
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      >
        <FilterChip
          label="All"
          active={!activeCategory}
          onClick={() => onCategoryChange(undefined)}
        />
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            count={category.rewardCount}
            active={activeCategory === category.slug}
            onClick={() => onCategoryChange(category.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green ${
        active
          ? "bg-brand-green text-white shadow-xs"
          : "bg-white text-stone-500 border border-white/80 hover:text-on-surface"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={active ? "ml-1.5 text-white/70" : "ml-1.5 text-stone-400"}>
          {count}
        </span>
      )}
    </button>
  );
}

export const RewardFilters = memo(RewardFiltersBase);
