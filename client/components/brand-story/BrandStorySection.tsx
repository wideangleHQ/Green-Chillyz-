"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";

interface BrandData {
  id: "green" | "yellow" | "golden";
  name: string;
  accentColor: string;
  highlightText: string;
  description: string;
  images: string[];
}

const BRANDS: BrandData[] = [
  {
    id: "green",
    name: "GreenChillyz",
    accentColor: "#006B2A",
    highlightText: "GREENCHILLYZ GROUP",
    description: "is the flagship everyday QSR brand of our restaurant family, serving fresh ingredients and bold flame-grilled flavours. Alongside YellowChillyz and GoldenChillyz, we offer three unique culinary identities united by a passion for quality. From quick, casual bites to refined dining, we ensure there is a perfect space for everyone at our table.",
    images: [
      "/assets/brand-story/brand_story_green.png",
      "/assets/food/paneer_chilly_dry.png"
    ]
  },
  {
    id: "yellow",
    name: "YellowChillyz",
    accentColor: "#D4A31C",
    highlightText: "YELLOWCHILLYZ",
    description: "is our dedicated No Onion No Garlic experience, designed to serve comforting, satvik-friendly street food and classics that never compromise on taste. Together with GreenChillyz and GoldenChillyz, we present a united restaurant family with three unique identities, providing pure and mindful dining options tailored for every occasion.",
    images: [
      "/assets/brand-story/brand_story_yellow.png",
      "/assets/food/chilly_potato.png"
    ]
  },
  {
    id: "golden",
    name: "GoldenChillyz",
    accentColor: "#C9A227",
    highlightText: "GOLDENCHILLYZ",
    description: "delivers a premium dining experience for special evenings, featuring slow-cooked masterpieces, elevated hospitality, and an elegant fine-dining ambiance. Partnered with GreenChillyz and YellowChillyz under one culinary family, it brings a touch of luxury and refinement to our diverse range of restaurant concepts.",
    images: [
      "/assets/brand-story/brand_story_gold.png",
      "/assets/food/golden_prawn_tempura.png"
    ]
  }
];

