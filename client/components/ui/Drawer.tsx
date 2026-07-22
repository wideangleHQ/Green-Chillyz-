"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { DURATION, EASE_STANDARD } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}

/**
 * Mobile nav drawer (04_Component_Library.md): slides from right, glass,
 * traps focus while open, ESC + overlay-click close. Slide replaced by
 * plain fade under reduced motion.
 */
export function Drawer({ open, onClose, label, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button, a")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60">
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 cursor-pointer bg-inverse-surface/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.micro }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="glass absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col gap-6 rounded-l-lg p-8 pt-[max(2rem,env(safe-area-inset-top))]"
            initial={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: DURATION.reveal, ease: EASE_STANDARD }}
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="ml-auto flex size-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant text-on-surface"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={2} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
