'use client';

import React from 'react';
import { usePreviewMyRewards } from '@/hooks/useRewardManagement';
import { Gift, TrendingUp, Trophy, Sparkles } from 'lucide-react';

export default function RewardPreviewPage() {
  const { data, isLoading, error } = usePreviewMyRewards();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--border)] border-t-[var(--color-primary)]"></div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading reward preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Error loading reward preview</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data || !data.rewards || data.rewards.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <Gift className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
        <p className="text-sm font-semibold text-[var(--foreground)] mb-1">No rewards configured</p>
        <p className="text-xs text-[var(--text-muted)]">Configure reward rules to see them here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Reward Preview</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This shows the rewards customers will receive based on your current configuration and store-specific overrides
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.rewards.map((reward: any, index: number) => (
          <div
            key={reward.id || index}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 hover:shadow-soft transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {reward.type === 'coins' && <span className="text-2xl">🪙</span>}
                {reward.type === 'milestone' && <Trophy className="w-6 h-6 text-yellow-600" />}
                {reward.type === 'bonus' && <TrendingUp className="w-6 h-6 text-green-600" />}
                {!reward.type && <Gift className="w-6 h-6 text-[var(--color-primary)]" />}
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded ${
                  reward.isOverridden
                    ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                    : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                }`}
              >
                {reward.isOverridden ? 'OVERRIDDEN' : 'DEFAULT'}
              </span>
            </div>

            <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
              {reward.name || reward.ruleName || 'Unnamed Reward'}
            </h3>

            {reward.description && (
              <p className="text-xs text-[var(--text-muted)] mb-3">{reward.description}</p>
            )}

            <div className="space-y-2 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Trigger:</span>
                <span className="text-xs font-bold text-[var(--foreground)] uppercase">
                  {reward.triggerType || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Value:</span>
                <span className="text-xs font-bold text-[var(--color-primary)]">
                  {reward.value || 0} {reward.type === 'coins' ? 'coins' : ''}
                </span>
              </div>
              {typeof reward.priority !== 'undefined' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Priority:</span>
                  <span className="text-xs font-mono text-[var(--foreground)]">{reward.priority}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
