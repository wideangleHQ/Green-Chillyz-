"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { CircleDollarSign, Menu, UserRound } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { DURATION, EASE_STANDARD } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const NAV_LINKS = [
  { href: "#story", label: "Story" },
  { href: "#menu", label: "Menu" },
  { href: "#games", label: "Games" },
  { href: "#rewards", label: "Rewards" },
  { href: "#locations", label: "Locations" },
  { href: "#franchise", label: "Franchise" },
];

/* Coins entry point is a core retention hook — visible at every tier
   (18_Responsive_Design_System.md). */
function CoinsButton() {
  return (
    <Link
      href="#rewards"
      className="flex min-h-11 items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-hover px-5 py-2 text-sm font-heading uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:shadow-hover"
    >
      <CircleDollarSign aria-hidden="true" className="size-5" strokeWidth={2} />
      Coins
    </Link>
  );
}

/**
 * Floating glass pill navbar (04_Component_Library.md): hides on
 * scroll-down, reveals on scroll-up; hamburger drawer below tablet.
 */
export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { scrollY } = useScroll();
  const reducedMotion = usePrefersReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 160 && !drawerOpen);
  });

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-[max(1rem,env(safe-area-inset-top))] md:px-6"
        animate={{ y: hidden ? "-130%" : "0%" }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: DURATION.reveal, ease: EASE_STANDARD }
        }
      >
        <nav
          aria-label="Main"
          className="glass flex w-full max-w-5xl items-center justify-between gap-4 rounded-full py-2 pl-4 pr-2 shadow-floating"
        >
          <Link
            href="#top"
            className="flex min-h-11 items-center gap-2"
            aria-label="GreenChillyz home"
          >
            <Image
              src="/assets/icons/logo.png"
              alt=""
              width={36}
              height={36}
              className="size-9 object-contain"
            />
            <span className="hidden text-nav-link font-semibold text-primary sm:inline">
              GreenChillyz
            </span>
          </Link>

          <ul className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-nav-link text-on-surface transition-colors duration-200 hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <CoinsButton />
            <Link
              href="#rewards"
              aria-label="Profile"
              className="hidden size-11 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-shadow duration-200 hover:shadow-hover lg:flex"
            >
              <UserRound aria-hidden="true" className="size-5" strokeWidth={2} />
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant text-on-surface lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" strokeWidth={2} />
            </button>
          </div>
        </nav>
      </motion.header>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} label="Menu">
        <ul className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className="flex min-h-11 items-center rounded-full px-4 text-nav-link text-on-surface transition-colors duration-200 hover:bg-surface-container hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
