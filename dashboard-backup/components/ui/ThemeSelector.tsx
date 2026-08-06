'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting until component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Skeleton placeholder to prevent layout shifts
    return (
      <div className="w-[120px] h-8 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
    );
  }

  const options = [
    { value: 'light', icon: <Sun className="w-4 h-4 stroke-[1.5]" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4 stroke-[1.5]" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4 stroke-[1.5]" />, label: 'System' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme Selection"
      className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 border border-[var(--border)] rounded-lg relative z-50 select-none shadow-soft transition-all duration-200"
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--color-primary)] shadow-sm font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
            title={`Switch to ${opt.label} theme`}
            aria-label={`${opt.label} theme`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
};

ThemeSelector.displayName = 'ThemeSelector';
export default ThemeSelector;
