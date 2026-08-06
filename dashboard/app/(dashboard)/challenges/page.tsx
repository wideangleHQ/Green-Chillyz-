'use client';

import React, { useState } from 'react';
import { useChallenges } from '@/hooks/useChallenges';
import { Trophy, ChevronRight, Calendar } from 'lucide-react';

export default function ChallengesPage() {
  const [params, setParams] = useState<{ status?: string; page?: number; pageSize?: number }>({ page: 1, pageSize: 20 });
  const { data: challenges, isLoading } = useChallenges(params);

  const list = Array.isArray(challenges) ? challenges : (challenges as any)?.items || (challenges as any)?.data || [];

  const statusColor: Record<string, string> = {
    ACTIVE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    DRAFT: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    PAUSED: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    COMPLETED: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    ARCHIVED: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Challenges</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Challenge engine campaigns and customer engagement triggers</p>
      </div>

      <div className="flex gap-2">
        {['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setParams((p) => ({ ...p, status: s === 'ALL' ? undefined : s, page: 1 }))}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              (params.status || 'ALL') === (s === 'ALL' ? undefined : s) || (!params.status && s === 'ALL')
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border)]/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length > 0 ? (
          <div className="divide-y divide-[var(--border)]/5">
            {list.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--foreground)]">{c.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'No start'} — {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'Ongoing'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor[c.status] || 'text-zinc-500'}`}>
                    {c.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
            <Trophy className="w-8 h-8 text-[var(--border)] mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold">No challenges found</p>
            <p className="text-[10px] mt-1 max-w-[220px]">Challenges will appear here once configured in the engine.</p>
          </div>
        )}
      </div>
    </div>
  );
}
