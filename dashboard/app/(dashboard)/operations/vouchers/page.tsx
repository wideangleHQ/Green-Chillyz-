'use client';

import React, { useState, useCallback, ReactNode, useMemo } from 'react';
import {
  useListStoreVouchers,
  useStoreVoucher,
  useStoreVoucherAnalytics,
  useStoreVoucherHistory,
  useCreateStoreVoucher,
  useUpdateStoreVoucher,
  useArchiveStoreVoucher,
  useRestoreStoreVoucher,
  useActivateStoreVoucher,
  useDeactivateStoreVoucher,
  useDuplicateStoreVoucher,
  useRedeemStoreVoucher,
} from '@/hooks/useDashboardOps';
import type { StoreVoucher, StoreVoucherType, StoreVoucherStatus } from '@/lib/api/opsApi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/providers/ToastProvider';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  RotateCcw,
  Copy,
  Eye,
  Pencil,
  Play,
  Pause,
  MoreVertical,
  X,
  ChevronDown,
  BarChart3,
  Zap,
  Tag,
  Trash2,
  History,
} from 'lucide-react';

// --- Constants ---
const STATUS_TABS: Array<{ id: StoreVoucherStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'EXPIRED', label: 'Expired' },
  { id: 'ARCHIVED', label: 'Archived' },
];

const VOUCHER_TYPES: { value: StoreVoucherType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Percentage Discount' },
  { value: 'FLAT_DISCOUNT', label: 'Flat Discount' },
  { value: 'FREE_ITEM', label: 'Free Item' },
  { value: 'COMBO', label: 'Combo Deal' },
  { value: 'FREE_BEVERAGE', label: 'Free Beverage' },
  { value: 'GIFT', label: 'Gift' },
  { value: 'COIN_VOUCHER', label: 'Coin Voucher' },
];

const OFFER_TAGS = [
  'Hot Deal', 'Combo', 'Weekend Offer', 'Non Veg Mania',
  'Veg Special', 'Family Deal', 'Festival Offer', 'New Launch',
];

