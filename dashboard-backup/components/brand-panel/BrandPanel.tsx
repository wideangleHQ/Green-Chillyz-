'use client';

import React from 'react';
import { Users, Wallet, Ticket, BarChart3, ShieldCheck, Lock, Key, Eye } from 'lucide-react';

export const BrandPanel: React.FC = () => {
  const highlights = [
    {
      icon: <Users className="w-5 h-5 text-[var(--color-primary)] stroke-[1.5]" />,
      title: 'Customer Management',
      description: 'Look up customer profiles, tier progress, and transaction history.',
    },
    {
      icon: <Wallet className="w-5 h-5 text-[var(--color-primary)] stroke-[1.5]" />,
      title: 'Wallet & Rewards',
      description: 'Manage coin accounts, process manual adjustments, and audit ledger entries.',
    },
    {
      icon: <Ticket className="w-5 h-5 text-[var(--color-primary)] stroke-[1.5]" />,
      title: 'Voucher Redemption',
      description: 'Validate, process, and track customer reward voucher redemptions in real-time.',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-[var(--color-primary)] stroke-[1.5]" />,
      title: 'Store Analytics',
      description: 'Track daily operations, campaign performances, and active store metrics.',
    },
  ];

  const securityIndicators = [
    { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: 'Secure Authentication' },
    { icon: <Lock className="w-3.5 h-3.5" />, text: 'Encrypted Session' },
    { icon: <Key className="w-3.5 h-3.5" />, text: 'Enterprise Access' },
    { icon: <Eye className="w-3.5 h-3.5" />, text: 'Role-Based Permissions' },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between w-full h-full bg-[var(--brand-panel-bg)] text-[var(--brand-panel-fg)] p-12 border-l border-[var(--border)] relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-secondary)]/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-3 relative z-10">
        <img src="/logo.png" alt="GreenChillyz Logo" className="h-10 object-contain" />
        <div>
          <span className="font-heading text-lg tracking-wide uppercase">GreenChillyz</span>
          <span className="ml-1.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
            Operations
          </span>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="my-auto max-w-lg relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            One platform, complete control.
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Manage stores, customers, rewards, wallets, offers, vouchers, and local operations from a single unified workspace.
          </p>
        </div>

        <div className="grid gap-6">
          {highlights.map((item, index) => (
            <div key={index} className="flex gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all duration-200 shadow-soft">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--background)] border border-[var(--border)] shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Minimalist Trust/Security Footer */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 relative z-10 pt-4 border-t border-[var(--border)]">
        {securityIndicators.map((indicator, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider"
          >
            <span className="text-[var(--color-primary)]">{indicator.icon}</span>
            <span>{indicator.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default BrandPanel;
