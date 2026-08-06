'use client';

import React, { useState } from 'react';
import { useListWallets, useWalletTransactions } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Search, ChevronLeft, ChevronRight, Wallet, ArrowDownCircle, ArrowUpCircle, Filter, Download, Clock, User, Mail, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function WalletModule() {
  const { showToast } = useToast();

  // Search & Pagination States for Wallets list
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pageSize = 10;

  const { data: wallets, isLoading: listLoading, refetch: refetchWallets } = useListWallets({
    search: search || undefined,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });

  // Selected Wallet Ledger States
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');

  const { data: ledger, isLoading: ledgerLoading } = useWalletTransactions(
    selectedWallet?.customerId || '',
    {
      page: txPage,
      pageSize: 5,
      type: txType || undefined,
      status: txStatus || undefined,
    }
  );

  const handleSelectWallet = (wallet: any) => {
    setSelectedWallet(wallet);
    setTxPage(1);
    setTxType('');
    setTxStatus('');
  };

  // CSV Exporter for Audit
  const handleExportCSV = (wallet: any) => {
    if (!ledger || ledger.items.length === 0) {
      showToast('No ledger transactions to export', 'warning');
      return;
    }

    try {
      const headers = ['Transaction ID', 'Type', 'Amount', 'Status', 'Source', 'Description', 'Created At'];
      const rows = ledger.items.map((t) => [
        t.id,
        t.type,
        t.amount,
        t.status,
        t.source,
        t.description || '',
        new Date(t.createdAt).toISOString(),
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ledger_${wallet.customerId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Ledger CSV exported successfully', 'success');
    } catch {
      showToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-12 select-none">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Wallet Ledgers</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Audit customer coin balance distributions, pending deposits, and transaction histories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        
        {/* LEFT COLUMN: WALLETS LIST */}
        <section className="flex flex-col gap-4">
          
          {/* SEARCH & REFRESH */}
          <div className="flex items-center gap-3 p-4 border border-[var(--border)]/10 bg-[var(--surface)] rounded-2xl shadow-soft">
            <div className="flex items-center gap-2 px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
              <input
                type="text"
                placeholder="Search wallet by guest name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-0 focus:border-none focus:outline-none"
              />
            </div>
            <button
              onClick={() => refetchWallets()}
              className="p-2 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* TABLE GRID */}
          <div className="border border-[var(--border)]/10 rounded-2xl bg-[var(--surface)] shadow-soft overflow-hidden">
            {listLoading ? (
              <div className="p-12 space-y-4">
                <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
              </div>
            ) : wallets && wallets.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)]/15 text-[var(--text-muted)] font-semibold bg-zinc-50/50 dark:bg-zinc-900/20">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Balance</th>
                      <th className="p-4">Pending</th>
                      <th className="p-4">Earned</th>
                      <th className="p-4">Spent</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/5">
                    {wallets.items.map((w) => (
                      <tr
                        key={w.customerId}
                        onClick={() => handleSelectWallet(w)}
                        className={`cursor-pointer transition-colors ${
                          selectedWallet?.customerId === w.customerId
                            ? 'bg-[var(--color-primary)]/5 font-semibold'
                            : 'hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-[var(--foreground)]">{w.customerName}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{w.customerEmail}</div>
                        </td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{w.balance}</td>
                        <td className="p-4 text-[var(--text-muted)]">{w.pendingBalance}</td>
                        <td className="p-4 text-[var(--text-muted)]">{w.lifetimeEarned}</td>
                        <td className="p-4 text-[var(--text-muted)]">{w.lifetimeSpent}</td>
                        <td className="p-4 text-center">
                          <span className="text-[10px] font-bold text-[var(--color-primary)]">Audit</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-[var(--text-muted)]">
                No customer wallets found.
              </div>
            )}

            {/* WALLETS PAGINATION */}
            {wallets && wallets.totalPages > 1 && (
              <div className="border-t border-[var(--border)]/10 px-4 py-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <div>Page {page} of {wallets.totalPages}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1 border border-[var(--border)]/10 rounded disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, wallets.totalPages))}
                    disabled={page === wallets.totalPages}
                    className="p-1 border border-[var(--border)]/10 rounded disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: DETAIL LEDGER PANEL */}
        <section className="flex flex-col gap-4">
          {selectedWallet ? (
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft flex flex-col gap-4 relative">
              <button
                onClick={() => setSelectedWallet(null)}
                className="absolute top-4 right-4 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Wallet Summary */}
              <div className="flex items-center gap-3 border-b border-[var(--border)]/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--border)]/5 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">{selectedWallet.customerName}</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">{selectedWallet.customerEmail}</p>
                </div>
              </div>

              {/* Coins Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]/10">
                  <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Coins Balance</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {selectedWallet.balance}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]/10">
                  <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Pending Coins</span>
                  <span className="text-base font-bold text-amber-500 block mt-0.5">
                    {selectedWallet.pendingBalance}
                  </span>
                </div>
              </div>

              {/* Ledger Query Filters */}
              <div className="flex gap-2 text-xs">
                <select
                  value={txType}
                  onChange={(e) => {
                    setTxType(e.target.value);
                    setTxPage(1);
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-[var(--border)]/10 rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none text-[11px]"
                >
                  <option value="">All Types</option>
                  <option value="CREDIT">Credits (+)</option>
                  <option value="DEBIT">Debits (-)</option>
                </select>
                <select
                  value={txStatus}
                  onChange={(e) => {
                    setTxStatus(e.target.value);
                    setTxPage(1);
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-[var(--border)]/10 rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none text-[11px]"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Transactions List */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ledger Activity</h4>
                  <button
                    onClick={() => handleExportCSV(selectedWallet)}
                    className="text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV Export</span>
                  </button>
                </div>

                {ledgerLoading ? (
                  <div className="space-y-2 py-4">
                    <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                    <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                  </div>
                ) : ledger && ledger.items.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {ledger.items.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {t.type === 'CREDIT' ? (
                            <ArrowDownCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowUpCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[var(--foreground)] truncate">{t.description || t.source}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                              <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="capitalize text-[9px] font-semibold">{t.status.toLowerCase()}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold shrink-0 ml-2 ${t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {t.type === 'CREDIT' ? '+' : '-'}{t.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-xl">
                    No transactions match filters.
                  </div>
                )}
              </div>

              {/* Transactions Ledger Pagination */}
              {ledger && ledger.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--border)]/10 pt-3 text-[10px] text-[var(--text-muted)]">
                  <span>Page {txPage} of {ledger.totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTxPage((p) => Math.max(p - 1, 1))}
                      disabled={txPage === 1}
                      className="p-1 border border-[var(--border)]/10 rounded disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTxPage((p) => Math.min(p + 1, ledger.totalPages))}
                      disabled={txPage === ledger.totalPages}
                      className="p-1 border border-[var(--border)]/10 rounded disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-[var(--border)]/20 bg-[var(--surface)]/50 rounded-2xl text-center text-[var(--text-muted)] flex flex-col items-center justify-center py-24 shadow-soft">
              <Wallet className="w-10 h-10 text-[var(--border)] mb-3 stroke-[1.2]" />
              <h4 className="text-xs font-bold text-[var(--foreground)]">Select a Customer Wallet</h4>
              <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                Click on any guest row in the left roster list to load their transactions ledger.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
