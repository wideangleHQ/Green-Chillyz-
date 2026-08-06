'use client';

import React, { useState } from 'react';
import { useChallenges } from '@/hooks/useChallenges';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Trophy, Eye, Edit } from 'lucide-react';

export default function ChallengesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useChallenges({ page, pageSize });

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Challenge Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.name}</p>
          {row.description && (
            <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">{row.description}</p>
          )}
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
      key: 'goal',
      label: 'Goal',
      render: (row) => <span className="text-sm font-semibold text-[var(--foreground)]">{row.goal || row.target || '-'}</span>,
    },
    {
      key: 'reward',
      label: 'Reward',
      render: (row) => {
        if (row.rewardType === 'coins') {
          return (
            <div className="flex items-center gap-1">
              <span className="text-base">🪙</span>
              <span className="text-sm font-bold text-yellow-600">{row.rewardValue || 0}</span>
            </div>
          );
        }
        return <span className="text-sm">{row.rewardValue || '-'}</span>;
      },
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Ongoing'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
          active: { color: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300', label: 'ACTIVE' },
          upcoming: { color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300', label: 'UPCOMING' },
          completed: { color: 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300', label: 'COMPLETED' },
        };
        const config = statusConfig[row.status] || statusConfig.active;
        return <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${config.color}`}>{config.label}</span>;
      },
    },
    {
      key: 'participants',
      label: 'Participants',
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[var(--color-primary)]">{row.participants || 0}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No challenges found"
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
