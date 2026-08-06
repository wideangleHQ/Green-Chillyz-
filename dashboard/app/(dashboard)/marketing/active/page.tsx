'use client';

import React from 'react';
import { useListCampaigns } from '@/hooks/useDashboardOps';
import { useChallenges } from '@/hooks/useChallenges';
import { Sparkles, Megaphone, Trophy } from 'lucide-react';

export default function ActivePromotionsPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useListCampaigns({ status: 'active' });
  const { data: challenges, isLoading: challengesLoading } = useChallenges({ status: 'active' });

  const isLoading = campaignsLoading || challengesLoading;

  const activeCampaigns = (campaigns as any)?.items?.filter((c: any) => c.status === 'active') || campaigns?.filter((c: any) => c.status === 'active') || [];
  const activeChallenges = (challenges as any)?.items?.filter((c: any) => c.status === 'active') || challenges?.filter((c: any) => c.status === 'active') || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-1">Active Promotions Overview</h2>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Monitor all currently running promotional activities including campaigns and challenges
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--border)] border-t-[var(--color-primary)]"></div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading active promotions...</p>
        </div>
      ) : (
        <>
          {/* Active Campaigns */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-[var(--foreground)]">Active Campaigns</h2>
              <span className="ml-auto px-2 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded">
                {activeCampaigns.length}
              </span>
            </div>

            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No active campaigns at the moment</p>
            ) : (
              <div className="space-y-3">
                {activeCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--foreground)] mb-1">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-xs text-[var(--text-muted)]">{campaign.description}</p>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs font-bold bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-2">
                      {campaign.startDate && <span>Started: {new Date(campaign.startDate).toLocaleDateString()}</span>}
                      {campaign.endDate && <span>Ends: {new Date(campaign.endDate).toLocaleDateString()}</span>}
                      {campaign.targetAudience && <span>Target: {campaign.targetAudience}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Challenges */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-[var(--foreground)]">Active Challenges</h2>
              <span className="ml-auto px-2 py-1 text-xs font-bold bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 rounded">
                {activeChallenges.length}
              </span>
            </div>

            {activeChallenges.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No active challenges at the moment</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeChallenges.map((challenge: any) => (
                  <div key={challenge.id} className="p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-bold text-[var(--foreground)]">{challenge.name}</p>
                      <Trophy className="w-4 h-4 text-yellow-600" />
                    </div>
                    {challenge.description && (
                      <p className="text-xs text-[var(--text-muted)] mb-3">{challenge.description}</p>
                    )}
                    <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                      {challenge.goal && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Goal:</span>
                          <span className="font-semibold text-[var(--foreground)]">{challenge.goal}</span>
                        </div>
                      )}
                      {challenge.rewardValue && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Reward:</span>
                          <span className="font-bold text-yellow-600">🪙 {challenge.rewardValue}</span>
                        </div>
                      )}
                      {challenge.participants !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Participants:</span>
                          <span className="font-semibold text-[var(--color-primary)]">{challenge.participants}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
