"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Single source of truth for reduced-motion state (10_Development_Rules.md).
 * Wraps Framer Motion's media-query hook so every section imports from /hooks.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
