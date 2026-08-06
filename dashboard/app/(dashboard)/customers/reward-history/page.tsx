'use client';

import React, { useState } from 'react';
import { useListRewards } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Gift, CheckCircle } from 'lucide-react';

export default function CustomerRewardHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 15;

  const { data, isLoading, error } = useListRewards({ page, pageSize, search, redeemed: true });

  const columns: Column[] = [
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.customerName || 'Unknown'}</p>
          {row.customerId && <p className="text-xs text-[var(--text-muted)] font-mono">{row.customerId}</p>}
        </div>
      ),
    },
    {
      key: 'reward',
      label: 'Reward',
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.rewardName || row.name}</p>
          {row.description && <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className="px-2 py-1 text-xs font-bold bg-[var(--surface-hover)] rounded uppercase">
          {row.type || 'Standard'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (row) => {
        if (row.type === 'coins') {
          return (
            <div className="flex items-center gap-1">
              <span className="text-base">🪙</span>
              <span className="text-sm font-bold text-yellow-600">{row.value || row.coinValue || 0}</span>
            </div>
          );
        }
        return <span className="text-sm font-semibold">{row.value || '-'}</span>;
      },
    },
    {
      key: 'redeemedAt',
      label: 'Redeemed Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.redeemedAt ? new Date(row.redeemedAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300">
          <CheckCircle className="w-3.5 h-3.5" />
          REDEEMED
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Gift className="w-4 h-4" />
        <span>Complete reward redemption history for all customers</span>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No reward history found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer or reward name..."
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
  );
}
