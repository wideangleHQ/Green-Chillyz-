import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "primary" | "gold";
  children: ReactNode;
  className?: string;
}

/* Pill status flag, label-caps type. Gold strictly for Signature tier. */
export function Badge({ variant = "primary", children, className = "" }: BadgeProps) {
  const fill =
    variant === "gold"
      ? "bg-tertiary-container text-on-surface"
      : "bg-primary text-on-primary";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-label-caps uppercase ${fill} ${className}`}
    >
      {children}
    </span>
  );
}
