'use client';

import React, { useState } from 'react';
import { useRewardProfiles, useDefaultProfile, useMyAssignment, useMyProfile } from '@/hooks/useRewardManagement';
import { Layers, Star, CheckCircle2, Archive, Clock, ChevronRight } from 'lucide-react';

export default function RewardProfilesPage() {
  const [params, setParams] = useState<{ page?: number; pageSize?: number; status?: string }>({ page: 1, pageSize: 20 });
  const { data: profiles, isLoading } = useRewardProfiles(params);
  const { data: defaultProfile } = useDefaultProfile();
  const { data: myAssignment } = useMyAssignment();
  const { data: myProfile } = useMyProfile();

  const statusColor: Record<string, string> = {
    ACTIVE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    DRAFT: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    ARCHIVED: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Reward Profiles</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage reward profile configurations and versioning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Default Profile</div>
          <div className="text-sm font-bold mt-1 text-[var(--foreground)]">{defaultProfile?.name || 'Not set'}</div>
          {defaultProfile?.status && (
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor[defaultProfile.status] || ''}`}>
              {defaultProfile.status}
            </span>
          )}
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">My Store Assignment</div>
          <div className="text-sm font-bold mt-1 text-[var(--foreground)]">{myAssignment ? 'Assigned' : 'None'}</div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">My Active Profile</div>
          <div className="text-sm font-bold mt-1 text-[var(--foreground)]">{(myProfile as any)?.name || 'Inherited'}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'].map((s) => (
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
        ) : (
          <div className="divide-y divide-[var(--border)]/5">
            {(Array.isArray(profiles) ? profiles : (profiles as any)?.items || (profiles as any)?.data || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                      {p.name}
                      {p.isDefault && <Star className="w-3 h-3 text-amber-500" />}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      v{p.version || 1} &middot; {p.rulesCount ?? '—'} rules
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor[p.status] || 'text-zinc-500'}`}>
                    {p.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
            {(!profiles || (Array.isArray(profiles) ? profiles.length === 0 : !(profiles as any)?.items?.length)) && (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">No profiles found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
