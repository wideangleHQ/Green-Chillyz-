'use client';

import React, { useState, ReactNode } from 'react';
import { useListNotifications } from '@/hooks/useDashboardOps';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Bell, Mail, CheckCircle, Clock } from 'lucide-react';

export default function CustomerNotificationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 15;

  const { data, isLoading, error } = useListNotifications({ page, pageSize, search });

  const columns: Column[] = [
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.customerName || row.recipientName || 'Unknown'}</p>
          {row.customerId && <p className="text-xs text-[var(--text-muted)] font-mono">{row.customerId}</p>}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Notification',
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--foreground)]">{row.title || row.subject}</p>
          {row.message && <p className="text-xs text-[var(--text-muted)] truncate max-w-md">{row.message}</p>}
        </div>
      ),
    },
    {
      key: 'channel',
      label: 'Channel',
      render: (row) => {
        const channel = row.channel || row.type || 'push';
        const icons: Record<string, ReactNode> = {
          email: <Mail className="w-3.5 h-3.5" />,
          push: <Bell className="w-3.5 h-3.5" />,
          sms: <Mail className="w-3.5 h-3.5" />,
        };
        return (
          <div className="flex items-center gap-1.5">
            {icons[channel] || icons.push}
            <span className="text-xs font-bold uppercase">{channel}</span>
          </div>
        );
      },
    },
    {
      key: 'sentAt',
      label: 'Sent At',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[var(--foreground)]">
          {row.sentAt ? new Date(row.sentAt).toLocaleString() : row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const status = row.status || 'sent';
        const statusConfig: Record<string, { color: string; icon: ReactNode; label: string }> = {
          sent: { color: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'SENT' },
          delivered: { color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'DELIVERED' },
          pending: { color: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300', icon: <Clock className="w-3.5 h-3.5" />, label: 'PENDING' },
          failed: { color: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300', icon: <Clock className="w-3.5 h-3.5" />, label: 'FAILED' },
        };
        const config = statusConfig[status] || statusConfig.sent;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'readAt',
      label: 'Read',
      render: (row) => {
        if (row.readAt) {
          return (
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
              {new Date(row.readAt).toLocaleDateString()}
            </span>
          );
        }
        return <span className="text-xs text-[var(--text-muted)]">Unread</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Bell className="w-4 h-4" />
        <span>All customer notifications sent from your store</span>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyMessage="No notifications found"
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer or notification content..."
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
