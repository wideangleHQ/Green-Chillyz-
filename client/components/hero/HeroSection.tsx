"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { imageLoader } from "@/lib/imageLoader";

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  
  const reducedMotion = usePrefersReducedMotion();
  const [supportsMask, setSupportsMask] = useState(false);

  // Scroll state & frame values
  const scrollState = useRef({ frame: 1 });
  const isVisibleRef = useRef(true);
  const animationFrameId = useRef<number | null>(null);
  const lastDrawnFrameRef = useRef<number>(-1);
  const scrollProgressRef = useRef<number>(0);

  // Detect browser support for CSS mask-image
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supports = 
        CSS.supports("mask-image", "linear-gradient(to top, black, transparent)") ||
        CSS.supports("-webkit-mask-image", "linear-gradient(to top, black, transparent)");
      setSupportsMask(supports);
    }
  }, []);

  // Monitor visibility to pause render loop on hidden tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // GSAP ScrollTrigger pinning and timeline mapping
  useEffect(() => {
    if (reducedMotion || !heroRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const nextSection = heroRef.current.nextElementSibling as HTMLElement;
    if (nextSection) {
      // Pull next section up to overlap the bottom 30vh of the hero
      nextSection.style.marginTop = "-30vh";
      nextSection.style.position = "relative";
      nextSection.style.zIndex = "10";
      
      // Initialize Next Section style states to match the timeline start points
      gsap.set(nextSection, {
        opacity: 0.9,
        y: "30vh",
        filter: "blur(8px)",
        scale: 0.985,
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: () => {
          if (window.innerWidth < 768) return "+=290%"; // Mobile: 280-300vh
          if (window.innerWidth < 1024) return "+=320%"; // Tablet: 320vh
          return "+=350%"; // Desktop: 350vh
        },
        pin: true,
        scrub: 0.5,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
        onLeave: () => {
          // Lock at the absolute final frame when exiting
          scrollState.current.frame = 566;
        }
      }
    });

    // 1. Frame sequence interpolation (0% to 100% scroll progress maps to frames 1-566)
    tl.fromTo(scrollState.current,
      { frame: 1 },
      {
        frame: 566,
        ease: "none",
        duration: 1.0,
      },
      0
    );

    // 2. Buttons exit: fade, translate upward, and blur from 50% to 65% scroll
    tl.fromTo(buttonsRef.current,
      { opacity: 1, y: 0, filter: "blur(0px)" },
      {
        opacity: 0,
        y: -40,
        filter: "blur(12px)",
        ease: "power1.out",
        duration: 0.15, // Relative to timeline scale (0.15 duration = 15% scroll delta)
      },
      0.5
    );

    // 3. Headline exit: fade, translate upward, and blur from 60% to 80% scroll
    tl.fromTo([taglineRef.current, headlineRef.current],
      { opacity: 1, y: 0, filter: "blur(0px)" },
      {
        opacity: 0,
        y: -60,
        filter: "blur(16px)",
        ease: "power1.out",
        duration: 0.20, // Relative to timeline scale (20% scroll delta)
      },
      0.6
    );

    // 4. Next Section entry: translate, fade in, remove blur, scale from 80% to 100% scroll
    if (nextSection) {
      tl.fromTo(nextSection,
        {
          opacity: 0.9,
          y: "30vh",
          filter: "blur(8px)",
          scale: 0.985,
        },
        {
          opacity: 1,
          y: "0vh",
          filter: "blur(0px)",
          scale: 1.0,
          ease: "power2.out",
          duration: 0.20,
        },
        0.8
      );
    }

    return () => {
      // Clean up GSAP timelines and triggers
      tl.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === heroRef.current) {
          t.kill();
        }
      });
      // Restore default next section styles
      if (nextSection) {
        nextSection.style.marginTop = "";
        nextSection.style.transform = "";
        nextSection.style.filter = "";
        nextSection.style.opacity = "";
      }
    };
  }, [reducedMotion]);

  // requestAnimationFrame Drawing Loop
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI canvas resizing
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // High performance aspect-ratio cover drawing
    const drawImageProp = (img: CanvasImageSource) => {
      const canvasW = canvas.width;
      const canvasH = canvas.height;

      const imgW = (img as any).width || (img as any).naturalWidth;
      const imgH = (img as any).height || (img as any).naturalHeight;

      if (!imgW || !imgH) return;

      const r = Math.min(canvasW / imgW, canvasH / imgH);
      let nw = imgW * r;
      let nh = imgH * r;

      if (nw < canvasW) {
        const scale = canvasW / nw;
        nw *= scale;
        nh *= scale;
      }
      if (nh < canvasH) {
        const scale = canvasH / nh;
        nw *= scale;
        nh *= scale;
      }

      const sx = (imgW - imgW * (canvasW / nw)) * 0.5;
      const sy = (imgH - imgH * (canvasH / nh)) * 0.5;
      const sw = imgW * (canvasW / nw);
      const sh = imgH * (canvasH / nh);

      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
    };

    // Frame drawing tick callback (exclusively inside requestAnimationFrame)
    const tick = () => {
      if (isVisibleRef.current) {
        // Floating frame value is rounded only immediately before drawing
        const frameToDraw = Math.min(566, Math.max(1, Math.round(scrollState.current.frame)));
        
        if (frameToDraw !== lastDrawnFrameRef.current) {
          const img = imageLoader.getFrame(frameToDraw);
          if (img) {
            drawImageProp(img);
            lastDrawnFrameRef.current = frameToDraw;
          }
        }

        // Apply continuous floating drift during 0% - 20% scroll
        const progress = scrollProgressRef.current;
        const baseScale = 1.05; // 5% baseline zoom to prevent edge/corner gaps during breathing
        if (progress < 0.2) {
          const time = performance.now() * 0.0012;
          const driftScale = Math.max(0, 1 - progress / 0.18); // Fades completely to 0 by 18% progress
          
          const floatY = Math.sin(time * 1.6) * 8 * driftScale; // ±8px
          const floatRot = Math.cos(time * 1.2) * 0.4 * driftScale; // ±0.4 degrees
          
          canvas.style.transform = `translateY(${floatY}px) rotate(${floatRot}deg) scale(${baseScale})`;
        } else {
          canvas.style.transform = `scale(${baseScale})`;
        }
      }
      
      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [reducedMotion]);

  // Clean up global image cache only on actual page navigation, not strict-mode remounts
  useEffect(() => {
    const handleBeforeUnload = () => imageLoader.clear();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ── Reduced Motion Fallback Render ──
  if (reducedMotion) {
    return (
      <section
        ref={heroRef}
        id="top"
        className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#071f10]"
      >
        <div className="absolute inset-0 z-10 pointer-events-none">
          <img
            src="/assets/chilli-animation/00001.jpg"
            alt="Premium Green Chilli"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div
          className="absolute inset-0 z-10 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "128px 128px",
          }}
          aria-hidden="true"
        />
        {/* Smooth Gradient Blending from Transparent to About Section Color (#FFF8F1) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[30vh] z-20 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(255, 248, 241, 0.15) 20%, rgba(255, 248, 241, 0.6) 50%, rgba(255, 248, 241, 0.9) 80%, #FFF8F1 100%)"
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] md:text-label-caps uppercase tracking-[0.25em] font-semibold text-[#69f0ae] mb-4">
            Fresh · Modern · Reimagined
          </p>
          <h1 className="text-display-hero-mobile md:text-display-hero-tablet xl:text-display-hero text-white font-extrabold tracking-tight leading-none whitespace-pre-line max-w-4xl">
            Fresh. Modern.
            {"\n"}Reimagined.
          </h1>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/menu"
              className="group relative inline-flex items-center gap-2.5 rounded-full px-6 md:px-8 py-2.5 md:py-3.5 font-heading uppercase tracking-wider text-sm overflow-hidden text-[#69f0ae] min-h-11"
            >
              <span className="absolute inset-0 rounded-full border border-white/[.12] transition-colors duration-300" />
              <span className="absolute inset-0 rounded-full opacity-[.08] bg-[#00c853]" />
              Explore Menu
              <span className="text-sm">→</span>
            </Link>
            <a
              href="#story"
              className="group relative inline-flex items-center gap-2.5 rounded-full px-6 md:px-8 py-2.5 md:py-3.5 font-heading uppercase tracking-wider text-sm text-white/70 min-h-11"
            >
              Our Story
            </a>
          </div>
        </div>
      </section>
    );
  }

  // ── Standard High Performance Animated Render ──
  return (
    <section
      ref={heroRef}
      id="top"
      aria-labelledby="hero-headline"
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#fff8f1]"
      style={{
        maskImage: supportsMask ? "linear-gradient(to top, transparent 0%, black 30vh, black 100%)" : "none",
        WebkitMaskImage: supportsMask ? "linear-gradient(to top, transparent 0%, black 30vh, black 100%)" : "none",
      }}
    >
      {/* Backing Canvas for Image Sequence */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none will-change-transform"
        style={{ transform: "scale(1.05)" }}
      />

      {/* Smooth Gradient Blending from Transparent to About Section Color (#FFF8F1) */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[30vh] z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(255, 248, 241, 0.15) 20%, rgba(255, 248, 241, 0.6) 50%, rgba(255, 248, 241, 0.9) 80%, #FFF8F1 100%)"
        }}
        aria-hidden="true"
      />

      {/* Film grain texture */}
      <div
        className="absolute inset-0 z-15 opacity-[.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }}
        aria-hidden="true"
      />

      {/* Main Hero Content overlays */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <div className="flex flex-col items-center justify-center pointer-events-auto">
          <p
            ref={taglineRef}
            className="text-[10px] md:text-label-caps uppercase tracking-[0.25em] font-semibold text-[#69f0ae] mb-4"
          >
            Fresh · Modern · Reimagined
          </p>

          <h1
            ref={headlineRef}
            id="hero-headline"
            className="text-display-hero-mobile md:text-display-hero-tablet xl:text-display-hero text-white font-extrabold tracking-tight leading-none whitespace-pre-line max-w-4xl"
          >
            Fresh. Modern.
            {"\n"}Reimagined.
          </h1>

          <div
            ref={buttonsRef}
            className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            <Link
              href="/menu"
              className="group relative inline-flex items-center gap-2.5 rounded-full px-6 md:px-8 py-2.5 md:py-3.5 font-heading uppercase tracking-wider text-sm overflow-hidden text-[#69f0ae] min-h-11"
            >
              <span className="absolute inset-0 rounded-full border border-white/[.12] group-hover:border-white/[.22] transition-colors duration-300" />
              <span
                className="absolute inset-0 rounded-full opacity-[.08] group-hover:opacity-[.16] bg-[#00c853] transition-opacity duration-300"
              />
              Explore Menu
              <span className="text-sm opacity-50 group-hover:translate-x-0.5 transition-transform duration-200">
                →
              </span>
            </Link>

            <a
              href="#story"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("story");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="group relative inline-flex items-center gap-2.5 rounded-full px-6 md:px-8 py-2.5 md:py-3.5 font-heading uppercase tracking-wider text-sm text-white/70 hover:text-white transition-colors duration-200 min-h-11"
            >
              Our Story
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
