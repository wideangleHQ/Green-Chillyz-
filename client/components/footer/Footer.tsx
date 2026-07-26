"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";
import {
  MapPin,
  ArrowUpRight,
  Send,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useActiveStores } from "@/hooks/useStores";
import { Reveal } from "@/components/ui/Reveal";

const BRAND_MOTTO_ITEMS = [
  "Freshly Crafted Every Day",
  "Good Food, Great Company",
  "Taste That Brings People Together",
  "Made Fresh. Served Warm.",
  "Every Meal, A Memorable Moment",
  "Where Flavour Meets Family",
  "Authentic Hospitality",
  "Honest Ingredients",
];

const OUTLET_LOCATIONS = [
  { name: "Indiranagar", brand: "GreenChillyz", area: "100ft Road", href: "/#locations" },
  { name: "Koramangala", brand: "YellowChillyz", area: "5th Block", href: "/#locations" },
  { name: "UB City", brand: "GoldenChillyz", area: "Level 2", href: "/#locations" },
  { name: "Whitefield", brand: "GreenChillyz", area: "ITPL Main Rd", href: "/#locations" },
  { name: "Jayanagar", brand: "YellowChillyz", area: "4th Block", href: "/#locations" },
  { name: "HSR Layout", brand: "GreenChillyz", area: "27th Main", href: "/#locations" },
];

