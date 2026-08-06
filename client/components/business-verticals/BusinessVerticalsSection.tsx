"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

interface BusinessVertical {
  id: string;
  title: string;
  categoryLabel: string;
  description: string;
  imagePlaceholder: string;
  href: string;
  spanClass: string;
}

const VERTICALS: BusinessVertical[] = [
  {
    id: "dine-in",
    title: "Dine-In Experience",
    categoryLabel: "Flagship Outlets",
    description: "Warm, vibrant family dining spaces serving piping hot flame-grilled delicacies and authentic meals.",
    imagePlaceholder: "/assets/brand-story/brand_story_green.png",
    href: "/#locations",
    spanClass: "lg:col-span-3",
  },
  {
    id: "takeaway",
    title: "Express Takeaway",
    categoryLabel: "Quick Pickup",
    description: "Fast, hygienic, and eco-friendly packaged meals crafted for your busy daily routine.",
    imagePlaceholder: "/assets/food/rolls_signature.png",
    href: "/menu",
    spanClass: "lg:col-span-3",
  },
  {
    id: "delivery",
    title: "Home Delivery",
    categoryLabel: "Doorstep Express",
    description: "Kitchen-fresh food delivery bringing authentic Odisha flavors straight to your home or office.",
    imagePlaceholder: "/assets/food/biryani_signature.png",
    href: "/menu",
    spanClass: "lg:col-span-2",
  },
  {
    id: "catering",
    title: "Event Catering",
    categoryLabel: "Grand Galas & Events",
    description: "Bespoke full-service catering and live counter spreads for weddings, corporate galas & celebrations.",
    imagePlaceholder: "/assets/brand-story/brand_story_gold.png",
    href: "/#story",
    spanClass: "lg:col-span-2",
  },
  {
    id: "institutional",
    title: "Institutional Partnerships",
    categoryLabel: "Corporate & Campuses",
    description: "Tailored food service solutions, cafeteria management, and bulk meals for corporate hubs & campuses.",
    imagePlaceholder: "/assets/brand-story/brand_story_yellow.png",
    href: "/#story",
    spanClass: "lg:col-span-2",
  },
];

export function BusinessVerticalsSection() {
  return (
    <section
      id="verticals"
      aria-labelledby="verticals-heading"
      className="relative w-full bg-[#FFF8F1] py-16 md:py-24 overflow-hidden border-t border-on-surface/5"
    >
      <div className="container-site relative z-10 flex flex-col gap-10">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-on-surface/10">
          <div className="flex flex-col gap-2 max-w-xl">
            <Reveal>
              <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-brand-green">
                Hospitality Offerings
              </span>
            </Reveal>
            <Reveal>
              <h2
                id="verticals-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none"
              >
                Business <span className="text-brand-green">Verticals.</span>
              </h2>
            </Reveal>
          </div>

          <Reveal>
            <p className="text-xs sm:text-sm font-sans text-on-surface-variant max-w-md text-left md:text-right">
              From everyday dining to large-scale event catering, explore how GreenChillyz serves communities across Eastern India.
            </p>
          </Reveal>
        </div>

        {/* Premium Landscape Image Cards Grid Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {VERTICALS.map((vertical) => (
            <Reveal key={vertical.id} className={vertical.spanClass}>
              <Link href={vertical.href} className="group block w-full h-full">
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  className="relative w-full h-[320px] sm:h-[360px] md:h-[380px] rounded-[24px] overflow-hidden border border-stone-200/80 hover:border-brand-green/60 shadow-soft hover:shadow-heavy transition-all duration-300 bg-stone-900 cursor-pointer"
                >
                  {/* Image Placeholder */}
                  <Image
                    src={vertical.imagePlaceholder}
                    alt={vertical.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transform transition-transform duration-500 ease-out group-hover:scale-105 opacity-90"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                  {/* Text Content Overlay */}
                  <div className="absolute inset-0 z-20 p-6 md:p-8 flex flex-col justify-end text-white">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#69f0ae] bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 w-fit mb-3">
                      {vertical.categoryLabel}
                    </span>

                    <h3 className="text-xl sm:text-2xl font-heading font-extrabold uppercase tracking-tight text-white group-hover:text-[#69f0ae] transition-colors duration-200">
                      {vertical.title}
                    </h3>

                    <p className="text-xs sm:text-sm font-sans font-medium text-white/85 line-clamp-2 mt-1 max-w-lg leading-relaxed">
                      {vertical.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs font-sans font-extrabold uppercase tracking-wider text-white group-hover:text-[#69f0ae] transition-colors duration-200">
                      <span>Learn More</span>
                      <ArrowRight className="size-4 transform transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
