'use client';

import React, { useState } from 'react';
import { useListCampaigns, useCampaignRules, useCreateCampaign, useUpdateCampaignStatus } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Megaphone, Sliders, Play, Pause, Plus, Trash2, Calendar, RefreshCw, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CampaignsModule() {
  const { showToast } = useToast();

  // Listing State
  const [search, setSearch] = useState('');
  const { data: campaigns, isLoading: listLoading, refetch: refetchCampaigns } = useListCampaigns({
    search: search || undefined,
  });

  // Selected Campaign for Rules Management
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const selectedCampaign = campaigns?.find((c) => c.id === selectedCampaignId);

  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } = useCampaignRules(selectedCampaignId || '');

  // Campaigns Mutation state
  const statusMutation = useUpdateCampaignStatus();

  // Create Campaign Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const createMutation = useCreateCampaign();

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast('Campaign Name is required', 'warning');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        description,
        validFrom: validFrom ? new Date(validFrom).toISOString() : null,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      });
      showToast('Campaign created successfully!', 'success');
      setCreateOpen(false);
      setName('');
      setDescription('');
      setValidFrom('');
      setValidUntil('');
      refetchCampaigns();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create campaign', 'error');
    }
  };

  const handleToggleStatus = async (campaign: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await statusMutation.mutateAsync({ id: campaign.id, status: nextStatus });
      showToast(`Campaign transitioned to ${nextStatus.toLowerCase()}`, 'success');
      refetchCampaigns();
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      ACTIVE: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
      PAUSED: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
      DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/50',
      COMPLETED: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${classes[status as keyof typeof classes] || classes.DRAFT}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-12 select-none text-xs">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)]/10 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Rules Engine Campaigns</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Define loyalty multipliers, coin award multipliers, referral boosts, and transaction trigger rules.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-auto font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
        
        {/* LEFT COLUMN: LIST */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 border border-[var(--border)]/10 bg-[var(--surface)] rounded-2xl shadow-soft">
            <div className="flex-1 max-w-sm px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-2 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400"
              />
            </div>
            <button onClick={() => refetchCampaigns()} className="p-2 border border-[var(--border)]/10 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer">
              <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listLoading ? (
              <div className="h-40 bg-[var(--surface-hover)] rounded-2xl animate-pulse w-full col-span-2" />
            ) : campaigns && campaigns.length > 0 ? (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                    selectedCampaignId === c.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold'
                      : 'border-[var(--border)]/10 bg-[var(--surface)] hover:border-[var(--border)]/40 shadow-soft'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-[var(--foreground)] text-xs">{c.name}</h3>
                      <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mt-1">
                        {c.description || 'No description provided.'}
                      </p>
                    </div>
                    {getStatusBadge(c.status)}
                  </div>

                  <div className="mt-auto pt-3 border-t border-[var(--border)]/5 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'Immediate'}</span>
                    </span>
                    <button
                      onClick={(e) => handleToggleStatus(c, e)}
                      className={`px-2 py-1 rounded flex items-center gap-1 font-bold tracking-wide uppercase hover:bg-[var(--surface-hover)] transition-colors ${
                        c.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {c.status === 'ACTIVE' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{c.status === 'ACTIVE' ? 'Pause' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-16 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-2xl">
                No active reward campaigns recorded.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: RULES ENGINE PANEL */}
        <section className="flex flex-col gap-4">
          {selectedCampaign ? (
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft flex flex-col gap-4 relative">
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="absolute top-4 right-4 p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-[var(--border)]/10 pb-3 flex flex-col gap-1">
                <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Selected Ruleset</span>
                <h3 className="text-sm font-bold text-[var(--foreground)]">{selectedCampaign.name}</h3>
              </div>

              {/* Rules List */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Rule Conditions</h4>
                {rulesLoading ? (
                  <div className="py-6 text-center animate-pulse">Loading conditions...</div>
                ) : rules && rules.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {rules.map((rule: any) => (
                      <div
                        key={rule.id}
                        className="p-3 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[var(--foreground)]">{rule.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {rule.ruleType} {rule.operator} {rule.value}
                          </div>
                        </div>
                        <button
                          className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          title="Remove condition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-[var(--border)]/20 rounded-xl text-[var(--text-muted)]">
                    No active condition triggers set.
                  </div>
                )}
              </div>

              {/* simulated form to add rules */}
              <div className="border-t border-[var(--border)]/10 pt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Add Condition</span>
                <div className="grid grid-cols-2 gap-2">
                  <select className="px-2.5 py-1.5 border border-[var(--border)]/10 rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none text-[11px]">
                    <option value="MIN_PURCHASE">Min Purchase</option>
                    <option value="DAILY_LIMIT">Daily Limit</option>
                    <option value="LOYALTY_TIER">Loyalty Tier</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value (e.g. 500)"
                    className="px-2.5 py-1.5 border border-[var(--border)]/10 rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none text-[11px]"
                  />
                </div>
                <Button className="py-2 mt-1">
                  Add Condition Node
                </Button>
              </div>

            </div>
          ) : (
            <div className="p-8 border border-dashed border-[var(--border)]/20 bg-[var(--surface)]/50 rounded-2xl text-center text-[var(--text-muted)] flex flex-col items-center justify-center py-24 shadow-soft">
              <Sliders className="w-10 h-10 text-[var(--border)] mb-3 stroke-[1.2]" />
              <h4 className="text-xs font-bold text-[var(--foreground)]">Select a Campaign</h4>
              <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                Click on any campaign cards in the left dashboard to configure rules engine conditions.
              </p>
            </div>
          )}
        </section>

      </div>

      {/* CREATE CAMPAIGN DIALOG */}
      {createOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCreateOpen(false)} />
          <form
            onSubmit={handleCreateCampaign}
            className="relative max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-heavy p-6 flex flex-col gap-4 text-xs select-none"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-2">
              <h3 className="text-sm font-bold tracking-tight">Create New Campaign</h3>
              <button type="button" onClick={() => setCreateOpen(false)} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="c-name" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Campaign Name</label>
                <input
                  id="c-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="c-desc" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Description</label>
                <textarea
                  id="c-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="c-start" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Start Window</label>
                  <input
                    id="c-start"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="c-end" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Expiration Window</label>
                  <input
                    id="c-end"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)]/10 pt-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} className="w-auto">
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending} className="w-auto px-6">
                Create
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
