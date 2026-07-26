"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Leaf,
  Flame,
  Crown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

interface DishCreation {
  id: number;
  name: string;
  brand: string;
  brandTheme: "green" | "red" | "gold";
  color: string;
  bgClass: string;
  description: string;
  rotation: number;
  polygon: string;
  image: string;
}

const DISHES: DishCreation[] = [
  {
    id: 1,
    name: "Paneer Chilly Dry",
    brand: "GreenChillyz",
    brandTheme: "green",
    color: "#006B2A",
    bgClass: "bg-[#006B2A]",
    description:
      "Crispy paneer cubes tossed in a glossy, dark soy-based sauce with fresh green chillies and capsicum.",
    rotation: -4,
    polygon: "polygon(20% 0%, 100% 12%, 80% 100%, 0% 88%)",
    image: "/assets/food/paneer_chilly_dry.png",
  },
  {
    id: 2,
    name: "Schezwan Noodles",
    brand: "RedChillyz",
    brandTheme: "red",
    color: "#C62828",
    bgClass: "bg-[#C62828]",
    description:
      "Glossy wok-tossed thin noodles coated in a spicy, fiery red Schezwan chili paste with shredded vegetables.",
    rotation: -1.5,
    polygon: "polygon(8% 0%, 100% 15%, 92% 100%, 0% 85%)",
    image: "/assets/food/schezwan_noodles.png",
  },
  {
    id: 3,
    name: "Golden Prawn Tempura",
    brand: "GoldenChillyz",
    brandTheme: "gold",
    color: "#C9A227",
    bgClass: "bg-[#C9A227]",
    description:
      "Large, crispy fried prawns coated in an airy tempura batter with a delicate golden crunch.",
    rotation: 2.5,
    polygon: "polygon(15% 15%, 100% 0%, 85% 85%, 0% 100%)",
    image: "/assets/food/golden_prawn_tempura.png",
  },
  {
    id: 4,
    name: "Veg Manchurian Gravy",
    brand: "GreenChillyz",
    brandTheme: "green",
    color: "#006B2A",
    bgClass: "bg-[#006B2A]",
    description:
      "Savory vegetable dumplings simmered in a glossy garlic-soy sauce and garnished with scallions.",
    rotation: -3,
    polygon: "polygon(25% 0%, 100% 20%, 75% 100%, 0% 80%)",
    image: "/assets/food/veg_manchurian.png",
  },
  {
    id: 5,
    name: "Chilly Potato",
    brand: "RedChillyz",
    brandTheme: "red",
    color: "#C62828",
    bgClass: "bg-[#C62828]",
    description:
      "Crispy fried potatoes tossed in a sweet and spicy red chili glaze and toasted sesame seeds.",
    rotation: 1.5,
    polygon: "polygon(0% 10%, 90% 0%, 100% 90%, 10% 100%)",
    image: "/assets/food/chilly_potato.png",
  },
  {
    id: 6,
    name: "Classic Fried Rice",
    brand: "GoldenChillyz",
    brandTheme: "gold",
    color: "#C9A227",
    bgClass: "bg-[#C9A227]",
    description:
      "Fluffy, aromatic jasmine rice stir-fried with farm-fresh vegetables and spring onion rings.",
    rotation: 4,
    polygon: "polygon(0% 20%, 100% 5%, 100% 80%, 0% 95%)",
    image: "/assets/food/classic_fried_rice.png",
  },
];

const TOTAL = DISHES.length;
const AUTOPLAY_MS = 3000;
const RESUME_DELAY_MS = 4000;

