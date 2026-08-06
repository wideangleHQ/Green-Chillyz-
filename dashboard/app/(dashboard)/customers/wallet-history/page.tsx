'use client';

import React, { useState } from 'react';
import { useListWallets } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function CustomerWalletHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 15;

  const { data, isLoading, error } = useListWallets({ page, pageSize, search });

  const columns: Column[] = [
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.customerName || 'Unknown'}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{row.customerId}</p>
        </div>
      ),
    },
    {
      key: 'currentBalance',
      label: 'Current Balance',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            {row.balance?.toLocaleString() || row.currentBalance?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'totalEarned',
      label: 'Total Earned',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {row.totalEarned?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3.5 h-3.5 text-red-600" />
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            {row.totalSpent?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'lifetimeValue',
      label: 'Lifetime Value',
      render: (row) => (
        <span className="text-sm font-bold text-[var(--color-primary)]">
          {((row.totalEarned || 0) - (row.totalSpent || 0)).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'lastTransaction',
      label: 'Last Transaction',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.lastTransactionAt ? new Date(row.lastTransactionAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Wallet className="w-4 h-4" />
        <span>Complete wallet transaction history for all customers</span>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No wallet history found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer name or ID..."
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
