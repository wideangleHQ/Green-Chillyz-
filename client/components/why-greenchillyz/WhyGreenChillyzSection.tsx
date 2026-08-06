"use client";

import { motion } from "framer-motion";
import { History, ShieldCheck, Sparkles, HeartHandshake, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

interface TrustPillar {
  id: string;
  title: string;
  subtitle: string;
  highlight: string;
  icon: React.ElementType;
}

const PILLARS: TrustPillar[] = [
  {
    id: "since-1999",
    title: "Since 1999",
    subtitle: "Over 26 years of culinary heritage and community trust.",
    highlight: "26+ Years Legacy",
    icon: History,
  },
  {
    id: "quality",
    title: "Quality Ingredients",
    subtitle: "100% fresh produce, authentic hand-ground spices & zero artificial dyes.",
    highlight: "Pure & Authentic",
    icon: Sparkles,
  },
  {
    id: "hygiene",
    title: "Hygiene Standards",
    subtitle: "FSSAI certified kitchen protocols with daily multi-point sanitation checks.",
    highlight: "FSSAI Certified",
    icon: ShieldCheck,
  },
  {
    id: "team",
    title: "300+ Team Members",
    subtitle: "Dedicated chefs and hospitality staff behind every memorable meal.",
    highlight: "Culinary Experts",
    icon: HeartHandshake,
  },
  {
    id: "trusted-odisha",
    title: "Trusted Across Odisha",
    subtitle: "Serving over 10,000 satisfied guests daily across 15+ flagship locations.",
    highlight: "15+ Outlets",
    icon: MapPin,
  },
];

export function WhyGreenChillyzSection() {
  return (
    <section
      id="why-us"
      aria-labelledby="why-us-heading"
      className="relative w-full bg-[#FFF8F1] py-16 md:py-24 overflow-hidden border-t border-on-surface/5"
    >
      <div className="container-site relative z-10 flex flex-col gap-10">
        {/* Section Editorial Header */}
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
          <Reveal>
            <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
              Uncompromised Excellence
            </span>
          </Reveal>
          <Reveal>
            <h2
              id="why-us-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none"
            >
              Why <span className="text-brand-green">GreenChillyz?</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="text-sm md:text-base font-sans text-on-surface-variant leading-relaxed">
              Built on a foundation of quality, consistency, and guest satisfaction since 1999.
            </p>
          </Reveal>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.id}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative p-6 rounded-[24px] bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-soft hover:shadow-medium hover:border-brand-green/40 transition-all duration-300 flex flex-col justify-between h-full min-h-[200px]"
                >
                  <div>
                    <div className="size-11 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-4 group-hover:bg-brand-green group-hover:text-white transition-colors duration-300">
                      <Icon className="size-5 stroke-[1.75]" />
                    </div>

                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-brand-green">
                      {pillar.highlight}
                    </span>

                    <h3 className="text-lg font-heading font-extrabold text-on-surface mt-1 mb-2 group-hover:text-brand-green transition-colors duration-300">
                      {pillar.title}
                    </h3>
                  </div>

                  <p className="text-xs font-sans text-on-surface-variant leading-relaxed mt-2">
                    {pillar.subtitle}
                  </p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
