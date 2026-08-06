'use client';

import React, { useState } from 'react';
import { useListVouchers, useVoucherHistory, useRedeemVoucher, useSearchCustomers } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Search, Ticket, CheckCircle2, AlertCircle, RefreshCw, Calendar, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function VoucherRedemption() {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [signature, setSignature] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scoped list of active vouchers for validation reference
  const { data: vouchers, isLoading: listLoading, refetch: refetchVouchers } = useListVouchers({
    status: 'ACTIVE',
    code: searchQuery || undefined,
    pageSize: 5,
  });

  // Recent redemption history at this store
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useVoucherHistory({
    page: 1,
    pageSize: 8,
  });

  const redeemMutation = useRedeemVoucher();

  // Active validation state derived client-side
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const handleSelectVoucher = (voucher: any) => {
    setSelectedVoucher(voucher);
    setCode(voucher.code);
    // Since signature is private on server and verification requires it,
    // in real environment we scan a QR containing code:signature.
    // We auto-fill or simulate signature if it is not exposed.
    // In our DB model, signature is required. Let's check how code scans pass signatures:
    // If the QR contains code + signature, they can type both.
    // We will provide input fields for both, and pre-fill if signature matches.
    setSignature(voucher.signature || 'SIMULATED_SIGNATURE_OK');
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      showToast('Please enter a voucher code', 'warning');
      return;
    }

    try {
      const res = await redeemMutation.mutateAsync({ code, signature });
      if (res.valid) {
        showToast(`Voucher ${code} successfully redeemed!`, 'success');
        setCode('');
        setSignature('');
        setSelectedVoucher(null);
        refetchVouchers();
        refetchHistory();
      } else {
        showToast(res.reason || 'Verification failed. Voucher is invalid or expired.', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Server error during redemption.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Voucher Redemption Console</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Scan or search customer vouchers, verify signatures, and register claims.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        
        {/* LEFT COLUMN: FAST REDEMPTION SCREEN */}
        <section className="flex flex-col gap-6">
          <form
            onSubmit={handleRedeem}
            className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft flex flex-col gap-4"
          >
            <h3 className="text-sm font-bold tracking-tight border-b border-[var(--border)]/10 pb-2 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-600" />
              <span>Verify & Redeem Voucher</span>
            </h3>

            {/* Simulated QR Code Scan Info */}
            <div className="text-[11px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 leading-relaxed">
              <strong>Staff Note:</strong> Point the scanner to the customer's mobile app QR code, or lookup active vouchers in the right-hand panel.
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <label htmlFor="voucher-code" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Voucher Code (Required)
                </label>
                <input
                  id="voucher-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GC-ABCD-1234"
                  className="w-full px-4 py-3 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                  required
                />
              </div>

              <div className="relative">
                <label htmlFor="voucher-signature" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Security Signature (Required for Validation)
                </label>
                <input
                  id="voucher-signature"
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Cryptographic verification token"
                  className="w-full px-4 py-3 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] font-mono"
                  required
                />
              </div>
            </div>

            {/* Loaded Voucher Context Preview */}
            {selectedVoucher && (
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]/15 flex flex-col gap-2.5 text-xs">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block border-b border-[var(--border)]/5 pb-1">
                  Matched Voucher Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Customer</span>
                    <div className="font-bold text-[var(--foreground)]">{selectedVoucher.user.fullName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Reward Title</span>
                    <div className="font-bold text-[var(--foreground)]">{selectedVoucher.reward.title}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Coins Cost</span>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedVoucher.reward.coinCost} coins</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)]">Expiry Date</span>
                    <div className="font-semibold text-[var(--foreground)]">
                      {new Date(selectedVoucher.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              isLoading={redeemMutation.isPending}
              className="py-3 font-bold mt-2"
            >
              Confirm Voucher Redemption
            </Button>
          </form>

          {/* RECENTS TABLE */}
          <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-3">
              <h3 className="text-sm font-bold tracking-tight">Recent Activity (Redeemed Vouchers)</h3>
              <button
                onClick={() => refetchHistory()}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                title="Refresh history"
              >
                <RefreshCw className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {historyLoading ? (
              <div className="space-y-2 py-4">
                <div className="h-6 bg-[var(--surface-hover)] rounded animate-pulse w-full" />
                <div className="h-6 bg-[var(--surface-hover)] rounded animate-pulse w-full" />
              </div>
            ) : history && history.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)]/10 text-[var(--text-muted)] font-semibold">
                      <th className="py-2.5">Code</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Reward</th>
                      <th className="py-2.5">Redeemed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/5">
                    {history.items.map((v: any) => (
                      <tr key={v.id} className="hover:bg-[var(--surface-hover)]">
                        <td className="py-3 font-mono font-bold text-[var(--foreground)]">{v.code}</td>
                        <td className="py-3 text-[var(--foreground)]">{v.user.fullName}</td>
                        <td className="py-3 text-[var(--foreground)]">{v.reward.title}</td>
                        <td className="py-3 text-[var(--text-muted)]">
                          {new Date(v.redeemedAt).toLocaleDateString()} at{' '}
                          {new Date(v.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                No recent redemptions at this branch today.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: ACTIVE VOUCHER LOOKUP PANEL */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div className="flex flex-col gap-1 border-b border-[var(--border)]/10 pb-3">
            <h3 className="text-sm font-bold tracking-tight">Active Voucher Lookup</h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              Select an active customer voucher to load its signature and details.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)]">
            <Search className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
            <input
              type="text"
              placeholder="Search by code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-2 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          {/* List items */}
          {listLoading ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-[var(--surface-hover)] rounded animate-pulse w-full" />
              <div className="h-10 bg-[var(--surface-hover)] rounded animate-pulse w-full" />
            </div>
          ) : vouchers && vouchers.items.length > 0 ? (
            <div className="flex flex-col gap-3">
              {vouchers.items.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVoucher(v)}
                  className={`flex flex-col items-start text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                    code === v.code
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold'
                      : 'border-[var(--border)]/10 hover:border-[var(--border)]/40 bg-[var(--background)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-bold text-[var(--foreground)]">{v.code}</span>
                    <span className="text-[10px] text-[var(--color-primary)] flex items-center gap-1">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[var(--foreground)] mt-2">{v.reward.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                    <User className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>{v.user.fullName}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)] flex flex-col items-center justify-center border border-dashed border-[var(--border)]/20 rounded-xl">
              <Ticket className="w-8 h-8 text-[var(--border)] mb-1 stroke-[1.5]" />
              <p className="text-xs font-semibold">No active vouchers found</p>
              <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                Try searching with a different code or select an active user voucher.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
