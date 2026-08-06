'use client';

import React from 'react';
import { useCoinRules, useCoinGameRules, useCoinDailyLimits, useCoinBonuses, useListCoinRules, useListCoinLimits, useListCoinMultipliers } from '@/hooks/useCoinEconomy';
import { Coins, Gamepad2, Timer, Zap, TrendingUp } from 'lucide-react';

export default function CoinEconomyPage() {
  const { data: economyRules, isLoading: rulesLoading } = useCoinRules();
  const { data: gameRules } = useCoinGameRules();
  const { data: dailyLimits } = useCoinDailyLimits();
  const { data: bonuses } = useCoinBonuses();
  const { data: coinRules } = useListCoinRules({});
  const { data: coinLimits } = useListCoinLimits();
  const { data: coinMultipliers } = useListCoinMultipliers();

  const eRules = Array.isArray(economyRules) ? economyRules : (economyRules as any)?.items || (economyRules as any)?.data || [];
  const gRules = Array.isArray(gameRules) ? gameRules : (gameRules as any)?.items || (gameRules as any)?.data || [];
  const dLimits = Array.isArray(dailyLimits) ? dailyLimits : (dailyLimits as any)?.items || (dailyLimits as any)?.data || [];
  const bList = Array.isArray(bonuses) ? bonuses : (bonuses as any)?.items || (bonuses as any)?.data || [];
  const cRules = Array.isArray(coinRules) ? coinRules : (coinRules as any)?.items || (coinRules as any)?.data || [];
  const cLimits = Array.isArray(coinLimits) ? coinLimits : (coinLimits as any)?.items || (coinLimits as any)?.data || [];
  const cMultipliers = Array.isArray(coinMultipliers) ? coinMultipliers : (coinMultipliers as any)?.items || (coinMultipliers as any)?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Coin Economy</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Rules, limits, multipliers, and bonuses controlling coin issuance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Coin Rules</span>
          </div>
          <div className="text-xl font-bold mt-2">{cRules.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Gamepad2 className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Game Rules</span>
          </div>
          <div className="text-xl font-bold mt-2">{gRules.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Timer className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Daily Limits</span>
          </div>
          <div className="text-xl font-bold mt-2">{cLimits.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Multipliers</span>
          </div>
          <div className="text-xl font-bold mt-2">{cMultipliers.length}</div>
        </div>
      </div>

      {eRules.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Economy Rules</h2>
          <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden divide-y divide-[var(--border)]/5">
            {eRules.map((r: any, i: number) => (
              <div key={r.id || i} className="px-5 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">{r.name || r.ruleType}</span>
                </div>
                <span className="text-[var(--text-muted)]">{r.baseCoins || r.coins || '—'} coins</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {bList.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Available Bonuses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bList.map((b: any, i: number) => (
              <div key={b.id || i} className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold">{b.name || b.ruleType}</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">{b.description || `${b.multiplier || 1}x multiplier`}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cRules.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">All Coin Rules</h2>
          <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden divide-y divide-[var(--border)]/5">
            {cRules.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{r.ruleType?.replace(/_/g, ' ')}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${r.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {rulesLoading && eRules.length === 0 && cRules.length === 0 && (
        <div className="p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
