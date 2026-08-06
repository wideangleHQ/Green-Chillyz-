'use client';

import React, { useState } from 'react';
import { useListRewards, useRewardDetail, useRewardRedemptions, useCreateReward, useUpdateReward, useUpdateRewardStatus, useAdjustRewardStock, useDeleteReward } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Search, Sparkles, Filter, Ticket, Plus, Edit3, Trash2, X, RefreshCw, ChevronLeft, ChevronRight, Eye, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function RewardsModule() {
  const { showToast } = useToast();

  // Listing state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data: catalog, isLoading: listLoading, refetch: refetchCatalog } = useListRewards({
    search: search || undefined,
    category: category || undefined,
    page,
    pageSize,
  });

  // Selected Detail Modal state
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } = useRewardDetail(selectedRewardId || '');
  const { data: redemptions } = useRewardRedemptions(selectedRewardId || '', { page: 1, pageSize: 5 });

  // Creation/Edit Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coinCost, setCoinCost] = useState(100);
  const [rewardType, setRewardType] = useState('FREE_ITEM');
  const [status, setStatus] = useState('DRAFT');
  const [stock, setStock] = useState(50);

  const createMutation = useCreateReward();
  const updateMutation = useUpdateReward();
  const statusMutation = useUpdateRewardStatus();
  const stockMutation = useAdjustRewardStock();
  const deleteMutation = useDeleteReward();

  const handleOpenCreate = () => {
    setEditingReward(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setCoinCost(100);
    setRewardType('FREE_ITEM');
    setStatus('DRAFT');
    setStock(50);
    setEditorOpen(true);
  };

  const handleOpenEdit = (reward: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReward(reward);
    setTitle(reward.title);
    setSlug(reward.slug);
    setDescription(reward.description || '');
    setCoinCost(reward.coinCost);
    setRewardType(reward.rewardType);
    setStatus(reward.status);
    setStock(reward.stock || 50);
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
      if (editingReward) {
        await updateMutation.mutateAsync({ id: editingReward.id, dto: payload });
        showToast('Reward updated successfully!', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Reward created successfully!', 'success');
      }
      setEditorOpen(false);
      refetchCatalog();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save reward item.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      showToast('Reward deleted successfully', 'success');
      refetchCatalog();
      if (selectedRewardId === id) setSelectedRewardId(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete reward.', 'error');
    }
  };

  const categories = [
    { name: 'All Categories', value: '' },
    { name: 'Free Foods', value: 'free-foods' },
    { name: 'Beverages', value: 'beverages' },
    { name: 'Snacks', value: 'snacks' },
    { name: 'Combos', value: 'combos' },
  ];

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-12 select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight">Rewards Catalog</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Configure items, manage inventories, edit terms, and evaluate redemption stats.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-auto font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Catalog Item</span>
        </Button>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border border-[var(--border)]/10 bg-[var(--surface)] rounded-2xl shadow-soft">
        <div className="flex items-center gap-2 px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search by title, description or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-0 focus:border-none focus:outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-[var(--border)]/10 rounded-lg bg-[var(--input-bg)] text-xs text-[var(--foreground)] outline-none w-full sm:w-[160px]"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => refetchCatalog()}
            className="p-2 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* REWARDS GRID */}
      {listLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-[var(--surface-hover)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : catalog && catalog.items.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {catalog.items.map((reward) => (
              <div
                key={reward.id}
                onClick={() => setSelectedRewardId(reward.id)}
                className="group rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] hover:border-[var(--color-primary)]/40 shadow-soft overflow-hidden cursor-pointer flex flex-col transition-all duration-200"
              >
                {/* Image panel */}
                <div className="h-36 bg-[var(--background)] border-b border-[var(--border)]/5 relative flex items-center justify-center">
                  {reward.image ? (
                    <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-10 h-10 text-[var(--color-primary)]/10 stroke-[1.2]" />
                  )}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] uppercase tracking-wider">
                    {reward.rewardType.replace('_', ' ')}
                  </span>
                </div>

                {/* Info panel */}
                <div className="p-4 flex-1 flex flex-col gap-1.5 text-xs">
                  <div className="font-bold text-[var(--foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {reward.title}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {reward.description || 'No description provided.'}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-[var(--border)]/5 flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--color-primary)]">
                      {reward.coinCost} coins
                    </span>
                    <span className={`text-[10px] font-semibold ${reward.stock !== null && reward.stock <= 10 ? 'text-red-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                      {reward.stock !== null ? `Stock: ${reward.stock}` : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="px-4 py-2.5 bg-[var(--background)] border-t border-[var(--border)]/5 flex items-center justify-end gap-1.5 text-[10px]">
                  <button
                    onClick={(e) => handleOpenEdit(reward, e)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                    title="Edit item"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(reward.id, e)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* CATALOG PAGINATION */}
          {catalog.totalPages > 1 && (
            <div className="border-t border-[var(--border)]/10 pt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div>Page {page} of {catalog.totalPages}</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-[var(--border)]/10 bg-[var(--surface)] rounded disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, catalog.totalPages))}
                  disabled={page === catalog.totalPages}
                  className="p-1.5 border border-[var(--border)]/10 bg-[var(--surface)] rounded disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 border border-dashed border-[var(--border)]/20 bg-[var(--surface)] rounded-2xl text-center text-[var(--text-muted)] flex flex-col items-center justify-center">
          <Sparkles className="w-12 h-12 text-[var(--border)] mb-3 stroke-[1.2]" />
          <h4 className="text-sm font-semibold text-[var(--foreground)]">No rewards found</h4>
          <p className="text-xs max-w-sm mt-1">
            Try adjustments to filters, search query, or create a brand new reward.
          </p>
        </div>
      )}

      {/* ─── DETAIL DRAWER ─── */}
      {selectedRewardId && (
        <div className="fixed inset-0 z-999 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedRewardId(null)} />
          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] h-full flex flex-col shadow-heavy animate-slide-in text-xs">
            
            <div className="p-6 border-b border-[var(--border)]/10 flex items-start justify-between">
              {detailLoading ? (
                <div className="h-5 bg-[var(--surface-hover)] animate-pulse rounded w-36" />
              ) : detail ? (
                <div>
                  <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest block mb-0.5">Reward Detail</span>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">{detail.title}</h3>
                </div>
              ) : null}
              <button onClick={() => setSelectedRewardId(null)} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {detailLoading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-[var(--surface-hover)] rounded animate-pulse" />
                  <div className="h-4 bg-[var(--surface-hover)] rounded animate-pulse" />
                </div>
              ) : detail ? (
                <>
                  <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]/10">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Redemption Cost</span>
                    <div className="text-xl font-bold text-[var(--color-primary)]">{detail.coinCost} coins</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Description</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]/5">
                      {detail.description || 'No description available for this item.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mb-0.5">Inventory Stock</span>
                      <span className="font-bold text-[var(--foreground)]">{detail.stock !== null ? `${detail.stock} units` : 'Unlimited'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mb-0.5">Redemption Status</span>
                      <span className="font-bold text-[var(--foreground)] capitalize">{detail.status.toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)]/10 pt-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                      <div>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Total Views</span>
                        <span className="font-bold text-[var(--foreground)]">{detail.totalViews} clicks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[var(--text-muted)]" />
                      <div>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Redemptions</span>
                        <span className="font-bold text-[var(--foreground)]">{detail.totalRedemptions} counts</span>
                      </div>
                    </div>
                  </div>

                  {/* Redemptions Roster */}
                  <div className="flex flex-col gap-3 border-t border-[var(--border)]/10 pt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Claims at Store</h4>
                    {redemptions && redemptions.items.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {redemptions.items.map((r: any) => (
                          <div key={r.id} className="p-3 border border-[var(--border)]/5 bg-[var(--background)] rounded-lg flex items-center justify-between text-[11px]">
                            <div>
                              <div className="font-bold text-[var(--foreground)]">{r.user.fullName}</div>
                              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</div>
                            </div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Claimed</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-[var(--text-muted)] bg-[var(--background)] rounded-lg">
                        No redemptions logged for this branch.
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
            
            <div className="p-4 border-t border-[var(--border)]/10 bg-[var(--background)] flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedRewardId(null)} className="w-auto">
                Close Detail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATION / UPDATE DIALOG ─── */}
      {editorOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditorOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-heavy p-6 flex flex-col gap-4 text-xs select-none"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-2">
              <h3 className="text-sm font-bold tracking-tight">
                {editingReward ? 'Modify Catalog Item' : 'New Reward Catalog Item'}
              </h3>
              <button type="button" onClick={() => setEditorOpen(false)} className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingReward) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Slug Identifier</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ''))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Coin Cost</label>
                  <input
                    type="number"
                    value={coinCost}
                    onChange={(e) => setCoinCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Initial Stock</label>
                  <input
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Reward Type</label>
                  <select
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  >
                    <option value="FREE_ITEM">Free Item</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="BUY_ONE_GET_ONE">Buy One Get One</option>
                    <option value="CASHBACK">Cashback</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                  >
                    <option value="DRAFT">Draft</option>
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
                Save Item
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
