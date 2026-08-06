"use client";

import { motion } from "framer-motion";
import { Award, Wrench, GraduationCap, Megaphone, TrendingUp, ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

interface FranchisePillar {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const FRANCHISE_PILLARS: FranchisePillar[] = [
  {
    id: "brand",
    title: "Established Brand Legacy",
    description: "Partner with a 26+ year household food brand with proven customer loyalty across Eastern India.",
    icon: Award,
  },
  {
    id: "operations",
    title: "Operational Support",
    description: "End-to-end kitchen setup, standardized recipes, and robust central supply chain management.",
    icon: Wrench,
  },
  {
    id: "training",
    title: "Comprehensive Training",
    description: "Rigorous staff training modules for chefs, kitchen managers, and hospitality teams.",
    icon: GraduationCap,
  },
  {
    id: "marketing",
    title: "Marketing Assistance",
    description: "National & regional brand campaigns, localized promotion strategies, and digital presence.",
    icon: Megaphone,
  },
  {
    id: "growth",
    title: "High Growth Opportunity",
    description: "Be part of our ambitious vision expanding towards 100 outlets across tier-1 & tier-2 cities.",
    icon: TrendingUp,
  },
];

export function FranchiseSection() {
  return (
    <section id="franchise" aria-labelledby="franchise-headline" className="relative w-full bg-[#FFF8F1] py-16 md:py-24 overflow-hidden border-t border-on-surface/5">
      <div className="container-site flex flex-col items-center gap-12 text-center relative z-10">
        <div id="franchise-headline" className="max-w-3xl">
          <SectionHeader
            eyebrow="Franchise Opportunity"
            headline="Partner With GreenChillyz."
            body="With 15+ thriving outlets and a 26-year legacy, we're expanding towards 100 outlets. Bring Odisha's favorite food brand to your city."
            colorTheme="green"
          />
        </div>

        {/* 5 Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 w-full text-left">
          {FRANCHISE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.id}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group p-6 rounded-[24px] bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-soft hover:shadow-medium hover:border-brand-green/40 transition-all duration-300 flex flex-col justify-between h-full min-h-[200px]"
                >
                  <div>
                    <div className="size-11 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-4 group-hover:bg-brand-green group-hover:text-white transition-colors duration-300">
                      <Icon className="size-5 stroke-[1.75]" />
                    </div>

                    <h3 className="text-base font-heading font-extrabold text-on-surface mb-2 group-hover:text-brand-green transition-colors duration-300">
                      {pillar.title}
                    </h3>
                  </div>

                  <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                    {pillar.description}
                  </p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Button variant="primary-red" href="/franchise">
              Start Your Inquiry
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
