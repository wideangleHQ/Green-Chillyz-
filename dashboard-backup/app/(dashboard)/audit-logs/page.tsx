'use client';

import React, { useState } from 'react';
import { useQueryAuditLogs } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Search, FileText, Filter, Download, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Info, AlertOctagon, X, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AuditLogs() {
  const { showToast } = useToast();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [actionType, setActionType] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: logs, isLoading, refetch } = useQueryAuditLogs({
    page,
    pageSize,
    search: search || undefined,
    severity: severity || undefined,
    action: actionType || undefined,
  });

  // Selected Log detail dialog state
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const handleExportCSV = () => {
    if (!logs || logs.items.length === 0) {
      showToast('No logs available to export', 'warning');
      return;
    }

    try {
      const headers = ['Log ID', 'Action', 'Severity', 'Entity Type', 'Actor Name', 'Actor Role', 'Timestamp'];
      const rows = logs.items.map((log: any) => [
        log.id,
        log.action,
        log.severity,
        log.entityType,
        log.actorName,
        log.actorRole,
        new Date(log.createdAt).toISOString(),
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `audit_logs_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Audit trail exported successfully', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const getSeverityBadge = (level: string) => {
    const classes = {
      INFO: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
      WARNING: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
      CRITICAL: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-900/30',
    };
    const icons = {
      INFO: <Info className="w-3.5 h-3.5 shrink-0" />,
      WARNING: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      CRITICAL: <AlertOctagon className="w-3.5 h-3.5 shrink-0" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-bold ${classes[level as keyof typeof classes] || classes.INFO}`}>
        {icons[level as keyof typeof icons] || icons.INFO}
        <span>{level}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-12 select-none text-xs">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1 border-b border-[var(--border)]/10 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Enterprise Audit Timeline</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Audit system actions, role access attempts, and configuration mutations. Records are immutable.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border border-[var(--border)]/10 bg-[var(--surface)] rounded-2xl shadow-soft">
        <div className="flex items-center gap-2 px-3 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search by action, actor name, role, or entity ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 text-xs text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-0 focus:border-none focus:outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-[var(--border)]/10 rounded-lg bg-[var(--input-bg)] text-xs text-[var(--foreground)] outline-none w-full sm:w-[130px]"
          >
            <option value="">All Severity</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] flex items-center gap-1.5 cursor-pointer shrink-0 font-semibold"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AUDIT TIMELINE LOGS */}
      <div className="border border-[var(--border)]/10 rounded-2xl bg-[var(--surface)] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
          </div>
        ) : logs && logs.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]/15 text-[var(--text-muted)] font-semibold bg-zinc-50/50 dark:bg-zinc-900/20">
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Role Profile</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/5">
                {logs.items.map((log: any) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-[var(--foreground)]">{log.action}</td>
                    <td className="p-4">{getSeverityBadge(log.severity)}</td>
                    <td className="p-4 text-[var(--foreground)] font-semibold">{log.actorName}</td>
                    <td className="p-4 text-[var(--text-muted)]">{log.actorRole}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] text-[var(--text-muted)]">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--text-muted)]">
                      {new Date(log.createdAt).toLocaleDateString()} at{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-2xl">
            <FileText className="w-12 h-12 text-[var(--border)] mb-3 stroke-[1.2]" />
            <h4 className="text-sm font-semibold text-[var(--foreground)]">No audit records found</h4>
            <p className="text-xs max-w-sm mt-1 mx-auto leading-relaxed">
              Timelines will load once events are registered by backend handlers.
            </p>
          </div>
        )}

        {/* PAGINATION */}
        {logs && logs.totalPages > 1 && (
          <div className="border-t border-[var(--border)]/10 px-4 py-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <div>Page {page} of {logs.totalPages} ({logs.total} logs)</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1 border border-[var(--border)]/10 rounded disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, logs.totalPages))}
                disabled={page === logs.totalPages}
                className="p-1 border border-[var(--border)]/10 rounded disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setSelectedLog(null)} />
          <div className="relative max-w-lg w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-heavy p-6 flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-2">
              <h3 className="text-sm font-bold tracking-tight">Audit Event Inspector</h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Action ID</span>
                  <span className="font-mono text-[var(--text-muted)] select-all">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Severity Level</span>
                  <span className="block mt-0.5">{getSeverityBadge(selectedLog.severity)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)]/5 pt-3">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Actor User</span>
                  <span className="font-bold text-[var(--foreground)]">{selectedLog.actorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Assigned Role</span>
                  <span className="font-semibold text-[var(--foreground)]">{selectedLog.actorRole}</span>
                </div>
              </div>

              {/* JSON Metadata Payload */}
              <div className="flex flex-col gap-1.5 border-t border-[var(--border)]/5 pt-3">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Metadata JSON Payload</span>
                </span>
                <pre className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-[var(--border)]/10 rounded-lg overflow-x-auto text-[10px] font-mono text-[var(--foreground)] leading-normal max-h-[180px]">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="border-t border-[var(--border)]/10 pt-3 flex justify-end">
              <Button onClick={() => setSelectedLog(null)} className="w-auto px-6">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
