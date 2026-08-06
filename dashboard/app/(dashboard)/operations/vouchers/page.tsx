'use client';

import React, { useState, ReactNode } from 'react';
import { useListVouchers, useRedeemVoucher } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Ticket, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

export default function VouchersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemSignature, setRedeemSignature] = useState('');
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useListVouchers({ page, pageSize, search });
  const redeemMutation = useRedeemVoucher();
  const { showToast } = useToast();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) {
      showToast('Please enter a voucher code', 'error');
      return;
    }

    try {
      await redeemMutation.mutateAsync({ code: redeemCode, signature: redeemSignature });
      showToast('Voucher redeemed successfully!', 'success');
      setRedeemCode('');
      setRedeemSignature('');
      refetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to redeem voucher', 'error');
    }
  };

  const columns: Column[] = [
    {
      key: 'code',
      label: 'Voucher Code',
      render: (row) => <span className="font-mono font-bold text-[var(--foreground)]">{row.code}</span>,
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (row) => <span className="text-sm text-[var(--foreground)]">{row.customerName || row.customerId || '-'}</span>,
    },
    {
      key: 'rewardName',
      label: 'Reward',
      render: (row) => <span className="text-sm font-semibold text-[var(--foreground)]">{row.rewardName || row.rewardId || '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const statusConfig: Record<string, { color: string; icon: ReactNode; label: string }> = {
          redeemed: { color: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'REDEEMED' },
          expired: { color: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300', icon: <XCircle className="w-3.5 h-3.5" />, label: 'EXPIRED' },
          pending: { color: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300', icon: <Clock className="w-3.5 h-3.5" />, label: 'PENDING' },
        };
        const config = statusConfig[row.status] || statusConfig.pending;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'redeemedAt',
      label: 'Redeemed At',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.redeemedAt ? new Date(row.redeemedAt).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Voucher Redemption</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Scan or enter voucher codes to redeem customer rewards at the store
        </p>
      </div>

      {/* Redemption Form */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Redeem Voucher</h2>
        </div>

        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Voucher Code *
            </label>
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Enter or scan voucher code"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 font-mono"
              disabled={redeemMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Signature (Optional)
            </label>
            <input
              type="text"
              value={redeemSignature}
              onChange={(e) => setRedeemSignature(e.target.value)}
              placeholder="Enter signature if required"
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 font-mono"
              disabled={redeemMutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={redeemMutation.isPending || !redeemCode.trim()}
            className="w-full px-4 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {redeemMutation.isPending ? 'Redeeming...' : 'Redeem Voucher'}
          </button>
        </form>
      </div>

      {/* Voucher History */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Voucher History</h2>
        <DataTable
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          error={error}
          emptyMessage="No vouchers found"
          searchable
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code or customer..."
          pagination={
            data?.total
              ? {
                  currentPage: page,
                  pageSize,
                  total: data.total,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