export function SignatureCreationsSection() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % TOTAL);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + TOTAL) % TOTAL);
  }, []);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TOTAL);
    }, AUTOPLAY_MS);
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseAndResume = useCallback(() => {
    stopAutoplay();
    resumeTimerRef.current = setTimeout(startAutoplay, RESUME_DELAY_MS);
  }, [stopAutoplay, startAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide();
        pauseAndResume();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
        pauseAndResume();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, pauseAndResume]);

  const cardW = isMobile ? 260 : 320;
  const gap = isMobile ? -16 : -48;
  const effectiveW = cardW + gap;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      isDraggingRef.current = false;
      stopAutoplay();
    },
    [stopAutoplay]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (dx > dy && dx > 10) {
      isDraggingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      if (isDraggingRef.current && Math.abs(dx) > 40) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
      isDraggingRef.current = false;
      resumeTimerRef.current = setTimeout(startAutoplay, RESUME_DELAY_MS);
    },
    [nextSlide, prevSlide, startAutoplay]
  );

  return (
    <section
      id="menu"
      className="relative w-full overflow-hidden bg-[#FFF8F1] py-[80px] md:py-[120px]"
      aria-labelledby="signature-title"
    >
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-[14vw] font-heading text-on-surface/[0.04] pointer-events-none select-none z-0 tracking-widest uppercase leading-none">
        Signature
      </div>

      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_70%)]" />

      <svg
        className="absolute left-[5%] top-[15%] size-28 text-primary/[0.03] rotate-12 pointer-events-none select-none z-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M12 2c-.5.5-1 1.5-1 3 0 2.5 2 3.5 1 5.5s-4 .5-4 3 2 4.5 4 4.5 4-2 4-4.5-1-1-1-3 2-3 1-5.5-1-2.5-1-3z" />
      </svg>
      <svg
        className="absolute right-[5%] bottom-[15%] size-32 text-primary/[0.03] -rotate-[30deg] pointer-events-none select-none z-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M12 2c-.5.5-1 1.5-1 3 0 2.5 2 3.5 1 5.5s-4 .5-4 3 2 4.5 4 4.5 4-2 4-4.5-1-1-1-3 2-3 1-5.5-1-2.5-1-3z" />
      </svg>

      <div className="relative z-10 w-full flex flex-col gap-10 md:gap-14">
        <Reveal className="text-center flex flex-col items-center gap-2 px-6">
          <p className="text-sm font-heading text-brand-red uppercase tracking-wider">
            Our
          </p>
          <h2
            id="signature-title"
            className="text-4xl md:text-6xl font-heading text-on-surface tracking-tight uppercase leading-[0.95]"
          >
            Signature <span className="text-brand-red">Creations</span>
          </h2>
          <p className="max-w-[650px] text-body-md text-on-surface-variant leading-relaxed mt-3 font-sans">
            The dishes that made GreenChillyz unforgettable. Crafted with
            passion, bold spices, and loved by thousands.
          </p>
        </Reveal>

        <div
          ref={containerRef}
          className="relative w-full overflow-x-hidden overflow-y-visible pt-4 flex items-center justify-center"
          style={{ touchAction: "pan-y", paddingBottom: "64px" }}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => {
              prevSlide();
              pauseAndResume();
            }}
            className="absolute left-4 md:left-12 z-40 size-12 md:size-14 rounded-full bg-white flex items-center justify-center text-on-surface shadow-md border border-on-surface/5 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            aria-label="Previous signature dish"
          >
            <ChevronLeft className="size-5 md:size-6" />
          </button>

          <div
            className="relative w-full flex items-center justify-center"
            style={{ minHeight: isMobile ? "440px" : "500px" }}
          >
            {DISHES.map((dish, index) => {
              let offset = index - activeIndex;
              if (offset < -Math.floor(TOTAL / 2)) offset += TOTAL;
              if (offset > Math.floor(TOTAL / 2)) offset -= TOTAL;

              const isActive = offset === 0;
              const isAdjacent = Math.abs(offset) === 1;

              const translateX = offset * effectiveW;
              const scale = isActive ? 1.05 : 0.94;
              const opacity = isActive ? 1 : isAdjacent ? 0.92 : 0.7;
              const zIndex = isActive ? 30 : isAdjacent ? 20 : 10;

              return (
                <div
                  key={dish.id}
                  className="absolute will-change-transform"
                  style={{
                    zIndex,
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    opacity,
                    transition:
                      "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease",
                  }}
                  onClick={() => {
                    if (!isActive) {
                      setActiveIndex(index);
                      pauseAndResume();
                    }
                  }}
                >
                  <div
                    className={`group relative w-[260px] md:w-[320px] aspect-[3/4.2] rounded-[24px] p-6 flex flex-col justify-between overflow-visible shadow-soft cursor-pointer ${dish.bgClass}`}
                    style={{
                      transform: `rotate(${dish.rotation}deg)`,
                      boxShadow: isActive
                        ? "0 25px 40px -10px rgba(0,0,0,0.25), 0 12px 16px -6px rgba(0,0,0,0.2)"
                        : "0 6px 12px -2px rgba(0,0,0,0.1), 0 3px 6px -3px rgba(0,0,0,0.08)",
                      transition: "box-shadow 0.4s ease",
                    }}
                  >
                    <div
                      className="absolute right-[-16px] top-[18%] w-[170px] md:w-[210px] aspect-square overflow-hidden pointer-events-none drop-shadow-lg z-20"
                      style={{ clipPath: dish.polygon }}
                    >
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        draggable={false}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-white/80 z-10">
                      {dish.brandTheme === "green" && (
                        <Leaf className="size-4" />
                      )}
                      {dish.brandTheme === "red" && (
                        <Flame className="size-4" />
                      )}
                      {dish.brandTheme === "gold" && (
                        <Crown className="size-4" />
                      )}
                      <span className="text-[10px] font-sans font-medium uppercase tracking-[0.15em]">
                        {dish.brand}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto mr-12 relative z-10">
                      <h3 className="text-2xl md:text-3xl font-sans font-bold text-white tracking-tight uppercase leading-[0.95] max-w-[90%]">
                        {dish.name}
                      </h3>
                      <p className="text-xs md:text-sm text-white/75 font-sans leading-relaxed mt-1.5 line-clamp-3">
                        {dish.description}
                      </p>
                    </div>

                    <div className="absolute bottom-6 right-6 z-30">
                      <div className="size-9 md:size-11 rounded-full border border-white/30 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-white group-hover:text-on-surface cursor-pointer">
                        <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              nextSlide();
              pauseAndResume();
            }}
            className="absolute right-4 md:right-12 z-40 size-12 md:size-14 rounded-full bg-white flex items-center justify-center text-on-surface shadow-md border border-on-surface/5 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            aria-label="Next signature dish"
          >
            <ChevronRight className="size-5 md:size-6" />
          </button>
        </div>

        <div className="flex justify-center items-center gap-2 mt-4 relative z-20">
          {DISHES.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  pauseAndResume();
                }}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-6 bg-brand-red"
                    : "w-2.5 bg-[#FAF6F2] border border-on-surface/10"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