const DISCOUNT_BADGES = ['25% OFF', '50% OFF', 'FREE', 'LIMITED'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function statusBadge(status: StoreVoucherStatus) {
  const map: Record<StoreVoucherStatus, { bg: string; text: string; icon: ReactNode }> = {
    DRAFT: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-300', icon: <Clock className="w-3 h-3" /> },
    ACTIVE: { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-300', icon: <CheckCircle className="w-3 h-3" /> },
    PAUSED: { bg: 'bg-yellow-100 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-300', icon: <Pause className="w-3 h-3" /> },
    EXPIRED: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', icon: <XCircle className="w-3 h-3" /> },
    ARCHIVED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', icon: <Archive className="w-3 h-3" /> },
  };
  const cfg = map[status] || map.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {status}
    </span>
  );
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// --- Dropdown Menu ---
function ActionDropdown({ children, items }: { children: ReactNode; items: Array<{ label: string; icon: ReactNode; onClick: () => void; danger?: boolean }> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors">
        {children}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-[var(--surface-hover)] transition-colors ${item.danger ? 'text-red-600' : 'text-[var(--foreground)]'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Create/Edit Dialog ---
interface VoucherFormData {
  name: string;
  shortTitle: string;
  description: string;
  offerTag: string;
  discountBadge: string;
  voucherType: StoreVoucherType;
  voucherValue: number | '';
  minimumOrderValue: number | '';
  maximumDiscount: number | '';
  itemsIncluded: string;
  couponCode: string;
  autoGenerate: boolean;
  startDate: string;
  endDate: string;
  validTime: string;
  validDays: string[];
  totalLimit: number | '';
  terms: string[];
  isFeatured: boolean;
  priority: number | '';
  sortOrder: number | '';
  status: StoreVoucherStatus;
}

const emptyForm: VoucherFormData = {
  name: '', shortTitle: '', description: '', offerTag: '', discountBadge: '',
  voucherType: 'PERCENTAGE', voucherValue: '', minimumOrderValue: '', maximumDiscount: '',
  itemsIncluded: '', couponCode: '', autoGenerate: true,
  startDate: '', endDate: '', validTime: '', validDays: [],
  totalLimit: '', terms: [], isFeatured: false, priority: 0, sortOrder: 0,
  status: 'DRAFT',
};

function VoucherFormDialog({
  open, onClose, editVoucher,
}: {
  open: boolean;
  onClose: () => void;
  editVoucher?: StoreVoucher | null;
}) {
  const { showToast } = useToast();
  const createMutation = useCreateStoreVoucher();
  const updateMutation = useUpdateStoreVoucher();

  const [form, setForm] = useState<VoucherFormData>(() => {
    if (editVoucher) {
      return {
        name: editVoucher.name,
        shortTitle: editVoucher.shortTitle || '',
        description: editVoucher.description || '',
        offerTag: editVoucher.offerTag || '',
        discountBadge: editVoucher.discountBadge || '',
        voucherType: editVoucher.voucherType,
        voucherValue: editVoucher.voucherValue ?? '',
        minimumOrderValue: editVoucher.minimumOrderValue ?? '',
        maximumDiscount: editVoucher.maximumDiscount ?? '',
        itemsIncluded: editVoucher.itemsIncluded || '',
        couponCode: editVoucher.couponCode,
        autoGenerate: false,
        startDate: editVoucher.startDate ? editVoucher.startDate.substring(0, 10) : '',
        endDate: editVoucher.endDate ? editVoucher.endDate.substring(0, 10) : '',
        validTime: editVoucher.validTime || '',
        validDays: editVoucher.validDays || [],
        totalLimit: editVoucher.totalLimit,
        terms: editVoucher.terms || [],
        isFeatured: editVoucher.isFeatured,
        priority: editVoucher.priority,
        sortOrder: editVoucher.sortOrder,
        status: editVoucher.status,
      };
    }
    return { ...emptyForm, couponCode: generateCode() };
  });

  const [newTerm, setNewTerm] = useState('');

  const set = useCallback(<K extends keyof VoucherFormData>(key: K, value: VoucherFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Voucher name is required', 'error'); return; }
    if (!form.couponCode.trim()) { showToast('Coupon code is required', 'error'); return; }

    const dto: any = {
      name: form.name,
      shortTitle: form.shortTitle || null,
      description: form.description || null,
      offerTag: form.offerTag || null,
      discountBadge: form.discountBadge || null,
      couponCode: form.couponCode,
      voucherType: form.voucherType,
      voucherValue: form.voucherValue === '' ? null : Number(form.voucherValue),
      minimumOrderValue: form.minimumOrderValue === '' ? null : Number(form.minimumOrderValue),
      maximumDiscount: form.maximumDiscount === '' ? null : Number(form.maximumDiscount),
      itemsIncluded: form.itemsIncluded || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      validTime: form.validTime || null,
      validDays: form.validDays.length > 0 ? form.validDays : null,
      totalLimit: form.totalLimit === '' ? 0 : Number(form.totalLimit),
      terms: form.terms.length > 0 ? form.terms : null,
      isFeatured: form.isFeatured,
      priority: Number(form.priority) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    };

    try {
      if (editVoucher) {
        await updateMutation.mutateAsync({ id: editVoucher.id, dto });
        showToast('Voucher updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(dto);
        showToast('Voucher created successfully', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || 'Failed to save voucher', 'error');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-[var(--foreground)]';
  const labelCls = 'block text-xs font-semibold text-[var(--foreground)] mb-1';
  const sectionCls = 'space-y-3';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {editVoucher ? 'Edit Voucher' : 'Create Voucher'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-hover)]">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Basic Info</h3>
            <div className={sectionCls}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Weekend 50% Off" />
                </div>
                <div>
                  <label className={labelCls}>Short Title</label>
                  <input className={inputCls} value={form.shortTitle} onChange={e => set('shortTitle', e.target.value)} placeholder="Short display title" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls + ' min-h-[60px]'} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Voucher description" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Offer Tag</label>
                  <select className={inputCls} value={form.offerTag} onChange={e => set('offerTag', e.target.value)}>
                    <option value="">None</option>
                    {OFFER_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Discount Badge</label>
                  <select className={inputCls} value={form.discountBadge} onChange={e => set('discountBadge', e.target.value)}>
                    <option value="">None</option>
                    {DISCOUNT_BADGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Config */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Voucher Config</h3>
            <div className={sectionCls}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type *</label>
                  <select className={inputCls} value={form.voucherType} onChange={e => set('voucherType', e.target.value as StoreVoucherType)}>
                    {VOUCHER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Value</label>
                  <input className={inputCls} type="number" min="0" value={form.voucherValue} onChange={e => set('voucherValue', e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 50" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Min Order Value</label>
                  <input className={inputCls} type="number" min="0" value={form.minimumOrderValue} onChange={e => set('minimumOrderValue', e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Max Discount</label>
                  <input className={inputCls} type="number" min="0" value={form.maximumDiscount} onChange={e => set('maximumDiscount', e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Items Included</label>
                <textarea className={inputCls + ' min-h-[50px]'} value={form.itemsIncluded} onChange={e => set('itemsIncluded', e.target.value)} placeholder="List of included items (comma separated)" />
              </div>
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Coupon Code</h3>
            <div className={sectionCls}>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)] cursor-pointer">
                  <input type="checkbox" checked={form.autoGenerate} onChange={e => {
                    set('autoGenerate', e.target.checked);
                    if (e.target.checked) set('couponCode', generateCode());
                  }} className="rounded" />
                  Auto-generate
                </label>
                {form.autoGenerate && (
                  <button type="button" onClick={() => set('couponCode', generateCode())} className="text-xs text-[var(--color-primary)] font-semibold hover:underline">
                    Regenerate
                  </button>
                )}
              </div>
              <input
                className={inputCls + ' font-mono tracking-wider'}
                value={form.couponCode}
                onChange={e => set('couponCode', e.target.value.toUpperCase())}
                readOnly={form.autoGenerate}
                placeholder="Enter coupon code"
              />
            </div>
          </div>

          {/* Validity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Validity</h3>
            <div className={sectionCls}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input className={inputCls} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input className={inputCls} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Valid Time</label>
                <input className={inputCls} value={form.validTime} onChange={e => set('validTime', e.target.value)} placeholder='e.g. "7 PM onwards"' />
              </div>
              <div>
                <label className={labelCls}>Valid Days</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS_OF_WEEK.map(day => (
                    <label key={day} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium cursor-pointer transition-colors ${form.validDays.includes(day) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--color-primary)]/50'}`}>
                      <input
                        type="checkbox"
                        checked={form.validDays.includes(day)}
                        onChange={e => {
                          if (e.target.checked) set('validDays', [...form.validDays, day]);
                          else set('validDays', form.validDays.filter(d => d !== day));
                        }}
                        className="sr-only"
                      />
                      {day.substring(0, 3)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Limits</h3>
            <div>
              <label className={labelCls}>Total Limit</label>
              <input className={inputCls} type="number" min="0" value={form.totalLimit} onChange={e => set('totalLimit', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Max redemptions" />
            </div>
          </div>

          {/* Terms */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Terms & Conditions</h3>
            <div className="space-y-2">
              {form.terms.map((term, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls + ' flex-1'}
                    value={term}
                    onChange={e => {
                      const next = [...form.terms];
                      next[i] = e.target.value;
                      set('terms', next);
                    }}
                  />
                  <button type="button" onClick={() => set('terms', form.terms.filter((_, j) => j !== i))} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  className={inputCls + ' flex-1'}
                  value={newTerm}
                  onChange={e => setNewTerm(e.target.value)}
                  placeholder="Add a term..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTerm.trim()) {
                      e.preventDefault();
                      set('terms', [...form.terms, newTerm.trim()]);
                      setNewTerm('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => { if (newTerm.trim()) { set('terms', [...form.terms, newTerm.trim()]); setNewTerm(''); } }}
                  className="px-3 py-2 text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg hover:bg-[var(--color-primary)]/10"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="rounded" />
                Featured
              </label>
              <div>
                <label className={labelCls}>Priority</label>
                <input className={inputCls} type="number" min="0" value={form.priority} onChange={e => set('priority', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>Sort Order</label>
                <input className={inputCls} type="number" min="0" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? 'Saving...' : editVoucher ? 'Update Voucher' : 'Create Voucher'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Detail Panel ---
function VoucherDetailPanel({ voucherId, onClose }: { voucherId: string; onClose: () => void }) {
  const { data: voucher, isLoading } = useStoreVoucher(voucherId);
  const { data: history } = useStoreVoucherHistory(voucherId, { page: 1, pageSize: 20 });

  if (isLoading || !voucher) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl mx-4 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-[var(--surface-hover)] rounded" />
            <div className="h-4 w-64 bg-[var(--surface-hover)] rounded" />
            <div className="h-4 w-32 bg-[var(--surface-hover)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  const historyItems = Array.isArray(history) ? history : (history as any)?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Voucher Details</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-hover)]">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Preview Card */}
          <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">{voucher.name}</h3>
                {voucher.shortTitle && <p className="text-xs text-[var(--text-muted)]">{voucher.shortTitle}</p>}
              </div>
              {statusBadge(voucher.status)}
            </div>
            {voucher.discountBadge && (
              <span className="inline-block px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold rounded mb-2">{voucher.discountBadge}</span>
            )}
            {voucher.offerTag && (
              <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded">
                <Tag className="w-2.5 h-2.5" /> {voucher.offerTag}
              </span>
            )}
            <div className="mt-2 p-2 bg-[var(--surface)] rounded border border-dashed border-[var(--border)] text-center">
              <span className="font-mono text-sm font-bold tracking-widest text-[var(--color-primary)]">{voucher.couponCode}</span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-[var(--text-muted)]">Type</span><p className="font-semibold mt-0.5">{voucher.voucherType.replace('_', ' ')}</p></div>
            <div><span className="text-[var(--text-muted)]">Value</span><p className="font-semibold mt-0.5">{voucher.voucherValue ?? '-'}</p></div>
            <div><span className="text-[var(--text-muted)]">Min Order</span><p className="font-semibold mt-0.5">{voucher.minimumOrderValue ?? '-'}</p></div>
            <div><span className="text-[var(--text-muted)]">Max Discount</span><p className="font-semibold mt-0.5">{voucher.maximumDiscount ?? '-'}</p></div>
            <div><span className="text-[var(--text-muted)]">Redeemed</span><p className="font-semibold mt-0.5">{voucher.redeemedCount} / {voucher.totalLimit}</p></div>
            <div><span className="text-[var(--text-muted)]">Remaining</span><p className="font-semibold mt-0.5">{voucher.remainingCount}</p></div>
            <div><span className="text-[var(--text-muted)]">Start</span><p className="font-semibold mt-0.5">{voucher.startDate ? new Date(voucher.startDate).toLocaleDateString() : '-'}</p></div>
            <div><span className="text-[var(--text-muted)]">End</span><p className="font-semibold mt-0.5">{voucher.endDate ? new Date(voucher.endDate).toLocaleDateString() : '-'}</p></div>
            {voucher.validTime && <div className="col-span-2"><span className="text-[var(--text-muted)]">Valid Time</span><p className="font-semibold mt-0.5">{voucher.validTime}</p></div>}
            {voucher.validDays && voucher.validDays.length > 0 && <div className="col-span-2"><span className="text-[var(--text-muted)]">Valid Days</span><p className="font-semibold mt-0.5">{voucher.validDays.join(', ')}</p></div>}
            {voucher.itemsIncluded && <div className="col-span-2"><span className="text-[var(--text-muted)]">Items Included</span><p className="font-semibold mt-0.5">{voucher.itemsIncluded}</p></div>}
          </div>

          {/* Terms */}
          {voucher.terms && voucher.terms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Terms</h4>
              <ul className="space-y-1">
                {voucher.terms.map((t, i) => (
                  <li key={i} className="text-xs text-[var(--foreground)] flex items-start gap-2">
                    <span className="text-[var(--text-muted)] mt-0.5">-</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* History */}
          {historyItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                <History className="w-3 h-3" /> History
              </h4>
              <div className="space-y-2">
                {historyItems.map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-xs pb-2 border-b border-[var(--border)] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{h.action || h.type || 'Event'}</p>
                      <p className="text-[var(--text-muted)] text-[10px]">{h.description || h.detail || ''}</p>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function StoreVouchersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreVoucherStatus | 'ALL'>('ALL');
  const [redeemCode, setRedeemCode] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editVoucher, setEditVoucher] = useState<StoreVoucher | null>(null);
  const [detailVoucherId, setDetailVoucherId] = useState<string | null>(null);
  const pageSize = 10;

  const { showToast } = useToast();

  const listParams = useMemo(() => ({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  }), [page, pageSize, search, statusFilter]);

  const { data, isLoading, error } = useListStoreVouchers(listParams);
  const { data: analytics, isLoading: analyticsLoading } = useStoreVoucherAnalytics();
  const redeemMutation = useRedeemStoreVoucher();
  const archiveMutation = useArchiveStoreVoucher();
  const restoreMutation = useRestoreStoreVoucher();
  const activateMutation = useActivateStoreVoucher();
  const deactivateMutation = useDeactivateStoreVoucher();
  const duplicateMutation = useDuplicateStoreVoucher();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) { showToast('Enter a coupon code', 'error'); return; }
    try {
      const result = await redeemMutation.mutateAsync(redeemCode.trim());
      showToast(`Voucher "${result?.voucher?.name || redeemCode}" redeemed successfully!`, 'success');
      setRedeemCode('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || 'Failed to redeem voucher', 'error');
    }
  };

  const getRowActions = useCallback((row: StoreVoucher) => {
    const items: Array<{ label: string; icon: ReactNode; onClick: () => void; danger?: boolean }> = [
      { label: 'View Details', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setDetailVoucherId(row.id) },
      { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => setEditVoucher(row) },
    ];

    if (row.status === 'DRAFT' || row.status === 'PAUSED') {
      items.push({ label: 'Activate', icon: <Play className="w-3.5 h-3.5" />, onClick: async () => {
        try { await activateMutation.mutateAsync(row.id); showToast('Voucher activated', 'success'); } catch (e: any) { showToast(e.message, 'error'); }
      }});
    }
    if (row.status === 'ACTIVE') {
      items.push({ label: 'Pause', icon: <Pause className="w-3.5 h-3.5" />, onClick: async () => {
        try { await deactivateMutation.mutateAsync(row.id); showToast('Voucher paused', 'success'); } catch (e: any) { showToast(e.message, 'error'); }
      }});
    }
    if (row.status !== 'ARCHIVED') {
      items.push({ label: 'Archive', icon: <Archive className="w-3.5 h-3.5" />, onClick: async () => {
        try { await archiveMutation.mutateAsync(row.id); showToast('Voucher archived', 'success'); } catch (e: any) { showToast(e.message, 'error'); }
      }, danger: true });
    }
    if (row.status === 'ARCHIVED') {
      items.push({ label: 'Restore', icon: <RotateCcw className="w-3.5 h-3.5" />, onClick: async () => {
        try { await restoreMutation.mutateAsync(row.id); showToast('Voucher restored', 'success'); } catch (e: any) { showToast(e.message, 'error'); }
      }});
    }
    items.push({ label: 'Duplicate', icon: <Copy className="w-3.5 h-3.5" />, onClick: async () => {
      try { await duplicateMutation.mutateAsync(row.id); showToast('Voucher duplicated', 'success'); } catch (e: any) { showToast(e.message, 'error'); }
    }});

    return items;
  }, [activateMutation, deactivateMutation, archiveMutation, restoreMutation, duplicateMutation, showToast]);

  const columns: Column<StoreVoucher>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="min-w-[120px]">
          <span className="text-xs font-bold text-[var(--foreground)] block truncate">{row.name}</span>
          {row.shortTitle && <span className="text-[10px] text-[var(--text-muted)] block truncate">{row.shortTitle}</span>}
        </div>
      ),
    },
    {
      key: 'couponCode',
      label: 'Code',
      render: (row) => <span className="font-mono text-xs font-bold text-[var(--color-primary)] tracking-wider">{row.couponCode}</span>,
    },
    {
      key: 'voucherType',
      label: 'Type',
      render: (row) => <span className="text-[10px] font-semibold text-[var(--foreground)]">{row.voucherType.replace('_', ' ')}</span>,
    },
    {
      key: 'offerTag',
      label: 'Tag',
      render: (row) => row.offerTag ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded">
          <Tag className="w-2.5 h-2.5" /> {row.offerTag}
        </span>
      ) : <span className="text-[10px] text-[var(--text-muted)]">-</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      key: 'remaining',
      label: 'Remaining',
      render: (row) => (
        <span className="text-xs font-semibold">
          {row.remainingCount} <span className="text-[var(--text-muted)] font-normal">/ {row.totalLimit}</span>
        </span>
      ),
    },
    {
      key: 'validity',
      label: 'Valid Period',
      render: (row) => (
        <span className="text-[10px] text-[var(--text-muted)]">
          {row.startDate ? new Date(row.startDate).toLocaleDateString() : '?'} - {row.endDate ? new Date(row.endDate).toLocaleDateString() : '?'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '40px',
      align: 'right' as const,
      render: (row) => (
        <ActionDropdown items={getRowActions(row)}>
          <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
        </ActionDropdown>
      ),
    },
  ], [getRowActions]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Voucher Management</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Create, manage, and redeem store vouchers and coupon codes.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Created"
          value={analytics?.created ?? 0}
          icon={<Ticket className="w-4 h-4" />}
          subtitle="All time vouchers"
          loading={analyticsLoading}
        />
        <StatCard
          title="Total Redeemed"
          value={analytics?.redeemed ?? 0}
          icon={<CheckCircle className="w-4 h-4" />}
          subtitle={analytics?.conversionRate ? `${analytics.conversionRate}% conversion` : 'Redemptions'}
          loading={analyticsLoading}
        />
        <StatCard
          title="Remaining"
          value={analytics?.remaining ?? 0}
          icon={<BarChart3 className="w-4 h-4" />}
          subtitle="Available to redeem"
          loading={analyticsLoading}
        />
        <StatCard
          title="Expired"
          value={analytics?.expired ?? 0}
          icon={<XCircle className="w-4 h-4" />}
          subtitle="Past validity"
          loading={analyticsLoading}
        />
      </div>

      {/* Quick Redeem */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-bold text-[var(--foreground)]">Quick Redeem</h2>
        </div>
        <form onSubmit={handleRedeem} className="flex items-center gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 max-w-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            disabled={redeemMutation.isPending}
          />
          <button
            type="submit"
            disabled={redeemMutation.isPending || !redeemCode.trim()}
            className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {redeemMutation.isPending ? 'Redeeming...' : 'Redeem'}
          </button>
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search vouchers..."
            className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
        </div>
        <button
          onClick={() => { setEditVoucher(null); setShowCreateDialog(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Voucher
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No vouchers found"
        pagination={
          data?.total
            ? { currentPage: page, pageSize, total: data.total, onPageChange: setPage }
            : undefined
        }
      />

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editVoucher) && (
        <VoucherFormDialog
          open={true}
          onClose={() => { setShowCreateDialog(false); setEditVoucher(null); }}
          editVoucher={editVoucher}
        />
      )}

      {/* Detail Panel */}
      {detailVoucherId && (
        <VoucherDetailPanel
          voucherId={detailVoucherId}
          onClose={() => setDetailVoucherId(null)}
        />
      )}
    </div>
  );
}
