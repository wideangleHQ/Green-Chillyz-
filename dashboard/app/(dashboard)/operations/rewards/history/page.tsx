'use client';

import React from 'react';
import { useMyAssignmentHistory, useMyOverrideHistory } from '@/hooks/useRewardManagement';
import { History, GitBranch } from 'lucide-react';

export default function RewardHistoryPage() {
  const { data: assignmentHistory, isLoading: assignmentLoading } = useMyAssignmentHistory();
  const { data: overrideHistory, isLoading: overrideLoading } = useMyOverrideHistory();

  const isLoading = assignmentLoading || overrideLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--border)] border-t-[var(--color-primary)]"></div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Assignment History */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Profile Assignment History</h2>
        </div>

        {!assignmentHistory || assignmentHistory.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No assignment history available</p>
        ) : (
          <div className="space-y-3">
            {assignmentHistory.map((assignment: any, index: number) => (
              <div
                key={assignment.id || index}
                className="flex items-start gap-4 p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-[var(--foreground)]">{assignment.profileName}</p>
                    {assignment.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Assigned on {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : 'Unknown'}
                  </p>
                  {assignment.effectiveFrom && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Effective from {new Date(assignment.effectiveFrom).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {assignment.assignedBy && (
                  <div className="text-xs text-[var(--text-muted)]">
                    By: {assignment.assignedBy}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override History */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Override History</h2>
        </div>

        {!overrideHistory || overrideHistory.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No override history available</p>
        ) : (
          <div className="space-y-3">
            {overrideHistory.map((override: any, index: number) => (
              <div
                key={override.id || index}
                className="flex items-start gap-4 p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-[var(--foreground)]">{override.ruleName || override.ruleId}</p>
                    <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 rounded">
                      {override.overrideType || 'OVERRIDE'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Value: <span className="font-semibold">{override.value ?? '-'}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {override.effectiveFrom ? `From ${new Date(override.effectiveFrom).toLocaleDateString()}` : ''}{' '}
                    {override.effectiveTo ? `to ${new Date(override.effectiveTo).toLocaleDateString()}` : 'ongoing'}
                  </p>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {override.createdAt ? new Date(override.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
