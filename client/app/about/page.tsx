"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, CheckCircle2, Award, Sparkles, TrendingUp, HeartHandshake, ShieldCheck, Users, Store, History, Utensils } from "lucide-react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Preloader } from "@/components/preloader/Preloader";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Reveal } from "@/components/ui/Reveal";

/* Timeline Milestones (Section 2) */
const TIMELINE = [
  {
    year: "1999",
    title: "Founded in 1999",
    description: "Opened our flagship kitchen in Odisha, serving authentic flame-grilled delicacies and hand-ground spice dishes.",
  },
  {
    year: "2005",
    title: "Initial Growth",
    description: "Expanded local footprint across capital hubs, building unbroken community trust and customer loyalty.",
  },
  {
    year: "2012",
    title: "Multi-Outlet Expansion",
    description: "Scalable central cloud kitchen operations established to support rapid dining expansions across Odisha.",
  },
  {
    year: "2018",
    title: "YellowChillyz Launch",
    description: "Introduced YellowChillyz, a dedicated pure & traditional Sattvik-friendly culinary experience.",
  },
  {
    year: "2021",
    title: "GoldenChillyz Launch",
    description: "Unveiled GoldenChillyz, elevating Odisha's rich culinary heritage into luxury fine dining.",
  },
  {
    year: "Present",
    title: "15+ Outlets & 300+ Team",
    description: "Serving over 10,000 satisfied guests daily with 300+ dedicated hospitality professionals.",
  },
  {
    year: "Future",
    title: "Vision: 100+ Outlets",
    description: "Bringing GreenChillyz authentic hospitality to every major city across Eastern India.",
  },
];

/* Brand Snapshot Stats (Section 4) */
const STATS = [
  { value: "26+", label: "Years of Legacy", sublabel: "Est. 1999 • Odisha" },
  { value: "15+", label: "Outlets Network", sublabel: "Across Major Cities" },
  { value: "300+", label: "Team Members", sublabel: "Dedicated Hospitality Pros" },
  { value: "4", label: "Business Verticals", sublabel: "Dine-In • Takeaway • Delivery • Catering" },
  { value: "100+", label: "Outlet Target", sublabel: "Future Expansion Vision" },
];

/* Our Brands (Section 5) */
const BRANDS = [
  {
    id: "green",
    name: "GreenChillyz",
    identity: "Fresh · Modern · Reimagined",
    description: "The flagship QSR and casual dining brand serving flame-grilled perfection and fresh ingredients daily.",
    image: "/assets/brand-story/brand_story_green.png",
    cta: "Explore GreenChillyz",
    href: "/menu",
  },
  {
    id: "yellow",
    name: "YellowChillyz",
    identity: "Pure · Traditional · Sattvik",
    description: "Comforting street food classics and satvik-friendly meals crafted without onion or garlic.",
    image: "/assets/brand-story/brand_story_yellow.png",
    cta: "Discover YellowChillyz",
    href: "/menu",
  },
  {
    id: "gold",
    name: "GoldenChillyz",
    identity: "Royal · Refined · Luxurious",
    description: "Elevated fine dining featuring slow-cooked royal recipes and magnificent banquet hospitality.",
    image: "/assets/brand-story/brand_story_gold.png",
    cta: "Experience GoldenChillyz",
    href: "/menu",
  },
];