export function BrandStorySection() {
  const [activeTab, setActiveTab] = useState<"green" | "yellow" | "golden">("green");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeBrand = BRANDS.find((b) => b.id === activeTab) || BRANDS[0];

  // Set up Embla snap-select listener
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Reset Embla to first slide when switching tabs
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(0);
      setSelectedIndex(0);
    }
  }, [activeTab, emblaApi]);

  return (
    <section
      id="story"
      aria-labelledby="about-group-heading"
      className="relative w-full bg-[#FFF8F1] pt-[120px] pb-[80px] md:pb-[120px] overflow-hidden"
      style={{ "--brand-accent": activeBrand.accentColor } as React.CSSProperties}
    >
      {/* Premium Smooth Blend Transition Overlay from Hero */}
      <div 
        className="brand-story-gradient-overlay"
        style={{
          "--story-bg-color": "#FFF8F1",
          "--story-bg-rgb": "255, 248, 241",
        } as React.CSSProperties}
      />

      <div className="container-site flex flex-col md:flex-row gap-10 md:gap-14 relative z-20">
        
        {/* LEFT COLUMN (Approx 18%) */}
        <div className="w-full md:w-[18%] flex flex-col items-start gap-4">
          <h2 
            id="about-group-heading"
            className="text-[40px] md:text-[48px] lg:text-[64px] font-heading leading-[0.95] text-left flex flex-col tracking-normal font-extrabold uppercase"
          >
            <span className="text-brand-green">ABOUT</span>
            <span className="text-on-surface">OUR</span>
            <span className="text-on-surface">GROUP</span>
          </h2>
          
          {/* Star Divider */}
          <div className="flex items-center gap-3 w-full mt-2 md:mt-4">
            <div className="h-[1.5px] bg-on-surface/15 w-16" />
            <Star className="size-4 text-brand-red fill-none stroke-[1.5]" />
          </div>
        </div>

        {/* RIGHT COLUMN (Approx 82%) */}
        <div className="w-full md:w-[82%] flex flex-col gap-8">
          
          {/* Brand Switcher (Top of Right column area) */}
          <div 
            className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 w-full max-w-full" 
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {BRANDS.map((brand) => {
              const isSelected = brand.id === activeTab;
              return (
                <button
                  key={brand.id}
                  id={`brand-tab-${brand.id}`}
                  onClick={() => setActiveTab(brand.id)}
                  className="px-5 py-2.5 rounded-full text-xs font-sans uppercase tracking-wider transition-[background-color,border-color,color] duration-200 cursor-pointer whitespace-nowrap border font-semibold"
                  style={{
                    backgroundColor: isSelected ? "var(--brand-accent)" : "transparent",
                    borderColor: isSelected ? "var(--brand-accent)" : "rgba(30, 27, 23, 0.12)",
                    color: isSelected ? "#ffffff" : "#1e1b17",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(30, 27, 23, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(30, 27, 23, 0.12)";
                    }
                  }}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>

          {/* Paragraph Content Section */}
          <div className="flex flex-col gap-6 items-start w-full">
            <div className="min-h-[140px] md:min-h-[100px] w-full">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-base md:text-lg lg:text-[20px] font-sans text-on-surface-variant leading-[1.8] max-w-[850px] text-left"
                >
                  <span 
                    className="font-bold transition-colors duration-500" 
                    style={{ color: "var(--brand-accent)" }}
                  >
                    {activeBrand.highlightText}
                  </span>{" "}
                  {activeBrand.description}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Learn More Button */}
            <Link
              href="/about"
              id="learn-more-about-btn"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-sans font-bold uppercase tracking-wider transition-[background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-soft cursor-pointer border"
              style={{
                borderColor: "var(--brand-accent)",
                color: "var(--brand-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--brand-accent)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "var(--brand-accent)";
              }}
            >
              Learn More
              <ArrowUpRight className="size-4.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Image Showcase Section */}
          <div className="w-full relative overflow-visible mt-4">
            
            {/* Desktop layout: 60/40 Image Grid */}
            <div className="hidden md:block w-full relative h-[320px] sm:h-[400px] lg:h-[480px]">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full flex gap-6 absolute inset-0"
                >
                  {/* Left Main Image (60%) */}
                  <div className="w-[60%] h-full rounded-[16px] overflow-hidden shadow-soft border border-white/20 relative">
                    <Image
                      src={activeBrand.images[0]}
                      alt={`${activeBrand.name} flagship showcase`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover transition-[transform,filter] duration-200 hover:scale-[1.03] hover:brightness-[1.05]"
                      priority={activeTab === "green"}
                    />
                  </div>

                  {/* Right Secondary Image (40%) */}
                  <div className="w-[40%] h-full rounded-[16px] overflow-hidden shadow-soft border border-white/20 relative">
                    <Image
                      src={activeBrand.images[1]}
                      alt={`${activeBrand.name} dish presentation`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover transition-[transform,filter] duration-200 hover:scale-[1.03] hover:brightness-[1.05]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile layout: Embla Swipeable Slider */}
            <div className="block md:hidden w-full">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  <div className="embla overflow-hidden w-full cursor-grab active:cursor-grabbing" ref={emblaRef}>
                    <div className="embla__container flex gap-4">
                      {activeBrand.images.map((image, idx) => (
                        <div 
                          key={idx} 
                          className="embla__slide flex-[0_0_82%] min-w-0 aspect-[4/3] rounded-[16px] overflow-hidden shadow-soft border border-white/20 relative"
                        >
                          <Image
                            src={image}
                            alt={`${activeBrand.name} mobile showcase ${idx + 1}`}
                            fill
                            sizes="82vw"
                            className="object-cover transition-[transform,filter] duration-200 hover:scale-[1.03] hover:brightness-[1.05]"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Pagination Dots */}
                  <div className="flex justify-center items-center gap-2 mt-5">
                    {activeBrand.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => emblaApi?.scrollTo(idx)}
                        className="h-2 rounded-full transition-[width,background-color] duration-200 cursor-pointer"
                        style={{
                          width: idx === selectedIndex ? "20px" : "8px",
                          backgroundColor: idx === selectedIndex ? "var(--brand-accent)" : "rgba(30, 27, 23, 0.15)",
                        }}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
