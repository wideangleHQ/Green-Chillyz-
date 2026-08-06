'use client';

import React, { useState } from 'react';
import { useRewardRules } from '@/hooks/useRewardManagement';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Eye, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

export default function RewardRulesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;

  const { data, isLoading, error } = useRewardRules({ page, pageSize, search });

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Rule Name',
      sortable: true,
      render: (row) => <p className="font-semibold text-[var(--foreground)]">{row.name}</p>,
    },
    {
      key: 'triggerType',
      label: 'Trigger',
      render: (row) => (
        <span className="px-2 py-1 text-xs font-bold bg-[var(--surface-hover)] rounded">
          {row.triggerType || '-'}
        </span>
      ),
    },
    {
      key: 'rewardType',
      label: 'Reward Type',
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.rewardType || '-'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (row) => {
        if (row.rewardType === 'coins') {
          return <span className="text-sm font-bold text-yellow-600">🪙 {row.value || 0}</span>;
        }
        return <span className="text-sm font-semibold">{row.value || '-'}</span>;
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (row) => <span className="text-sm font-mono">{row.priority ?? '-'}</span>,
    },
    {
      key: 'isEnabled',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded ${
            row.isEnabled
              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300'
          }`}
        >
          {row.isEnabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {row.isEnabled ? 'ENABLED' : 'DISABLED'}
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
        emptyMessage="No reward rules found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rules..."
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
          </div>
        )}
      />
    </div>
  );
}
