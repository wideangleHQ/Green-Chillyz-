"use client";

import { memo } from "react";
import Link from "next/link";
import { Coins, Sparkles, Package } from "lucide-react";
import { formatCoins } from "@/types/wallet";
import type { RewardListItem } from "@/types/rewards";

interface RewardCardProps {
  reward: RewardListItem;
  /** Current wallet balance, used to show an affordability hint. */
  balance?: number;
}

function RewardCardBase({ reward, balance }: RewardCardProps) {
  const affordable = balance === undefined || balance >= reward.coinCost;
  const lowStock =
    reward.remainingStock !== null && reward.remainingStock > 0 && reward.remainingStock <= 5;
  const soldOut = reward.remainingStock === 0 || reward.status === "SOLD_OUT";

  return (
    <Link
      href={`/rewards/${reward.slug}`}
      aria-label={`${reward.title}, ${reward.coinCost} coins`}
      className="group flex flex-col rounded-[24px] bg-white border border-white/80 shadow-xs overflow-hidden transition-all hover:shadow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
    >
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        {reward.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reward.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-stone-300">
            <Package className="size-10" aria-hidden="true" />
          </div>
        )}

        {reward.isFeatured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-brand-green px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-white shadow-xs">
            <Sparkles className="size-3" aria-hidden="true" />
            Featured
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-on-surface">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {reward.category && (
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
            {reward.category.name}
          </span>
        )}

        <h3 className="font-sans font-extrabold uppercase tracking-tight text-on-surface text-sm leading-snug line-clamp-2">
          {reward.title}
        </h3>

        {reward.shortDescription && (
          <p className="text-xs font-sans text-stone-500 line-clamp-2">
            {reward.shortDescription}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-sans font-extrabold ${
              affordable
                ? "bg-brand-green/10 text-brand-green"
                : "bg-stone-100 text-stone-400"
            }`}
          >
            <Coins className="size-4" aria-hidden="true" />
            {formatCoins(reward.coinCost)}
          </span>

          {lowStock && (
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600">
              {reward.remainingStock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Catalog lists re-render on filter changes; memo keeps untouched cards static. */
export const RewardCard = memo(RewardCardBase);
