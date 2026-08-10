/**
 * A lightweight utility to conditionally join Tailwind CSS classes.
 * Since the client project does not currently use clsx or tailwind-merge,
 * this provides a dependency-free fallback for class concatenation.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