/* Business Verticals (Section 6) */
const VERTICALS = [
  {
    id: "dine-in",
    title: "Dine-In Experience",
    label: "Flagship Outlets",
    description: "Vibrant, family-friendly spaces serving piping hot flame-grilled delicacies and authentic meals.",
    image: "/assets/brand-story/brand_story_green.png",
    href: "/#locations",
  },
  {
    id: "takeaway",
    title: "Express Takeaway",
    label: "Quick Pickup",
    description: "Fast, hygienic, and eco-friendly packaged meals crafted for your busy daily routine.",
    image: "/assets/food/rolls_signature.png",
    href: "/menu",
  },
  {
    id: "delivery",
    title: "Home Delivery",
    label: "Doorstep Express",
    description: "Kitchen-fresh food delivery bringing authentic Odisha flavors straight to your home or office.",
    image: "/assets/food/biryani_signature.png",
    href: "/menu",
  },
  {
    id: "catering",
    title: "Event Catering",
    label: "Grand Galas & Events",
    description: "Bespoke full-service catering and live counter spreads for weddings, corporate galas & celebrations.",
    image: "/assets/brand-story/brand_story_gold.png",
    href: "/#story",
  },
  {
    id: "institutional",
    title: "Institutional Partnerships",
    label: "Corporate & Campuses",
    description: "Tailored food service solutions, cafeteria management, and bulk meals for corporate hubs & campuses.",
    image: "/assets/brand-story/brand_story_yellow.png",
    href: "/#story",
  },
];

/* Why GreenChillyz (Section 8) */
const PILLARS = [
  {
    title: "Since 1999",
    subtitle: "Over 26 years of unbroken community trust and culinary heritage.",
    highlight: "26+ Years Legacy",
  },
  {
    title: "Signature Taste",
    subtitle: "Authentic hand-ground spice blends and flame-roasted perfection daily.",
    highlight: "100% Authentic",
  },
  {
    title: "Hygiene Standards",
    subtitle: "FSSAI-certified kitchen protocols with multi-point daily sanitation checks.",
    highlight: "FSSAI Certified",
  },
  {
    title: "Operational Excellence",
    subtitle: "Centralized supply chain ensuring peak ingredients across all outlets.",
    highlight: "Peak Quality",
  },
  {
    title: "Customer Trust",
    subtitle: "Serving over 10,000 satisfied dining & delivery guests every single day.",
    highlight: "10,000+ Guests Daily",
  },
];

/* Recognition (Section 9) */
const RECOGNITION = [
  {
    title: "Business Excellence Award",
    year: "2023",
    issuer: "Odisha Brand Leadership",
    detail: "Awarded for Outstanding Quality & Operational Growth in Regional Dining.",
  },
  {
    title: "Swiggy Top Delivery Partner",
    year: "2024",
    issuer: "Swiggy Food Awards",
    detail: "Recognized for Fastest Fulfillment & 4.8+ Delivery Customer Ratings.",
  },
  {
    title: "Zomato Gold Dining Winner",
    year: "2024",
    issuer: "Zomato Restaurant Partner Awards",
    detail: "Rated 4.9/5.0 across flagship casual dining locations.",
  },
  {
    title: "State Hygiene & Safety Certification",
    year: "2025",
    issuer: "FSSAI Standards Board",
    detail: "100% compliance score across central kitchens & outlet preparation units.",
  },
];

/* Testimonials (Section 10) */
const TESTIMONIALS = [
  {
    author: "Soumya Ranjan Patnaik",
    role: "Dine-In Guest • Bhubaneswar",
    quote: "GreenChillyz has been our go-to family dining spot for over a decade. The tandoori platter and authentic biryani flavor never fail to delight.",
    rating: "5.0",
  },
  {
    author: "Priyanka Mohanty",
    role: "Doorstep Delivery • Cuttack",
    quote: "Orders always arrive piping hot and spill-proof. The signature Kathi rolls and Schezwan noodles are my late-night office fuel!",
    rating: "5.0",
  },
  {
    author: "Rajesh Kumar Mishra",
    role: "Corporate Event Host • Bhubaneswar",
    quote: "We hired GreenChillyz Catering for our corporate summit (500+ guests). Flawless live counter service and glowing reviews from all attendees.",
    rating: "5.0",
  },
];

