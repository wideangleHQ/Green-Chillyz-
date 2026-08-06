'use client';

import React, { useState } from 'react';
import { useRewardRules, useMilestones } from '@/hooks/useRewardManagement';
import { GitBranch, Coins, ChevronRight } from 'lucide-react';

export default function RewardRulesPage() {
  const [params, setParams] = useState<{ page?: number; pageSize?: number }>({ page: 1, pageSize: 20 });
  const { data: rules, isLoading } = useRewardRules(params);
  const { data: milestones, isLoading: milestonesLoading } = useMilestones();

  const ruleTypeColor: Record<string, string> = {
    COIN_MILESTONE: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    PURCHASE_REWARD: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    SIGNUP_BONUS: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    REFERRAL_REWARD: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
  };

  const rulesList = Array.isArray(rules) ? rules : (rules as any)?.items || (rules as any)?.data || [];
  const milestonesList = Array.isArray(milestones) ? milestones : (milestones as any)?.items || (milestones as any)?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Reward Rules</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure coin milestones, reward triggers, and rule behavior</p>
      </div>

      {milestonesList.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Coin Milestones</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {milestonesList.map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft text-center">
                <Coins className="w-5 h-5 text-amber-500 mx-auto" />
                <div className="text-sm font-bold mt-1">{m.coinRequirement?.toLocaleString() || '—'}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{m.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]/5">
            {rulesList.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--foreground)]">{r.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {r.coinRequirement?.toLocaleString() || 0} coins &middot; {r.rewardType || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ruleTypeColor[r.ruleType] || 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                    {r.ruleType?.replace(/_/g, ' ') || r.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
            {rulesList.length === 0 && (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">No rules configured</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
