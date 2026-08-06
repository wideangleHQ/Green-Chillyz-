'use client';

import React, { useState } from 'react';
import { useSearchCustomers } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Eye, Mail, Phone } from 'lucide-react';

export default function CustomersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const pageSize = 10;

  const { data, isLoading, error } = useSearchCustomers({
    search,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Customer Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.name || row.firstName + ' ' + row.lastName}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (row) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
              <Mail className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
              <Phone className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'coinBalance',
      label: 'Coins',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-base">🪙</span>
          <span className="text-sm font-bold text-yellow-600">
            {row.coinBalance?.toLocaleString() || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'totalVisits',
      label: 'Visits',
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[var(--foreground)]">{row.totalVisits || 0}</span>,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-[var(--color-primary)]">
          ${row.totalSpent?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      key: 'lastVisit',
      label: 'Last Visit',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.lastVisit ? new Date(row.lastVisit).toLocaleDateString() : 'Never'}
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
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.status?.toUpperCase() || 'ACTIVE'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No customers found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customers by name, email, or phone..."
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
        onSort={handleSort}
        sortKey={sortBy}
        sortOrder={sortOrder}
        actions={(row) => (
          <button
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />
    </div>
  );
}
