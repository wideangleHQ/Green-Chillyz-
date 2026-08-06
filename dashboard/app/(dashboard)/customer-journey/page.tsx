'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

export default function CustomerJourneyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Customer Journey</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Customer lifecycle tracking and journey analytics</p>
      </div>

      <div className="p-12 rounded-xl border border-dashed border-[var(--border)]/30 bg-[var(--surface)] flex flex-col items-center justify-center text-center">
        <MapPin className="w-10 h-10 text-[var(--border)] mb-3 stroke-[1.5]" />
        <p className="text-sm font-bold text-[var(--foreground)]">Coming Soon</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[280px]">
          Customer journey tracking will be available once the backend module is deployed.
        </p>
      </div>
    </div>
  );
}