export default function AboutPage() {
  return (
    <SmoothScroll>
      <Preloader />
      <Navbar />

      <main className="relative w-full bg-[#FFF8F1] overflow-hidden">
        {/* =========================================================
            SECTION 1: HERO (Cinematic Brand Introduction)
        ========================================================= */}
        <section className="relative w-full min-h-[85vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-stone-900 text-white">
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/brand-story/brand_story_green.png"
              alt="GreenChillyz Flagship Interior"
              fill
              priority
              className="object-cover opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-stone-900/30" />
          </div>

          <div className="container-site relative z-10 text-center flex flex-col items-center max-w-4xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md text-[#69f0ae] border border-[#69f0ae]/30 mb-6">
                <span>Since 1999</span>
                <span className="size-1.5 rounded-full bg-[#69f0ae]" />
                <span className="font-number">26</span>
                <span>Years of Heritage</span>
              </div>
            </Reveal>

            <Reveal>
              <h1 className="text-display-hero-mobile md:text-display-hero-tablet xl:text-display-hero font-heading font-extrabold uppercase tracking-tight leading-none text-white max-w-4xl">
                Legacy of Flavor. <br />
                <span className="text-brand-green">Crafted Fresh Daily.</span>
              </h1>
            </Reveal>

            <Reveal>
              <p className="mt-6 text-sm sm:text-base md:text-lg font-sans text-white/90 font-medium max-w-2xl leading-relaxed">
                Founded in 1999, GreenChillyz is Odisha&apos;s premier food &amp; hospitality brand. Over 26 years, we have grown into a 15+ outlet culinary institution powered by 300+ passionate team members.
              </p>
            </Reveal>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: BRAND JOURNEY (Interactive Timeline)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto mb-16">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Our Evolution
              </span>
            </Reveal>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                The Brand <span className="text-brand-green">Journey.</span>
              </h2>
            </Reveal>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Center Spine Line */}
            <div className="absolute top-0 bottom-0 left-4 md:left-1/2 -translate-x-1/2 w-[2px] bg-stone-300/80" />

            <div className="flex flex-col gap-12">
              {TIMELINE.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <Reveal key={item.year + item.title}>
                    <div
                      className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${
                        isEven ? "md:flex-row-reverse text-left md:text-right" : "text-left"
                      }`}
                    >
                      {/* Milestone Card */}
                      <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                        <motion.div
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="p-6 md:p-8 rounded-[24px] bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-soft hover:shadow-medium hover:border-brand-green/40 transition-all duration-300"
                        >
                          <span className="text-sm font-number font-extrabold uppercase tracking-wider text-brand-green bg-brand-green/10 px-3 py-1 rounded-full border border-brand-green/20">
                            {item.year}
                          </span>
                          <h3 className="text-xl font-heading font-extrabold text-on-surface mt-3 mb-2">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-sans text-on-surface-variant leading-relaxed">
                            {item.description}
                          </p>
                        </motion.div>
                      </div>

                      {/* Center Badge Dot */}
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 size-8 rounded-full bg-brand-green text-white flex items-center justify-center border-4 border-[#FFF8F1] shadow-medium z-10 font-number text-xs font-bold">
                        {index + 1}
                      </div>

                      <div className="hidden md:block w-1/2" />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: FOUNDER & VISION
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Founder Image Placeholder */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="relative w-full h-[380px] sm:h-[450px] rounded-[28px] overflow-hidden border border-stone-200/80 shadow-heavy bg-stone-900">
                  <Image
                    src="/assets/brand-story/brand_story_green.png"
                    alt="GreenChillyz Leadership"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#69f0ae]">Leadership Vision</span>
                    <h4 className="text-xl font-heading font-extrabold text-white uppercase mt-1">GreenChillyz Leadership</h4>
                    <p className="text-xs font-sans text-white/80">Est. 1999 • Bhubaneswar, Odisha</p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Message & 3 Leadership Principles */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Reveal>
                <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                  Founder Message
                </span>
              </Reveal>

              <Reveal>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                  Honest Food. <br />
                  <span className="text-brand-green">Uncompromised Passion.</span>
                </h2>
              </Reveal>

              <Reveal>
                <p className="text-sm sm:text-base font-sans text-on-surface-variant font-medium leading-relaxed">
                  &ldquo;Our mission from day one has been simple: serve honest, authentic food with uncompromised quality and genuine warmth. Food isn&apos;t just sustenance—it is what brings families and communities together.&rdquo;
                </p>
              </Reveal>

              {/* 3 Principles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <Reveal>
                  <div className="p-5 rounded-[20px] bg-white/90 border border-stone-200/80 shadow-soft">
                    <h3 className="text-base font-heading font-extrabold text-on-surface uppercase mb-1">Quality</h3>
                    <p className="text-xs font-sans text-on-surface-variant leading-relaxed">100% fresh produce &amp; hand-ground spices daily.</p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="p-5 rounded-[20px] bg-white/90 border border-stone-200/80 shadow-soft">
                    <h3 className="text-base font-heading font-extrabold text-on-surface uppercase mb-1">Discipline</h3>
                    <p className="text-xs font-sans text-on-surface-variant leading-relaxed">FSSAI certified multi-point sanitation checks.</p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="p-5 rounded-[20px] bg-white/90 border border-stone-200/80 shadow-soft">
                    <h3 className="text-base font-heading font-extrabold text-on-surface uppercase mb-1">Growth</h3>
                    <p className="text-xs font-sans text-on-surface-variant leading-relaxed">Empowering local talent towards 100+ outlets.</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: BRAND SNAPSHOT (Statistics Cards)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto mb-12">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Scale &amp; Impact
              </span>
            </Reveal>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                Brand <span className="text-brand-green">Snapshot.</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {STATS.map((stat) => (
              <Reveal key={stat.label}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-6 rounded-[24px] bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-soft hover:shadow-medium hover:border-brand-green/40 transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]"
                >
                  <span className="text-4xl md:text-5xl font-number font-extrabold text-on-surface tracking-tight text-brand-green">
                    {stat.value}
                  </span>
                  <div className="mt-4 flex flex-col gap-0.5">
                    <h3 className="text-base font-sans font-bold text-on-surface tracking-tight">
                      {stat.label}
                    </h3>
                    <p className="text-xs font-sans text-on-surface-variant font-medium">
                      {stat.sublabel}
                    </p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* =========================================================
            SECTION 5: OUR BRANDS (3 Brand Identity Cards)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto mb-12">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Culinary Identities
              </span>
            </Reveal>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                One Family. <span className="text-brand-green">Three Flavors.</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BRANDS.map((b) => (
              <Reveal key={b.id}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  className="group relative rounded-[26px] bg-white/90 overflow-hidden border border-stone-200/80 shadow-soft hover:shadow-heavy hover:border-brand-green/40 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative w-full h-[220px] bg-stone-900 overflow-hidden">
                    <Image
                      src={b.image}
                      alt={b.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#69f0ae] bg-black/50 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15">
                      {b.identity}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                    <div>
                      <h3 className="text-2xl font-heading font-extrabold uppercase text-on-surface group-hover:text-brand-green transition-colors">
                        {b.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-sans text-on-surface-variant leading-relaxed mt-2">
                        {b.description}
                      </p>
                    </div>

                    <Link
                      href={b.href}
                      className="inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-brand-green group-hover:translate-x-1 transition-transform"
                    >
                      <span>{b.cta}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* =========================================================
            SECTION 6: BUSINESS VERTICALS (Landscape Image Cards)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-on-surface/10 mb-10">
            <div className="flex flex-col gap-2 max-w-xl">
              <Reveal>
                <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                  Operations Scope
                </span>
              </Reveal>
              <Reveal>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                  Business <span className="text-brand-green">Verticals.</span>
                </h2>
              </Reveal>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {VERTICALS.map((v, idx) => {
              const spanClass = idx < 2 ? "lg:col-span-3" : "lg:col-span-2";
              return (
                <Reveal key={v.id} className={spanClass}>
                  <Link href={v.href} className="group block w-full h-full">
                    <motion.div
                      whileHover={{ y: -4, transition: { duration: 0.25 } }}
                      className="relative w-full h-[320px] sm:h-[360px] rounded-[24px] overflow-hidden border border-stone-200/80 hover:border-brand-green/60 shadow-soft hover:shadow-heavy transition-all duration-300 bg-stone-900 cursor-pointer"
                    >
                      <Image
                        src={v.image}
                        alt={v.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transform transition-transform duration-500 group-hover:scale-105 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                      <div className="absolute inset-0 z-20 p-6 md:p-8 flex flex-col justify-end text-white">
                        <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#69f0ae] bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 w-fit mb-3">
                          {v.label}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-heading font-extrabold uppercase tracking-tight text-white group-hover:text-[#69f0ae] transition-colors">
                          {v.title}
                        </h3>
                        <p className="text-xs sm:text-sm font-sans font-medium text-white/85 line-clamp-2 mt-1 max-w-lg leading-relaxed">
                          {v.description}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-white group-hover:text-[#69f0ae] transition-colors">
                          <span>Learn More</span>
                          <ArrowRight className="size-4 transform transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            SECTION 7: NETWORK PRESENCE (Odisha Map & Footprint)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Reveal>
                <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                  Odisha Network
                </span>
              </Reveal>

              <Reveal>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                  Deep Rooted <br />
                  <span className="text-brand-green">Across Odisha.</span>
                </h2>
              </Reveal>

              <Reveal>
                <p className="text-sm font-sans text-on-surface-variant leading-relaxed font-medium">
                  With 15+ outlets strategically located in major urban centers including Bhubaneswar, Cuttack, Puri, Rourkela, and Sambalpur, GreenChillyz is expanding rapidly towards 100+ outlets across Eastern India.
                </p>
              </Reveal>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-number font-bold text-xs">15+</div>
                  <span className="text-xs font-sans font-bold text-on-surface uppercase tracking-wider">Active Outlets Across Odisha</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-number font-bold text-xs">100+</div>
                  <span className="text-xs font-sans font-bold text-on-surface uppercase tracking-wider">Vision Outlets Target</span>
                </div>
              </div>
            </div>

            {/* Map Interactive Visualization */}
            <div className="lg:col-span-7">
              <Reveal>
                <div className="relative w-full h-[360px] sm:h-[420px] rounded-[28px] bg-white/90 border border-stone-200/80 shadow-soft p-6 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-green flex items-center gap-2">
                      <MapPin className="size-4 animate-bounce" /> Regional Footprint
                    </span>
                    <span className="text-[11px] font-sans font-semibold text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                      Bhubaneswar HQ
                    </span>
                  </div>

                  {/* Cities Pills Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-auto">
                    {["Bhubaneswar", "Cuttack", "Puri", "Rourkela", "Sambalpur", "Balasore"].map((city) => (
                      <div key={city} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-2.5">
                        <span className="relative flex size-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-brand-green" />
                        </span>
                        <span className="text-xs font-sans font-bold text-on-surface">{city}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-sans text-on-surface-variant font-medium">
                    Note: Central supply chain hubs ensure 100% daily freshness across all locations.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 8: WHY GREENCHILLYZ (5 Pillars)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto mb-12">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Uncompromising Trust
              </span>
            </Reveal>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                Why <span className="text-brand-green">GreenChillyz?</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {PILLARS.map((pillar) => (
              <Reveal key={pillar.title}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-6 rounded-[24px] bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-soft hover:shadow-medium hover:border-brand-green/40 transition-all duration-300 flex flex-col justify-between h-full min-h-[190px]"
                >
                  <div>
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-brand-green">
                      {pillar.highlight}
                    </span>
                    <h3 className="text-lg font-heading font-extrabold text-on-surface mt-1 mb-2">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                    {pillar.subtitle}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* =========================================================
            SECTION 9: AWARDS & RECOGNITION (Grid Layout)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto mb-12">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Industry Accolades
              </span>
            </Reveal>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                Awards &amp; <span className="text-brand-green">Recognition.</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {RECOGNITION.map((rec) => (
              <Reveal key={rec.title}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-6 rounded-[24px] bg-white/90 border border-stone-200/80 shadow-soft flex flex-col justify-between h-full min-h-[200px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-number font-extrabold text-brand-green bg-brand-green/10 px-3 py-1 rounded-full border border-brand-green/20">
                        {rec.year}
                      </span>
                      <Award className="size-5 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-heading font-extrabold text-on-surface mb-1">
                      {rec.title}
                    </h3>
                    <span className="text-[11px] font-sans font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                      {rec.issuer}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                    {rec.detail}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* =========================================================
            SECTION 10: CUSTOMER TRUST (3 Curated Testimonial Cards)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto mb-12">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Guest Voices
              </span>
            </Reveal>
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                Customer <span className="text-brand-green">Trust.</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.author}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-6 md:p-8 rounded-[26px] bg-white/90 border border-stone-200/80 shadow-soft flex flex-col justify-between h-full min-h-[220px]"
                >
                  <p className="text-xs sm:text-sm font-sans text-on-surface font-medium leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-sans font-extrabold text-on-surface">{t.author}</h3>
                      <span className="text-[11px] font-sans text-on-surface-variant">{t.role}</span>
                    </div>
                    <span className="text-xs font-number font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      ★ {t.rating}
                    </span>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* =========================================================
            SECTION 11: GROWTH VISION (Closing Section)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site border-b border-on-surface/5">
          <div className="p-8 sm:p-12 md:p-16 rounded-[32px] bg-stone-900 text-white relative overflow-hidden flex flex-col items-center text-center max-w-5xl mx-auto shadow-heavy">
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-3xl">
              <Reveal>
                <span className="text-xs font-sans font-bold uppercase tracking-[0.25em] text-[#69f0ae]">
                  Long-Term Ambition
                </span>
              </Reveal>
              <Reveal>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-extrabold uppercase text-white tracking-tight leading-none">
                  Expanding Towards <br />
                  <span className="text-brand-green">100+ Outlets.</span>
                </h2>
              </Reveal>
              <Reveal>
                <p className="text-xs sm:text-sm md:text-base font-sans text-white/85 leading-relaxed font-medium mt-2">
                  Our growth vision combines central kitchen innovation, digital ordering technology, and warm guest hospitality to establish GreenChillyz across every major urban center in Eastern India.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 12: FINAL CTA (Partner & Contact)
        ========================================================= */}
        <section className="py-16 md:py-24 container-site text-center flex flex-col items-center gap-6">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
              Join Our <span className="text-brand-green">Journey.</span>
            </h2>
          </Reveal>

          <Reveal>
            <p className="text-xs sm:text-sm md:text-base font-sans text-on-surface-variant max-w-md font-medium">
              Explore partnership opportunities or connect with our corporate headquarters in Bhubaneswar.
            </p>
          </Reveal>

          <Reveal>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <Link
                href="/franchise"
                className="btn-fluid-red inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 font-sans font-extrabold uppercase tracking-wider text-sm shadow-heavy cursor-pointer min-h-12 border border-white/10"
              >
                <span>Partner With Us</span>
                <ArrowRight className="size-4" />
              </Link>

              <a
                href="#locations"
                className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 font-sans font-extrabold uppercase tracking-wider text-sm bg-white text-stone-900 hover:bg-stone-100 transition-colors duration-200 border border-stone-300 shadow-medium min-h-12"
              >
                Contact GreenChillyz
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </SmoothScroll>
  );
}
