'use client';

import React from 'react';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useDashboardSession, useDashboardSessions } from '@/hooks/useDashboardAuth';
import { Settings, Shield, Monitor, LogOut, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { store } = useDashboardAuth();
  const { data: currentSession, isLoading: sessionLoading } = useDashboardSession();
  const { data: sessions, isLoading: sessionsLoading } = useDashboardSessions();

  return (
    <div className="flex flex-col gap-6">
      {/* Account Information */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Account Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Store</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{store?.storeName}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Role</p>
            <span className="inline-flex px-2 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded uppercase">
              {store?.role}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Location</p>
            <p className="text-sm text-[var(--foreground)]">{store?.city}, {store?.state}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Store ID</p>
            <p className="text-sm font-mono text-[var(--foreground)]">{store?.storeId}</p>
          </div>
        </div>
      </div>

      {/* Current Session */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Current Session</h2>
        </div>

        {sessionLoading ? (
          <div className="animate-pulse h-16 bg-[var(--surface-hover)] rounded"></div>
        ) : currentSession ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">Active Session</p>
                <div className="space-y-1">
                  {currentSession.ipAddress && (
                    <p className="text-xs text-green-700 dark:text-green-300">IP: {currentSession.ipAddress}</p>
                  )}
                  {currentSession.userAgent && (
                    <p className="text-xs text-green-700 dark:text-green-300 truncate max-w-md">
                      Device: {currentSession.userAgent}
                    </p>
                  )}
                  {currentSession.lastActivityAt && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Last Activity: {new Date(currentSession.lastActivityAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <span className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded">ACTIVE</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Session information not available</p>
        )}
      </div>

      {/* Security & Sessions */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Security & Sessions</h2>
        </div>

        {sessionsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session: any, index: number) => (
              <div key={session.id || index} className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor className="w-4 h-4 text-[var(--text-muted)]" />
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {session.device || 'Unknown Device'}
                    </p>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {session.ipAddress && (
                      <p className="text-xs text-[var(--text-muted)]">IP: {session.ipAddress}</p>
                    )}
                    {session.lastActivity && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Last seen: {new Date(session.lastActivity).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Revoke Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No active sessions</p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Security Best Practices</p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>Always sign out when using shared devices</li>
              <li>Review active sessions regularly and revoke unfamiliar ones</li>
              <li>Never share your access code with unauthorized personnel</li>
              <li>Report any suspicious activity to your administrator immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
