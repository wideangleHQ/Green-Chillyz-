'use client';

import React, { useState } from 'react';
import { useListRewards, useCreateReward, useUpdateReward, useDeleteReward } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Percent, Plus, Search, Edit3, Trash2, Calendar, ShoppingBag, X, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OffersModule() {
  const { showToast } = useToast();

  // Query State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Query rewards, specifically focusing on Discount / BOGO types
  const { data: offers, isLoading, refetch } = useListRewards({
    search: search || undefined,
    page,
    pageSize,
  });

  // Filter client-side to ensure we focus on promotional offers
  const promoOffers = offers?.items.filter(
    (item) => item.rewardType === 'DISCOUNT' || item.rewardType === 'BUY_ONE_GET_ONE' || item.rewardType === 'LIMITED_TIME'
  ) || [];

  // Form Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coinCost, setCoinCost] = useState(50);
  const [rewardType, setRewardType] = useState('DISCOUNT');
  const [status, setStatus] = useState('DRAFT');
  const [stock, setStock] = useState(100);

  const createMutation = useCreateReward();
  const updateMutation = useUpdateReward();
  const deleteMutation = useDeleteReward();

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setCoinCost(50);
    setRewardType('DISCOUNT');
    setStatus('DRAFT');
    setStock(100);
    setEditorOpen(true);
  };

  const handleOpenEdit = (offer: any) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setSlug(offer.slug);
    setDescription(offer.description || '');
    setCoinCost(offer.coinCost);
    setRewardType(offer.rewardType);
    setStatus(offer.status);
    setStock(offer.stock || 100);
    setEditorOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      showToast('Title and Slug are required', 'warning');
      return;
    }

    const payload = {
      title,
      slug,
      description,
      coinCost: Number(coinCost),
      rewardType,
      status,
      stock: Number(stock),
    };

    try {
      if (editingOffer) {
        await updateMutation.mutateAsync({ id: editingOffer.id, dto: payload });
        showToast('Offer updated successfully!', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Offer created successfully!', 'success');
      }
      setEditorOpen(false);
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save offer', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Offer deleted successfully', 'success');
      refetch();
    } catch {
      showToast('Failed to delete offer', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-12 select-none text-xs">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)]/10 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Promotional Discounts & Offers</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Configure Buy-One-Get-One deals, percent menu discounts, and time-restricted branch campaigns.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-auto font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Store Offer</span>
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 p-4 border border-[var(--border)]/10 bg-[var(--surface)] rounded-2xl shadow-soft">
        <div className="flex-1 max-w-sm px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search active offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400"
          />
        </div>
        <button onClick={() => refetch()} className="p-2 border border-[var(--border)]/10 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer ml-auto">
          <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* OFFERS TABLE LISTING */}
      <div className="border border-[var(--border)]/10 rounded-2xl bg-[var(--surface)] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
          </div>
        ) : promoOffers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]/15 text-[var(--text-muted)] font-semibold bg-zinc-50/50 dark:bg-zinc-900/20">
                  <th className="p-4">Offer Campaign</th>
                  <th className="p-4">Promotion Type</th>
                  <th className="p-4">Coins Cost</th>
                  <th className="p-4">Usage Stats</th>
                  <th className="p-4">Stock Limit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/5">
                {promoOffers.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--foreground)]">{o.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-[240px] truncate">{o.description || 'No description'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                        {o.rewardType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{o.coinCost} coins</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-[var(--foreground)]">
                        <TrendingUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{o.totalRedemptions} redemptions</span>
                      </div>
                    </td>
                    <td className="p-4 text-[var(--text-muted)]">{o.stock !== null ? `${o.stock} units` : 'Unlimited'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border ${
                        o.status === 'PUBLISHED'
                          ? 'border-emerald-100 dark:border-emerald-900/30 text-emerald-600'
                          : 'border-zinc-200 dark:border-zinc-700/50 text-[var(--text-muted)]'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                          title="Edit offer"
                        >
                          <Edit3 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Delete offer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-2xl">
            <Percent className="w-12 h-12 text-[var(--border)] mb-3 stroke-[1.2]" />
            <h4 className="text-sm font-semibold text-[var(--foreground)]">No promotions found</h4>
            <p className="text-xs max-w-sm mt-1 mx-auto leading-relaxed">
              Create a branch offer to get started. Discount and BOGO rewards appear here.
            </p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT DIALOG */}
      {editorOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditorOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-heavy p-6 flex flex-col gap-4 text-xs select-none"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-2">
              <h3 className="text-sm font-bold tracking-tight">
                {editingOffer ? 'Modify Promotion Offer' : 'New Promotion Offer'}
              </h3>
              <button type="button" onClick={() => setEditorOpen(false)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="o-title" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Offer Title</label>
                <input
                  id="o-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingOffer) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="o-slug" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Slug Identifier</label>
                <input
                  id="o-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ''))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label htmlFor="o-desc" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Description</label>
                <textarea
                  id="o-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none min-h-[55px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="o-cost" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Coin Cost</label>
                  <input
                    id="o-cost"
                    type="number"
                    value={coinCost}
                    onChange={(e) => setCoinCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="o-stock" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Available Units</label>
                  <input
                    id="o-stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="o-type" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Offer Type</label>
                  <select
                    id="o-type"
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  >
                    <option value="DISCOUNT">Percent Discount</option>
                    <option value="BUY_ONE_GET_ONE">BOGO Deal</option>
                    <option value="LIMITED_TIME">Limited Time Deal</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="o-status" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Availability Status</label>
                  <select
                    id="o-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  >
                    <option value="DRAFT">Draft Mode</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)]/10 pt-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditorOpen(false)} className="w-auto">
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending} className="w-auto px-6">
                Save Offer
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
