"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Snap-scroll carousel (04_Component_Library.md): native swipe on touch,
 * arrow buttons on desktop, dot indicators, keyboard navigable via
 * arrow keys (11_Accessibility.md). Gesture always has a non-gesture
 * equivalent (18_Responsive_Design_System.md).
 */
export function Carousel({ label, children, className = "" }: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const count = Children.count(children);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, track.children.length - 1));
    const target = track.children[clamped] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let nearestDist = Infinity;
      Array.from(track.children).forEach((child, i) => {
        const el = child as HTMLElement;
        const center = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      });
      setIndex(nearest);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={className}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") scrollTo(index + 1);
        if (e.key === "ArrowLeft") scrollTo(index - 1);
      }}
    >
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <li className="w-[85%] shrink-0 snap-center sm:w-[60%] lg:w-[31%]">
            {child}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollTo(index - 1)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant text-on-surface transition-shadow duration-200 hover:shadow-hover disabled:opacity-38"
          disabled={index === 0}
        >
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
        </button>
        <div className="flex gap-2" aria-hidden="true">
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-colors duration-200 ${
                i === index ? "bg-primary" : "bg-outline-variant"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollTo(index + 1)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant text-on-surface transition-shadow duration-200 hover:shadow-hover disabled:opacity-38"
          disabled={index === count - 1}
        >
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2} />
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        Item {index + 1} of {count}
      </p>
    </div>
  );
}
