'use client';

import React, { useState } from 'react';
import { useListStoreVouchers, useArchiveStoreVoucher, useRestoreStoreVoucher } from '@/hooks/useDashboardOps';
import { StoreVoucher } from '@/lib/api/opsApi';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { VoucherForm } from '@/components/vouchers/VoucherForm';
import { Plus, Edit2, Archive, RotateCcw, Ticket } from 'lucide-react';

export default function VoucherManagementPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<StoreVoucher | null>(null);

  const { data, isLoading } = useListStoreVouchers({ page, pageSize: 10 });
  const archiveMutation = useArchiveStoreVoucher();
  const restoreMutation = useRestoreStoreVoucher();

  const handleCreateNew = () => {
    setEditingVoucher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (voucher: StoreVoucher) => {
    setEditingVoucher(voucher);
    setIsFormOpen(true);
  };

  const handleArchiveToggle = async (voucher: StoreVoucher) => {
    if (voucher.status === 'ARCHIVED') {
      await restoreMutation.mutateAsync(voucher.id);
    } else {
      if (confirm(`Are you sure you want to archive "${voucher.name}"?`)) {
        await archiveMutation.mutateAsync(voucher.id);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingVoucher(null);
  };

  const vouchers = data?.items || [];
  const totalItems = data?.meta?.totalItems || 0;

  if (isFormOpen) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        <VoucherForm 
          initialData={editingVoucher} 
          onClose={handleFormClose} 
          onSuccess={handleFormClose} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Voucher Management"
          description="Create and manage promotional vouchers for your store"
        />
        <Button onClick={handleCreateNew} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Create Voucher
        </Button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-sm overflow-hidden">
        <DataTable
          columns={[
            {
              label: 'Voucher Details',
              key: 'name',
              render: (item: StoreVoucher) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--foreground)]">{item.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{item.couponCode}</div>
                  </div>
                </div>
              ),
            },
            {
              label: 'Type',
              key: 'voucherType',
              render: (item: StoreVoucher) => (
                <div className="text-xs font-semibold">{item.voucherType.replace('_', ' ')}</div>
              ),
            },
            {
              label: 'Remaining',
              key: 'remainingCount',
              render: (item: StoreVoucher) => (
                <div className="text-xs">
                  <span className="font-bold">{item.remainingCount}</span> / {item.totalLimit}
                </div>
              ),
            },
            {
              label: 'Status',
              key: 'status',
              render: (item: StoreVoucher) => {
                const colors: Record<string, string> = {
                  ACTIVE: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
                  DRAFT: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
                  EXPIRED: 'text-red-600 bg-red-500/10 border-red-500/20',
                  ARCHIVED: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
                  PAUSED: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
                };
                const color = colors[item.status] || colors.DRAFT;
                return (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                    {item.status}
                  </span>
                );
              },
            },
            {
              label: 'Actions',
              key: 'actions',
              align: 'right',
              render: (item: StoreVoucher) => (
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors"
                    title="Edit Voucher"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleArchiveToggle(item)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-hover)] rounded transition-colors"
                    title={item.status === 'ARCHIVED' ? 'Restore' : 'Archive'}
                  >
                    {item.status === 'ARCHIVED' ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                </div>
              ),
            },
          ]}
          data={vouchers}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: 10,
            totalItems,
            onPageChange: setPage,
          }}
          emptyMessage="No vouchers found. Create one to get started."
        />
      </div>
    </div>
  );
}
