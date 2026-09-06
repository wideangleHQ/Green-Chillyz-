# 36. Design System

## Fonts

> ⚠️ **DIFFERS FROM SPEC:** The design doc (`docs/02_UI_Design_System.md`) specifies Poppins. The actual implementation uses:

| Font | Load Method | Usage |
|---|---|---|
| **Anton** | Local file | Display headings, hero text |
| **Manrope** | Local file | Body text, UI labels |
| **Space Grotesk** | Google Fonts (`next/font/google`) | Secondary UI text |

Configured in `client/app/layout.tsx` via CSS variable injection. All fonts are available as CSS variables through Next.js `next/font`.

---

## Color Palette

From `docs/02_UI_Design_System.md` (matched against implementation):

| Token | Value | Use |
|---|---|---|
| `primary-green` | `#006B2A` | Primary brand color, CTAs |
| `gold` | `#D4AF37` | Accent, premium indicators |
| `surface` | `#FFF8F0` | Background surface |
| `text-primary` | `#1A1A1A` | Main body text |
| `text-muted` | `#6B6B6B` | Secondary text |
| `error` | `#D32F2F` | Error states |
| `success` | `#2E7D32` | Success states |

Apply via Tailwind classes or CSS custom properties. Tailwind v4 configuration extends these tokens.

---

## Spacing System

Base-8 grid:
```
4px   — micro spacing (inner padding)
8px   — small (gap between items)
16px  — medium (section padding)
24px  — large
32px  — xl (section gaps)
48px  — 2xl
64px  — 3xl
96px  — 4xl (section heights)
```

Use Tailwind spacing scale which aligns with base-8 (`p-4 = 1rem = 16px`).

---

## Button System

From design spec:
- **Primary:** Filled, `primary-green` background, white text, pill shape (full border radius)
- **Secondary:** Outlined, `primary-green` border, transparent background
- **Gold accent:** `gold` background, dark text — for premium/featured actions

Border radius: pill buttons (`rounded-full`). No square buttons in the primary design language.

---

## Glassmorphism

Used for cards, overlays, and floating elements:
```css
backdrop-filter: blur(16px);   /* base blur */
backdrop-filter: blur(32px);   /* heavy blur for modals */
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
```

Range: 16–32px backdrop blur as specified in design system.

---

## Animation System

| Library | Use Case | Config |
|---|---|---|
| **GSAP + ScrollTrigger** | Scroll-driven reveals, parallax | `ScrollTrigger.create()` in section components |
| **Framer Motion** | Component enter/exit, micro-interactions | `<motion.div>` with `variants` |
| **Lenis** | Smooth scroll wrapper | Single instance in `SmoothScroll` provider |

Animation principles:
- Use `transform` and `opacity` only (compositor thread, no layout thrash)
- Respect `prefers-reduced-motion` — wrap GSAP/Framer Motion in media query check
- Lenis smooth scroll: `lerp: 0.1` (default), adjust per section feel

---

## Component Patterns

### Section structure
```tsx
// Standard homepage section pattern
export default function MySection() {
  const ref = useRef<HTMLElement>(null);
  
  useGSAP(() => {
    // ScrollTrigger animations
    gsap.from(ref.current, {
      opacity: 0,
      y: 60,
      scrollTrigger: { trigger: ref.current, start: 'top 80%' },
    });
  }, { scope: ref });

  return (
    <section ref={ref} className="...">
      {/* content */}
    </section>
  );
}
```

### Dynamic imports (performance)
```tsx
// All sections except HeroSection use dynamic import
const MySection = dynamic(() => import('./MySection'), {
  loading: () => <SectionSkeleton />,
  ssr: false,  // animations break with SSR
});
```

---

## Image Guidelines

All images via `next/image`:
```tsx
<Image
  src="/path/to/image.webp"
  alt="descriptive text"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="..."
  priority={isAboveFold}
/>
```

- Use WebP format
- Always provide `alt` text
- `priority={true}` only for above-the-fold images (hero)
- Store in `/public/` for static images, R2 for dynamic (user-uploaded) content

---

## Responsive Breakpoints

Tailwind v4 defaults (same as v3):
```
sm: 640px    — mobile landscape
md: 768px    — tablet
lg: 1024px   — desktop
xl: 1280px   — wide desktop
2xl: 1536px  — ultra-wide
```

Mobile-first approach: base styles = mobile, then `md:` / `lg:` overrides.
