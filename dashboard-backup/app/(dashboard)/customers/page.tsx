'use client';

import React, { useState } from 'react';
import { useSearchCustomers, useCustomerProfile, useCustomerActivity, useWalletTransactions, useCustomerRewards, useCustomerGames, useCustomerNotifications } from '@/hooks/useDashboardOps';
import { Search, ChevronLeft, ChevronRight, X, User, Mail, Phone, Calendar, Wallet, CheckCircle2, Ticket, Gamepad2, Bell, Clock, RefreshCw, Filter, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CustomersModule() {
  // Roster Query State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const pageSize = 10;

  const { data: roster, isLoading: rosterLoading, refetch: refetchRoster } = useSearchCustomers({
    search: search || undefined,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });

  // Selected Customer Detail State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'rewards' | 'games' | 'notifications' | 'timeline'>('profile');

  // Queries for selected customer
  const { data: profile, isLoading: profileLoading } = useCustomerProfile(selectedCustomerId || '');
  const { data: timeline, isLoading: timelineLoading } = useCustomerActivity(selectedCustomerId || '', 12);
  const { data: transactions } = useWalletTransactions(selectedCustomerId || '', { page: 1, pageSize: 5 });
  const { data: redemptions } = useCustomerRewards(selectedCustomerId || '', { page: 1, pageSize: 5 });
  const { data: games } = useCustomerGames(selectedCustomerId || '', { page: 1, pageSize: 5 });
  const { data: notifications } = useCustomerNotifications(selectedCustomerId || '', { page: 1, pageSize: 5 });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleStatus = (id: string) => {
    // Status modifications are read-only operations for the dashboard frontend per specification
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight">Customer Profiles</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Review store guests, wallet balances, recent coin earnings and redemptions.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 p-4 border border-[var(--border)]/10 bg-[var(--surface)] rounded-2xl shadow-soft">
        <div className="flex items-center gap-2 px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search by name, email, phone or voucher code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full py-2.5 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-0 focus:border-none focus:outline-none"
          />
        </div>
        <button
          onClick={() => refetchRoster()}
          className="p-2.5 rounded-lg border border-[var(--border)]/10 bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ROSTER TABLE */}
      <div className="border border-[var(--border)]/10 rounded-2xl bg-[var(--surface)] shadow-soft overflow-hidden">
        {rosterLoading ? (
          <div className="p-12 space-y-4">
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
          </div>
        ) : roster && roster.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-[var(--border)]/15 text-[var(--text-muted)] font-semibold bg-zinc-50/50 dark:bg-zinc-900/20">
                  <th className="p-4 cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('fullName')}>
                    <div className="flex items-center gap-1.5">
                      <span>Full Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4 cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('walletBalance')}>
                    <div className="flex items-center gap-1.5">
                      <span>Balance</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4">Coins Earned</th>
                  <th className="p-4">Coins Spent</th>
                  <th className="p-4 cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('joinedAt')}>
                    <div className="flex items-center gap-1.5">
                      <span>Joined Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/5">
                {roster.items.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setActiveTab('profile');
                    }}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 border border-[var(--border)]/5 flex items-center justify-center font-bold text-[var(--color-primary)]">
                          {customer.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--foreground)]">{customer.fullName}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">@{customer.username || 'guest'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <div className="flex items-center gap-1 text-[var(--foreground)]">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {customer.walletBalance} coins
                    </td>
                    <td className="p-4 text-[var(--text-muted)]">{customer.lifetimeEarned}</td>
                    <td className="p-4 text-[var(--text-muted)]">{customer.lifetimeSpent}</td>
                    <td className="p-4 text-[var(--text-muted)]">
                      {new Date(customer.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-muted)] hover:text-[var(--foreground)]">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
            <User className="w-12 h-12 text-[var(--border)] mb-3 stroke-[1.2]" />
            <h4 className="text-sm font-semibold text-[var(--foreground)]">No customers found</h4>
            <p className="text-xs max-w-sm mt-1">
              Ensure you have typed the query correctly or clear filters.
            </p>
          </div>
        )}

        {/* PAGINATION PANEL */}
        {roster && roster.totalPages > 1 && (
          <div className="border-t border-[var(--border)]/10 px-4 py-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div>
              Showing page {page} of {roster.totalPages} ({roster.total} total items)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, roster.totalPages))}
                disabled={page === roster.totalPages}
                className="p-1.5 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CUSTOMER DETAIL SLIDE-OVER DRAWER ─── */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-999 flex justify-end select-none">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedCustomerId(null)} />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-2xl bg-[var(--surface)] border-l border-[var(--border)] h-full flex flex-col shadow-heavy animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)]/10 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/10">
              {profileLoading ? (
                <div className="space-y-2 py-2">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded w-36" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded w-56" />
                </div>
              ) : profile ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--border)] flex items-center justify-center font-heading text-lg text-[var(--color-primary)] uppercase">
                    {profile.fullName.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">{profile.fullName}</h3>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{profile.email}</span>
                      </span>
                      {profile.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{profile.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex border-b border-[var(--border)]/10 px-4 py-1 text-xs select-none">
              {(['profile', 'wallet', 'rewards', 'games', 'notifications', 'timeline'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-3 border-b-2 font-bold cursor-pointer capitalize transition-all ${
                    activeTab === tab
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {profileLoading ? (
                <div className="space-y-4 py-12">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" />
                </div>
              ) : profile ? (
                <>
                  {/* TAB 1: PROFILE OVERVIEW */}
                  {activeTab === 'profile' && (
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-zinc-50/50 dark:bg-zinc-900/10">
                          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Joined Date</span>
                          <div className="font-bold text-xs mt-1 text-[var(--foreground)]">
                            {new Date(profile.joinedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-zinc-50/50 dark:bg-zinc-900/10">
                          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Referred By</span>
                          <div className="font-bold text-xs mt-1 text-[var(--foreground)]">
                            {profile.customerProfile?.referredBy?.user.fullName || 'Organic sign-up'}
                          </div>
                        </div>
                      </div>

                      {/* COUNTS SNAPSHOT */}
                      <div className="flex flex-col gap-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Operations Snapshot</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 border border-[var(--border)]/10 rounded-lg text-center bg-[var(--background)]">
                            <div className="font-bold text-lg text-[var(--color-primary)]">{profile.counts.redemptions}</div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Redemptions</div>
                          </div>
                          <div className="p-3 border border-[var(--border)]/10 rounded-lg text-center bg-[var(--background)]">
                            <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{profile.counts.activeVouchers}</div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Active Vouchers</div>
                          </div>
                          <div className="p-3 border border-[var(--border)]/10 rounded-lg text-center bg-[var(--background)]">
                            <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{profile.counts.gameSessions}</div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Games Played</div>
                          </div>
                          <div className="p-3 border border-[var(--border)]/10 rounded-lg text-center bg-[var(--background)]">
                            <div className="font-bold text-lg text-purple-600 dark:text-purple-400">{profile.counts.unreadNotifications}</div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Unread Alerts</div>
                          </div>
                        </div>
                      </div>

                      {/* ADDITIONAL DETAILS */}
                      <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]/5 pb-2">
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)]">Date of Birth</span>
                            <div className="font-semibold text-[var(--foreground)] mt-0.5">
                              {profile.customerProfile?.dateOfBirth ? new Date(profile.customerProfile.dateOfBirth).toLocaleDateString() : 'Unspecified'}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)]">Gender</span>
                            <div className="font-semibold text-[var(--foreground)] mt-0.5 capitalize">
                              {profile.customerProfile?.gender || 'Unspecified'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: WALLET SUMMARY */}
                  {activeTab === 'wallet' && (
                    <div className="flex flex-col gap-5">
                      <div className="p-4 border border-[var(--border)]/10 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Current Coins Balance</span>
                          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                            {profile.wallet.balance} coins
                          </div>
                        </div>
                        <Wallet className="w-8 h-8 text-[var(--color-primary)]/20 stroke-[1.5]" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="p-3 border border-[var(--border)]/10 rounded-lg bg-[var(--background)]">
                          <div className="font-bold text-[var(--foreground)]">{profile.wallet.lifetimeEarned}</div>
                          <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Lifetime Earned</div>
                        </div>
                        <div className="p-3 border border-[var(--border)]/10 rounded-lg bg-[var(--background)]">
                          <div className="font-bold text-[var(--foreground)]">{profile.wallet.lifetimeSpent}</div>
                          <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Lifetime Spent</div>
                        </div>
                        <div className="p-3 border border-[var(--border)]/10 rounded-lg bg-[var(--background)]">
                          <div className="font-bold text-[var(--foreground)]">{profile.wallet.lifetimeExpired}</div>
                          <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Expired Coins</div>
                        </div>
                      </div>

                      {/* LEDGER SNAPSHOT */}
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Wallet Transactions</h4>
                        {transactions && transactions.items.length > 0 ? (
                          <div className="flex flex-col gap-2.5">
                            {transactions.items.map((t: any) => (
                              <div key={t.id} className="p-3 border border-[var(--border)]/5 bg-[var(--background)] rounded-lg flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-bold text-[var(--foreground)]">{t.description || t.source}</div>
                                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className={`font-bold ${t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                  {t.type === 'CREDIT' ? '+' : '-'}{t.amount}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-[var(--text-muted)]">No transactions recorded.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: REWARDS REDEMPTIONS */}
                  {activeTab === 'rewards' && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Issued Vouchers</h4>
                      {redemptions && redemptions.items.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {redemptions.items.map((r: any) => (
                            <div key={r.id} className="p-4 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-[var(--foreground)]">{r.reward.title}</div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-3">
                                  <span>Cost: {r.coinsSpent} coins</span>
                                  <span>•</span>
                                  <span>Date: {new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                                r.status === 'COMPLETED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--text-muted)]'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">No rewards redeemed yet.</div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: GAMES PLAYED */}
                  {activeTab === 'games' && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Gameplay History</h4>
                      {games && games.items.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {games.items.map((g: any) => (
                            <div key={g.id} className="p-4 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-[var(--foreground)]">{g.game.name}</div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                                  Date: {new Date(g.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-[var(--foreground)]">Score: {g.score}</div>
                                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 uppercase tracking-widest">{g.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">No games sessions recorded.</div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Delivered Messages</h4>
                      {notifications && notifications.items.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {notifications.items.map((n: any) => (
                            <div key={n.id} className="p-4 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex flex-col gap-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[var(--foreground)]">{n.title}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{n.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">No notifications sent.</div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: ACTIVITY TIMELINE */}
                  {activeTab === 'timeline' && (
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]/5 pb-2">
                        Customer Operations Journey
                      </h4>
                      {timelineLoading ? (
                        <div className="text-center py-8">Loading history...</div>
                      ) : timeline && timeline.length > 0 ? (
                        <div className="relative border-l border-[var(--border)]/15 pl-4 ml-2 flex flex-col gap-5 py-2">
                          {timeline.map((event, idx) => (
                            <div key={idx} className="relative text-xs">
                              {/* Dot marker */}
                              <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-white dark:border-zinc-950 bg-[var(--color-primary)]" />
                              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                                <span className="font-bold uppercase tracking-widest text-[9px] text-[var(--color-primary)]">{event.type}</span>
                                <span>
                                  {new Date(event.occurredAt).toLocaleDateString()} at{' '}
                                  {new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="font-bold text-[var(--foreground)] mt-0.5">{event.title}</div>
                              {event.detail && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{event.detail}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--text-muted)]">Timeline is empty.</div>
                      )}
                    </div>
                  )}

                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)]/10 bg-zinc-50 dark:bg-zinc-900/10 flex justify-end gap-2 text-xs">
              <Button variant="secondary" onClick={() => setSelectedCustomerId(null)} className="w-auto">
                Close Profile
              </Button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
