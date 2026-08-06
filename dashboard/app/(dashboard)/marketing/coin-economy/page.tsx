'use client';

import React from 'react';
import { useCoinRules, useCoinGameRules, useCoinDailyLimits, useCoinBonuses } from '@/hooks/useCoinEconomy';
import { StatCard } from '@/components/ui/StatCard';
import { Coins, Gamepad2, Clock, TrendingUp } from 'lucide-react';

export default function CoinEconomyPage() {
  const { data: rules, isLoading: rulesLoading } = useCoinRules();
  const { data: gameRules, isLoading: gameLoading } = useCoinGameRules();
  const { data: limits, isLoading: limitsLoading } = useCoinDailyLimits();
  const { data: bonuses, isLoading: bonusesLoading } = useCoinBonuses();

  const isLoading = rulesLoading || gameLoading || limitsLoading || bonusesLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Earning Rules"
          value={rules?.length || 0}
          icon={<Coins className="w-5 h-5" />}
          loading={rulesLoading}
        />
        <StatCard
          title="Game Rules"
          value={gameRules?.length || 0}
          icon={<Gamepad2 className="w-5 h-5" />}
          loading={gameLoading}
        />
        <StatCard
          title="Daily Limits"
          value={limits?.length || 0}
          icon={<Clock className="w-5 h-5" />}
          loading={limitsLoading}
        />
        <StatCard
          title="Active Bonuses"
          value={bonuses?.length || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={bonusesLoading}
        />
      </div>

      {/* Earning Rules */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-yellow-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Coin Earning Rules</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : rules && rules.length > 0 ? (
          <div className="space-y-3">
            {rules.map((rule: any, index: number) => (
              <div key={rule.id || index} className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--foreground)] mb-1">{rule.name || rule.action}</p>
                  <p className="text-xs text-[var(--text-muted)]">{rule.description || `Earn coins for ${rule.action}`}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <span className="text-lg">🪙</span>
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{rule.coins || rule.value || 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No earning rules configured</p>
        )}
      </div>

      {/* Game Rules */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Game Coin Rules</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : gameRules && gameRules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameRules.map((rule: any, index: number) => (
              <div key={rule.id || index} className="p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg">
                <p className="text-sm font-bold text-[var(--foreground)] mb-2">{rule.gameName || rule.gameType}</p>
                <div className="space-y-1">
                  {rule.winCoins && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Win:</span>
                      <span className="font-bold text-green-600">🪙 {rule.winCoins}</span>
                    </div>
                  )}
                  {rule.playCoins && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Play:</span>
                      <span className="font-bold text-yellow-600">🪙 {rule.playCoins}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No game rules configured</p>
        )}
      </div>

      {/* Daily Limits & Bonuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Daily Limits</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-[var(--surface-hover)] rounded"></div>
              ))}
            </div>
          ) : limits && limits.length > 0 ? (
            <div className="space-y-2">
              {limits.map((limit: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)]/50 rounded">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{limit.name || limit.type}</span>
                  <span className="text-sm font-bold text-[var(--color-primary)]">🪙 {limit.maxCoins || limit.limit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No daily limits configured</p>
          )}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Active Bonuses</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-[var(--surface-hover)] rounded"></div>
              ))}
            </div>
          ) : bonuses && bonuses.length > 0 ? (
            <div className="space-y-2">
              {bonuses.map((bonus: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)]/50 rounded">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{bonus.name || bonus.type}</span>
                  <span className="text-sm font-bold text-green-600">+{bonus.multiplier || bonus.bonus}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No active bonuses</p>
          )}
        </div>
      </div>
    </div>
  );
}
