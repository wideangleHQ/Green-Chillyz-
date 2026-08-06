'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAnnouncerProps {
  message?: string | null;
  className?: string;
}

export const ErrorAnnouncer: React.FC<ErrorAnnouncerProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-800 dark:text-red-300 text-xs font-medium leading-relaxed transition-all duration-200 ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5 stroke-[2]" />
      <div className="flex-1">{message}</div>
    </div>
  );
};

ErrorAnnouncer.displayName = 'ErrorAnnouncer';
