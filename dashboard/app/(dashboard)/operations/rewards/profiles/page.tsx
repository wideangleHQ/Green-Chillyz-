'use client';

import React, { useState } from 'react';
import { useRewardProfiles } from '@/hooks/useRewardManagement';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Eye, Edit, Archive } from 'lucide-react';

export default function RewardProfilesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;

  const { data, isLoading, error } = useRewardProfiles({ page, pageSize, search });

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Profile Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.name}</p>
          {row.isDefault && (
            <span className="text-xs text-[var(--color-primary)] font-bold">DEFAULT</span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <p className="text-sm text-[var(--text-muted)] truncate max-w-xs">
          {row.description || '-'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
            row.status === 'published'
              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
              : row.status === 'draft'
              ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300'
          }`}
        >
          {row.status?.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'version',
      label: 'Version',
      render: (row) => <span className="text-sm font-mono">{row.version || 'v1.0'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
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
        emptyMessage="No reward profiles found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search profiles..."
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
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-red-600 transition-colors"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
