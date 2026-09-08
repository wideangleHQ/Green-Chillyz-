"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, UserRound, LogOut } from "lucide-react";
import { RupeeCoin } from "@/components/ui/RupeeCoin";
import { Drawer } from "@/components/ui/Drawer";
import { DURATION, EASE_STANDARD } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useAuth } from "@/components/auth/AuthContext";
import { WalletQuickView } from "@/components/wallet/WalletQuickView";
import { NotificationBell, NotificationDrawer } from "@/components/notifications";
import { useWalletSummary } from "@/hooks/useWallet";
import { formatCoins } from "@/types/wallet";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/games", label: "Games" },
  { href: "/#rewards", label: "Rewards" },
  { href: "/#locations", label: "Locations" },
  { href: "/franchise", label: "Franchise" },
];

/* Coins entry point is a core retention hook — visible at every tier
   (18_Responsive_Design_System.md). */
interface CoinsButtonProps {
  onClick: () => void;
  balance?: number;
}

function CoinsButton({ onClick, balance }: CoinsButtonProps) {
  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-hover px-5 py-2 text-sm font-sans font-extrabold uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:shadow-hover cursor-pointer border-none"
    >
      <RupeeCoin className="size-5" strokeWidth={2} />
      <span suppressHydrationWarning>{balance !== undefined ? `${formatCoins(balance)} CC` : "Coins"}</span>
    </button>
  );
}

/**
 * Floating glass pill navbar (04_Component_Library.md): hides on
 * scroll-down, reveals on scroll-up; hamburger drawer below tablet.
 */
export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { scrollY } = useScroll();
  const scaleMotion = usePrefersReducedMotion();
  const reducedMotion = scaleMotion;
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { data: walletSummary } = useWalletSummary(isAuthenticated);

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
          className="glass flex w-full max-w-5xl items-center justify-between gap-4 rounded-full py-1.5 pl-3.5 pr-2 shadow-floating"
        >
          <Link
            href="/"
            className="flex min-h-11 items-center"
            aria-label="GreenChillyz home"
          >
            <Image
              src="/assets/icons/logo.png"
              alt="GreenChillyz"
              width={56}
              height={56}
              className="size-11 sm:size-12 object-contain"
              priority
            />
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
            <CoinsButton
              onClick={() => {
                if (isAuthenticated) {
                  setWalletOpen(true);
                } else {
                  openAuthModal("sign-in");
                }
              }}
              balance={isAuthenticated && walletSummary ? walletSummary.balance : undefined}
            />
            {isAuthenticated && (
              <NotificationBell
                onClick={() => setNotificationsOpen(true)}
                enabled={isAuthenticated}
              />
            )}
            {isAuthenticated ? (
              <div className="relative group hidden lg:block">
                <button
                  type="button"
                  suppressHydrationWarning
                  aria-label="Profile menu"
                  className="flex size-11 items-center justify-center rounded-full border border-brand-green bg-brand-green/10 font-bold text-brand-green transition-all duration-200 hover:bg-brand-green hover:text-white cursor-pointer"
                >
                  <span suppressHydrationWarning>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserRound className="size-5" />}</span>
                </button>
                <div className="absolute right-0 top-12 hidden w-48 rounded-2xl border border-stone-200 bg-white p-2 shadow-heavy group-hover:block">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => openAuthModal("sign-in")}
                aria-label="Sign In"
                className="hidden size-11 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-all duration-200 hover:border-brand-green hover:text-brand-green hover:shadow-hover lg:flex cursor-pointer"
              >
                <UserRound aria-hidden="true" className="size-5" strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              suppressHydrationWarning
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
          <li className="pt-2 border-t border-slate-200/60">
            {isAuthenticated ? (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-nav-link text-red-600 hover:bg-red-50"
              >
                <LogOut className="size-5" />
                <span suppressHydrationWarning>Sign Out ({user?.fullName})</span>
              </button>
            ) : (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  setDrawerOpen(false);
                  openAuthModal("sign-in");
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-nav-link text-brand-green hover:bg-brand-green/10"
              >
                <UserRound className="size-5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </li>
        </ul>
      </Drawer>
      <WalletQuickView isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
