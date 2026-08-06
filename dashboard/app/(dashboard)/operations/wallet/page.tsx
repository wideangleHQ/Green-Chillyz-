'use client';

import React, { useState } from 'react';
import { useListWallets } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Wallet, TrendingUp, TrendingDown, Eye } from 'lucide-react';

export default function WalletOperationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;

  const { data, isLoading, error } = useListWallets({ page, pageSize, search });

  const columns: Column[] = [
    {
      key: 'customerName',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.customerName || 'Unknown'}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{row.customerId}</p>
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'Coin Balance',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            {row.balance?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'totalEarned',
      label: 'Total Earned',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          +{row.totalEarned?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          -{row.totalSpent?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: 'lastTransaction',
      label: 'Last Transaction',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.lastTransactionAt ? new Date(row.lastTransactionAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
            row.status === 'active'
              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300'
          }`}
        >
          {row.status?.toUpperCase() || 'ACTIVE'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Wallet Operations</h1>
        <p className="text-sm text-[var(--text-muted)]">
          View customer wallet balances and coin transaction activity at your store
        </p>
      </div>

      {/* Summary Stats */}
      {(data as any)?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total Wallets</p>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{(data as any).summary.totalWallets || 0}</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total Coins</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              🪙 {(data as any).summary.totalCoins?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Transactions Today</p>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{(data as any).summary.transactionsToday || 0}</p>
          </div>
        </div>
      )}

      {/* Wallet List */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No wallet data available"
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
        actions={(row) => (
          <button
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
            title="View Transactions"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />
    </div>
  );
}
