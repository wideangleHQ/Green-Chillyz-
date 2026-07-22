import type { ReactNode } from "react";

/* Ghost pill tag for categorization (outlet, cuisine). */
export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-outline-variant px-3 py-1.5 text-label-caps uppercase text-on-surface-variant ${className}`}
    >
      {children}
    </span>
  );
}
