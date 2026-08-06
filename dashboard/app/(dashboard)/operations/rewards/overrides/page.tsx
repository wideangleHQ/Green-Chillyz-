'use client';

import React, { useState } from 'react';
import { useMyOverrides } from '@/hooks/useRewardManagement';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Eye, Edit, Archive } from 'lucide-react';

export default function RewardOverridesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useMyOverrides({ page, pageSize });

  const columns: Column[] = [
    {
      key: 'ruleName',
      label: 'Rule Name',
      render: (row) => <p className="font-semibold text-[var(--foreground)]">{row.ruleName || row.ruleId}</p>,
    },
    {
      key: 'overrideType',
      label: 'Override Type',
      render: (row) => (
        <span className="px-2 py-1 text-xs font-bold bg-[var(--surface-hover)] rounded uppercase">
          {row.overrideType || '-'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Override Value',
      render: (row) => <span className="text-sm font-semibold text-[var(--color-primary)]">{row.value ?? '-'}</span>,
    },
    {
      key: 'effectiveFrom',
      label: 'Effective From',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.effectiveFrom ? new Date(row.effectiveFrom).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'effectiveTo',
      label: 'Effective To',
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">
          {row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString() : 'Indefinite'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isActive = row.status === 'active' || (!row.effectiveTo || new Date(row.effectiveTo) > new Date());
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
              isActive
                ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300'
            }`}
          >
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          Store-specific reward rule overrides allow you to customize reward behavior for your location
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No store overrides configured"
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
