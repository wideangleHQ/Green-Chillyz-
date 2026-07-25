"use client";

import { Coins, TrendingUp, TrendingDown, Clock } from "lucide-react";
import type { WalletSummary } from "@/types/wallet";
import { formatCoins } from "@/types/wallet";

interface WalletSummaryCardProps {
  summary: WalletSummary;
}

export function WalletSummaryCard({ summary }: WalletSummaryCardProps) {
  return (
    <div className="w-full bg-gradient-to-br from-brand-green to-brand-green-hover rounded-[28px] p-6 md:p-8 text-white shadow-soft">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
          <Coins className="size-6" />
        </div>
        <div>
          <p className="text-xs font-sans font-bold uppercase tracking-wider text-white/70">
            Your Balance
          </p>
          <p className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
            {formatCoins(summary.balance)}
            <span className="text-sm font-sans font-bold ml-1 text-white/80">coins</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Today"
          value={formatCoins(summary.todayEarnings)}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="This Month"
          value={formatCoins(summary.monthEarnings)}
        />
        <StatCard
          icon={<TrendingDown className="size-4" />}
          label="Total Spent"
          value={formatCoins(summary.lifetimeSpent)}
        />
        <StatCard
          icon={<Clock className="size-4" />}
          label="Lifetime Earned"
          value={formatCoins(summary.lifetimeEarned)}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-white/60">{icon}</span>
        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-white/60">
          {label}
        </span>
      </div>
      <p className="text-lg font-heading font-extrabold">{value}</p>
    </div>
  );
}