const NAV_COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/#story", label: "Our Story" },
      { href: "/menu", label: "Interactive Menu" },
      { href: "/#signature", label: "Signature Dishes" },
      { href: "/games", label: "Games & Rewards" },
      { href: "/#offers", label: "Local Deals" },
    ],
  },
  {
    heading: "Experience",
    links: [
      { href: "/#locations", label: "Store Locator" },
      { href: "/#reviews", label: "Verified Reviews" },
      { href: "/join", label: "Rewards Club" },
      { href: "/franchise", label: "Franchise Program" },
    ],
  },
  {
    heading: "Legal & Info",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/privacy", label: "Terms of Service" },
      { href: "/privacy", label: "Cookie Settings" },
      { href: "#locations", label: "Contact Us" },
    ],
  },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram", Icon: SiInstagram },
  { href: "https://facebook.com", label: "Facebook", Icon: SiFacebook },
  { href: "https://x.com", label: "X (Twitter)", Icon: SiX },
  { href: "https://youtube.com", label: "YouTube", Icon: SiYoutube },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { data: activeStores } = useActiveStores();

  const displayedStores = activeStores && activeStores.length > 0
    ? activeStores.slice(0, 6).map((store) => {
        const area = store.shortDescription || store.addressLine1.split(',')[0];
        return {
          name: store.name,
          area: area,
          href: `#locations`,
        };
      })
    : OUTLET_LOCATIONS;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="relative w-full bg-[#004D1E] text-white rounded-t-[36px] md:rounded-t-[48px] overflow-hidden select-none border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] mt-8">
      {/* Subtle Tonal Ambient Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Main Content Container */}
      <div className="relative z-10 container-site py-16 md:py-20 flex flex-col gap-14 md:gap-16">
        {/* EDITORIAL HERO STATEMENT */}
        <div className="flex flex-col gap-3 border-b border-white/15 pb-10">
          <Reveal>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              <span className="text-xs font-sans font-bold uppercase tracking-[0.25em] text-amber-400">
                GREENCHILLYZ GROUP • ESTD 1999
              </span>
            </div>
          </Reveal>

          <Reveal>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading uppercase text-white font-extrabold tracking-tight leading-[0.95] max-w-5xl">
              Flavours That Bring <span className="text-amber-400">People Together.</span>
            </h2>
          </Reveal>

          <Reveal>
            <p className="text-sm sm:text-base md:text-lg font-sans text-white/80 max-w-2xl leading-relaxed mt-1">
              Made fresh, served warm. One family, three authentic dining concepts across Bangalore &amp; Odisha: GreenChillyz, YellowChillyz, and GoldenChillyz.
            </p>
          </Reveal>
        </div>

        {/* TOP ROW: Newsletter Card & Outlets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Newsletter Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 p-6 sm:p-7 rounded-[28px] bg-white/10 backdrop-blur-md border border-white/20 shadow-medium relative overflow-hidden">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl font-heading uppercase font-extrabold text-white">
                Fresh Deals &amp; Local Stories
              </h3>
              <p className="text-xs font-sans text-white/80 leading-relaxed">
                Subscribe to receive seasonal chef specials, reward coin bonuses, and new outlet openings.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-full bg-white/15 border border-white/30 text-xs font-sans text-white placeholder-white/50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-[#003615] text-xs font-sans font-extrabold uppercase tracking-wider shadow-soft transition-all duration-300 hover:scale-102 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {subscribed ? (
                  <>
                    <Check className="size-4 text-[#003615]" />
                    <span>Joined!</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-1.5 text-[11px] font-sans text-white/70">
              <ShieldCheck className="size-3.5 text-amber-400" />
              <span>We respect your privacy. Unsubscribe anytime.</span>
            </div>
          </div>

          {/* Primary Outlets Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-white/70">
                Popular Kitchen Outlets
              </span>
              <Link
                href="#locations"
                className="text-xs font-sans font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>Store Locator</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {displayedStores.map((loc) => (
                <Link
                  key={loc.name}
                  href={loc.href}
                  className="group p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-amber-400/50 hover:scale-[1.01] transition-all duration-300 flex flex-col gap-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-400">
                    <MapPin className="size-3.5" />
                    <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-sans font-extrabold text-white truncate">
                    {loc.name}
                  </span>
                  <span className="text-[10px] font-sans text-white/70 truncate">
                    {loc.area}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE ROW: Brand Footprint & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-10 border-t border-white/15 items-start">
          {/* Brand Identity (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <Link href="/#top" className="flex items-center gap-3 group">
              <div className="size-11 rounded-full bg-white p-1 flex items-center justify-center shadow-soft transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/assets/icons/logo.png"
                  alt="GreenChillyz Group"
                  width={44}
                  height={44}
                  className="size-9 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-sans font-extrabold uppercase tracking-tight text-white">
                  GreenChillyz Group
                </span>
                <span className="text-[11px] font-sans text-white/70">
                  Taste, Reimagined • Est. 1999
                </span>
              </div>
            </Link>

            <p className="text-xs font-sans text-white/70 leading-relaxed max-w-sm">
              Over 25 years of authentic Indian casual dining, handcrafted spices, and community rewards across South &amp; East India.
            </p>

            {/* Social Icons (Light White Buttons) */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="size-9 rounded-full bg-white/10 hover:bg-amber-400 hover:text-[#003615] border border-white/20 flex items-center justify-center text-white transition-all duration-300 hover:scale-105 shadow-xs"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {NAV_COLUMNS.map((column) => (
              <div key={column.heading} className="flex flex-col gap-3">
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-amber-400">
                  {column.heading}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-white/80 hover:text-white hover:bg-white/15 px-3 py-1.5 -ml-3 rounded-full transition-all duration-200"
                      >
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* MARQUEE BRAND TICKER */}
        <div className="w-full overflow-hidden py-3 border border-white/15 relative bg-white/10 backdrop-blur-sm rounded-full shadow-xs">
          <div className="group flex overflow-hidden">
            <div className="flex gap-8 w-max animate-marquee-left group-hover:[animation-play-state:paused] transform-gpu">
              {[...BRAND_MOTTO_ITEMS, ...BRAND_MOTTO_ITEMS, ...BRAND_MOTTO_ITEMS].map(
                (text, idx) => (
                  <div
                    key={`${text}-${idx}`}
                    className="flex items-center gap-8 text-xs font-sans font-bold uppercase tracking-widest text-white/80 hover:text-amber-400 transition-colors"
                  >
                    <span>{text}</span>
                    <span className="size-1.5 rounded-full bg-amber-400/50" />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM COPYRIGHT STRIP (Darker solid green) */}
      <div className="w-full bg-[#003615] border-t border-white/15 py-5">
        <div className="container-site flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-white/70">
          <p>© {new Date().getFullYear()} GreenChillyz Group. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
