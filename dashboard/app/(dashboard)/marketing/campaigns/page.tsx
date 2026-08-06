'use client';

import React, { useState } from 'react';
import { useListCampaigns } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Eye, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CampaignsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useListCampaigns({ page, pageSize });

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Campaign Name',
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
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'End Date',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Ongoing'}
        </span>
      ),
    },
    {
      key: 'target',
      label: 'Target',
      render: (row) => <span className="text-sm font-semibold">{row.targetAudience || 'All Customers'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
          active: { color: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300', label: 'ACTIVE' },
          scheduled: { color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300', label: 'SCHEDULED' },
          ended: { color: 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300', label: 'ENDED' },
          paused: { color: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300', label: 'PAUSED' },
        };
        const config = statusConfig[row.status] || statusConfig.active;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded ${config.color}`}>
            {row.status === 'active' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {config.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={(data as any)?.items || data || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No campaigns found"
        pagination={
          (data as any)?.total
            ? {
                currentPage: page,
                pageSize,
                total: (data as any).total,
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
