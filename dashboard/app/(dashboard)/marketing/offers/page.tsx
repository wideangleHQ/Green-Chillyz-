'use client';

import React from 'react';
import { Tag, AlertCircle } from 'lucide-react';

export default function OffersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Offers API Integration Pending</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Special offers and promotions management will be wired to the existing backend APIs for creating and managing location-based offers.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-12 text-center">
        <Tag className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
        <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Coming Soon</p>
        <p className="text-xs text-[var(--text-muted)]">
          Offers and special promotions management interface will be available here
        </p>
      </div>
    </div>
  );
}
