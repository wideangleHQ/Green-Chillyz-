'use client';

import React from 'react';
import { useMyOverrides, usePreviewMyRewards, useMyOverrideHistory } from '@/hooks/useRewardManagement';
import { Target, Eye, Clock, ChevronRight } from 'lucide-react';

export default function RewardOverridesPage() {
  const { data: overrides, isLoading } = useMyOverrides({});
  const { data: preview, isLoading: previewLoading } = usePreviewMyRewards();
  const { data: history } = useMyOverrideHistory();

  const overridesList = Array.isArray(overrides) ? overrides : (overrides as any)?.items || (overrides as any)?.data || [];
  const previewList = Array.isArray(preview) ? preview : (preview as any)?.items || (preview as any)?.data || [];
  const historyList = Array.isArray(history) ? history : (history as any)?.items || (history as any)?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Reward Overrides</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Store-level overrides to reward rules and effective reward preview</p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Effective Rewards Preview</h2>
        </div>
        <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden">
          {previewLoading ? (
            <div className="p-6 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : previewList.length > 0 ? (
            <div className="divide-y divide-[var(--border)]/5">
              {previewList.map((r: any, i: number) => (
                <div key={r.ruleId || i} className="flex items-center justify-between px-5 py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${r.source === 'OVERRIDE' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'}`}>
                      {r.source}
                    </span>
                    <span className="font-semibold">{r.ruleName}</span>
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {r.coinRequirement?.toLocaleString() || 0} coins &middot; {r.rewardType}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">No effective rewards for this store</div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Overrides</h2>
        <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden">
          {isLoading ? (
            <div className="p-6 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : overridesList.length > 0 ? (
            <div className="divide-y divide-[var(--border)]/5">
              {overridesList.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{o.rule?.name || o.ruleId}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Override: {o.overrideRewardType || 'N/A'} &middot; {o.overrideCoinRequirement ?? '—'} coins
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">No overrides set for this store</div>
          )}
        </div>
      </section>

      {historyList.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Override History</h2>
          </div>
          <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden">
            <div className="divide-y divide-[var(--border)]/5">
              {historyList.slice(0, 10).map((h: any, i: number) => (
                <div key={h.id || i} className="px-5 py-3 text-xs flex items-center justify-between">
                  <span className="font-semibold">{h.action || h.eventType || 'Change'}</span>
                  <span className="text-[var(--text-muted)]">{new Date(h.createdAt || h.occurredAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
