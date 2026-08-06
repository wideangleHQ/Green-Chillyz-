'use client';

import React from 'react';
import { useMyAssignment, useMyProfile, useRewardAnalytics } from '@/hooks/useRewardManagement';
import { StatCard } from '@/components/ui/StatCard';
import { Gift, Users, TrendingUp, Target, FileText, Settings as SettingsIcon } from 'lucide-react';

export default function RewardsOverviewPage() {
  const { data: assignment, isLoading: assignmentLoading } = useMyAssignment();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: analytics, isLoading: analyticsLoading } = useRewardAnalytics();

  return (
    <div className="flex flex-col gap-6">
      {/* Current Assignment */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Current Reward Assignment</h2>
        {assignmentLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[var(--surface-hover)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--surface-hover)] rounded w-1/2"></div>
          </div>
        ) : assignment ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-muted)]">Profile:</span>
              <span className="text-sm text-[var(--foreground)] font-bold">{assignment.profileName || 'Default Profile'}</span>
              {assignment.isDefault && (
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded">
                  DEFAULT
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-muted)]">Assigned On:</span>
              <span className="text-sm text-[var(--foreground)]">
                {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {assignment.effectiveFrom && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-muted)]">Effective From:</span>
                <span className="text-sm text-[var(--foreground)]">
                  {new Date(assignment.effectiveFrom).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No active reward assignment found</p>
        )}
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Profiles"
            value={analytics.totalProfiles ?? 0}
            icon={<FileText className="w-5 h-5" />}
            loading={analyticsLoading}
          />
          <StatCard
            title="Active Rules"
            value={analytics.activeRules ?? 0}
            icon={<SettingsIcon className="w-5 h-5" />}
            loading={analyticsLoading}
          />
          <StatCard
            title="Store Overrides"
            value={analytics.totalOverrides ?? 0}
            icon={<Gift className="w-5 h-5" />}
            loading={analyticsLoading}
          />
          <StatCard
            title="Redemptions Today"
            value={analytics.redemptionsToday ?? 0}
            icon={<TrendingUp className="w-5 h-5" />}
            loading={analyticsLoading}
          />
        </div>
      )}

      {/* Profile Details */}
      {profile && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Active Profile Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Profile Name</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{profile.name}</p>
            </div>
            {profile.description && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Description</p>
                <p className="text-sm text-[var(--foreground)]">{profile.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Status</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                  profile.status === 'published'
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300'
                }`}
              >
                {profile.status?.toUpperCase()}
              </span>
            </div>
            {profile.version && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Version</p>
                <p className="text-sm text-[var(--foreground)]">{profile.version}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
