"use client";

import { motion } from "framer-motion";
import { Award, Store, Users, UtensilsCrossed } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

interface StatItem {
  id: string;
  value: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const STATS: StatItem[] = [
  {
    id: "legacy",
    value: "26+",
    label: "Years of Legacy",
    sublabel: "Est. 1999 • Culinary Excellence",
    icon: Award,
  },
  {
    id: "outlets",
    value: "15+",
    label: "Outlets Network",
    sublabel: "Across Odisha & Growing",
    icon: Store,
  },
  {
    id: "team",
    value: "300+",
    label: "Team Members",
    sublabel: "Dedicated Hospitality Pros",
    icon: Users,
  },
  {
    id: "verticals",
    value: "4-in-1",
    label: "Full Service",
    sublabel: "Dine-In • Takeaway • Delivery • Catering",
    icon: UtensilsCrossed,
  },
];

export function BrandSnapshotSection() {
  return (
    <section
      id="snapshot"
      aria-label="Brand Snapshot"
      className="relative w-full bg-[#FFF8F1] py-12 md:py-16 overflow-hidden border-b border-on-surface/5"
    >
      <div className="container-site relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Reveal key={stat.id}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative p-6 md:p-8 rounded-[24px] bg-white border border-stone-200/80 shadow-soft hover:shadow-medium hover:border-brand-green/30 transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-number font-extrabold text-on-surface tracking-tight group-hover:text-brand-green transition-colors duration-300">
                      {stat.value}
                    </span>
                    <div className="p-3 rounded-2xl bg-brand-green/10 text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors duration-300">
                      <Icon className="size-5 stroke-[2]" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-0.5">
                    <h3 className="text-base font-sans font-bold text-on-surface tracking-tight">
                      {stat.label}
                    </h3>
                    <p className="text-xs font-sans text-on-surface-variant font-medium">
                      {stat.sublabel}
                    </p>
                  </div>

                  {/* Accent Bottom Border Line on Hover */}
                  <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-brand-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
