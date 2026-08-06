'use client';

import React, { useState } from 'react';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useDashboardSessions, useRevokeSession, useDashboardLogoutAll } from '@/hooks/useDashboardAuth';
import { useToast } from '@/components/providers/ToastProvider';
import { Shield, Monitor, LogOut, Trash2, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SettingsModule() {
  const { store } = useDashboardAuth();
  const { showToast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // Queries
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useDashboardSessions();
  const revokeMutation = useRevokeSession();
  const logoutAllMutation = useDashboardLogoutAll();


  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this login session? The device will be signed out.')) return;
    try {
      await revokeMutation.mutateAsync(sessionId);
      showToast('Session ended successfully', 'success');
      refetchSessions();
    } catch {
      showToast('Failed to revoke session', 'error');
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to end all other active login sessions?')) return;
    try {
      const res = await logoutAllMutation.mutateAsync();
      showToast(`${res.revokedSessions} active session(s) ended successfully`, 'success');
      refetchSessions();
    } catch {
      showToast('Failed to revoke other sessions', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none text-xs">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1 border-b border-[var(--border)]/10 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">System Settings</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Audit login sessions, customize preferences, and inspect organization scopes.
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-[var(--border)]/10 pb-1">
        {[
          { id: 'general', label: 'Organization General', icon: <Layers className="w-4 h-4 shrink-0" /> },
          { id: 'security', label: 'Security & Sessions', icon: <Shield className="w-4 h-4 shrink-0" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && store && (
          <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-bold tracking-tight border-b border-[var(--border)]/10 pb-2">
              Assigned Organization Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Authorized Store</span>
                <span className="font-bold text-[var(--foreground)] mt-0.5 block">{store.storeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Scope Level</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{store.scope.scopeType}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Assigned Brand</span>
                <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{store.brandName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Permission Profile</span>
                <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{store.permissionsProfile}</span>
              </div>
            </div>

            <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]/5 text-[11px] leading-relaxed text-[var(--text-muted)] mt-4">
              <strong>Access Permissions granted:</strong>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {store.permissions.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]/10 font-mono text-[9px] text-[var(--foreground)] font-semibold">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & SESSIONS */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
            
            {/* Sessions list */}
            <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-2">
                <h3 className="text-sm font-bold tracking-tight">Active Login Sessions</h3>
                <button
                  onClick={() => refetchSessions()}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {sessionsLoading ? (
                <div className="py-12 text-center text-[var(--text-muted)] animate-pulse">Loading active sessions...</div>
              ) : sessions && sessions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor className="w-6 h-6 text-[var(--text-muted)] shrink-0 stroke-[1.2]" />
                        <div>
                          <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                            <span>{s.ipAddress}</span>
                            {s.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-[8px] uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-[280px] truncate">
                            {s.userAgent || 'Unknown Device'}
                          </div>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => handleRevoke(s.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                          title="Revoke session"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">No active sessions.</div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft flex flex-col gap-4 h-fit">
              <h3 className="text-sm font-bold tracking-tight border-b border-[var(--border)]/10 pb-2">
                Session Control Options
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                If you suspect unauthorized access from another device, you can instantly terminate all other active login sessions.
              </p>
              <Button
                variant="secondary"
                onClick={handleRevokeAll}
                className="py-2.5 font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/30 flex items-center gap-1.5 justify-center mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Revoke Other Sessions</span>
              </Button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
