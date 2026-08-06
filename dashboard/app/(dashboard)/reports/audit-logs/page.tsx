'use client';

import React, { useState } from 'react';
import { useQueryAuditLogs } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileText, User, Clock, Tag } from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const { data, isLoading, error } = useQueryAuditLogs({ page, pageSize, search });

  const columns: Column[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs font-mono text-[var(--foreground)]">
            {row.timestamp ? new Date(row.timestamp).toLocaleString() : row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'actor',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {row.actorName || row.actor || row.userId || 'System'}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <span className="px-2 py-1 text-xs font-bold bg-[var(--surface-hover)] rounded uppercase">
          {row.action || row.event}
        </span>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{row.resourceType || row.entity || '-'}</p>
          {row.resourceId && (
            <p className="text-xs text-[var(--text-muted)] font-mono">{row.resourceId}</p>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <p className="text-sm text-[var(--text-muted)] truncate max-w-md">
          {row.description || row.message || row.details || '-'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const status = row.status || 'success';
        const statusConfig: Record<string, { color: string; label: string }> = {
          success: { color: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300', label: 'SUCCESS' },
          failed: { color: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300', label: 'FAILED' },
          pending: { color: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300', label: 'PENDING' },
        };
        const config = statusConfig[status] || statusConfig.success;
        return <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${config.color}`}>{config.label}</span>;
      },
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (row) => (
        <span className="text-xs font-mono text-[var(--text-muted)]">{row.ipAddress || row.ip || '-'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Audit Trail</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Complete audit trail of all system activities including user actions, data modifications, and system events
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No audit logs found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by user, action, or resource..."
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
