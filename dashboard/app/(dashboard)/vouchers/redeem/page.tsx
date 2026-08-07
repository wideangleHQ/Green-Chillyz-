'use client';

import React, { useState } from 'react';
import { useListStoreVouchers, useRedeemStoreVoucher } from '@/hooks/useDashboardOps';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StoreVoucher } from '@/lib/api/opsApi';
import { Ticket, Search, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

export default function RedeemVoucherPage() {
  const [code, setCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  
  const { data, isLoading, isError } = useListStoreVouchers(
    { search: searchCode, pageSize: 5 }, 
    { enabled: searchCode.length > 3 } // Only search if we have a reasonable code
  );
  
  const redeemMutation = useRedeemStoreVoucher();
  const { showToast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSearchCode(code.trim().toUpperCase());
  };

  const matchedVoucher = data?.items?.find(
    (v: StoreVoucher) => v.couponCode.toUpperCase() === searchCode
  );

  const handleRedeem = async () => {
    if (!matchedVoucher) return;
    try {
      await redeemMutation.mutateAsync(matchedVoucher.couponCode);
      showToast(`Successfully redeemed "${matchedVoucher.name}"`, 'success');
      // Reset after success
      setCode('');
      setSearchCode('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || 'Failed to redeem voucher', 'error');
    }
  };

  const isExpired = matchedVoucher?.status === 'EXPIRED';
  const isDepleted = matchedVoucher?.remainingCount === 0;
  const isArchived = matchedVoucher?.status === 'ARCHIVED';
  const isPaused = matchedVoucher?.status === 'PAUSED';
  
  const canRedeem = matchedVoucher && !isExpired && !isDepleted && !isArchived && !isPaused;

  return (
    <div className="space-y-8 max-w-3xl mx-auto pt-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl mx-auto flex items-center justify-center border border-[var(--color-primary)]/20 shadow-inner">
          <Zap className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Fast Redeem</h1>
        <p className="text-sm text-[var(--text-muted)]">Scan or enter the customer's voucher code to validate and redeem instantly.</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Ticket className="h-6 w-6 text-[var(--text-muted)]" />
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER COUPON CODE"
              className="block w-full pl-12 pr-4 py-4 text-xl font-mono tracking-widest uppercase bg-[var(--input-bg)] border-2 border-[var(--border)] rounded-xl focus:border-[var(--color-primary)] focus:ring-0 transition-colors"
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="md:w-32 py-4 h-auto text-lg gap-2"
            disabled={!code.trim() || isLoading}
          >
            {isLoading ? '...' : <><Search className="w-5 h-5" /> Verify</>}
          </Button>
        </form>

        {/* Validation Results */}
        {searchCode && !isLoading && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {!matchedVoucher ? (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Invalid Code</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                  No active voucher found with code "{searchCode}". Please check the code and try again.
                </p>
              </div>
            ) : (
              <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)] shadow-sm">
                <div className={`p-4 border-b border-[var(--border)] flex items-center gap-2 font-bold uppercase tracking-wider text-xs ${canRedeem ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                  {canRedeem ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {canRedeem ? 'Voucher is Valid & Ready' : 'Voucher Cannot Be Redeemed'}
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Voucher Offer</div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">{matchedVoucher.name}</div>
                    {matchedVoucher.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{matchedVoucher.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-[var(--border)]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Type</div>
                      <div className="text-sm font-semibold mt-0.5">{matchedVoucher.voucherType.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Remaining</div>
                      <div className={`text-sm font-bold mt-0.5 ${isDepleted ? 'text-red-500' : ''}`}>
                        {matchedVoucher.remainingCount} / {matchedVoucher.totalLimit}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</div>
                      <div className="text-sm font-semibold mt-0.5">{matchedVoucher.status}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Venue</div>
                      <div className="text-sm font-semibold mt-0.5">{matchedVoucher.redeemVenue || 'Any'}</div>
                    </div>
                  </div>

                  {!canRedeem && (
                    <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/10 space-y-1">
                      <div className="text-xs font-bold text-red-600">Reason for invalidity:</div>
                      <ul className="list-disc list-inside text-xs text-red-600/80">
                        {isExpired && <li>The voucher has expired.</li>}
                        {isDepleted && <li>The voucher has reached its maximum redemption limit.</li>}
                        {isArchived && <li>The voucher is archived.</li>}
                        {isPaused && <li>The voucher is currently paused by management.</li>}
                      </ul>
                    </div>
                  )}

                  {canRedeem && (
                    <Button 
                      size="lg" 
                      className="w-full py-6 text-lg font-bold tracking-wide"
                      onClick={handleRedeem}
                      disabled={redeemMutation.isPending}
                    >
                      {redeemMutation.isPending ? 'Redeeming...' : 'REDEEM VOUCHER NOW'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
