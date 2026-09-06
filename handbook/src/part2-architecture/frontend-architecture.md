# 5. Frontend Architecture

Both frontends (`client/` and `dashboard/`) use the same stack. This section primarily covers `client/` (the public website), with dashboard differences noted.

## Framework & Router

| Property | Value |
|---|---|
| Framework | **Next.js 16.2.10** (App Router) |
| React | 19.2.4 |
| TypeScript | Strict mode |
| Port (dev) | 5000 (client), 5100 (dashboard) |
| Runtime | Node.js (Vercel) |

> **Important:** The codebase uses a **newer, breaking Next.js release** (16.x). APIs and conventions differ from the commonly-known 13/14 releases. The `client/AGENTS.md` explicitly warns: "Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

## Typography & Fonts

Three fonts are loaded in `app/layout.tsx`:

| Font | Variable | Usage |
|---|---|---|
| **Anton** (local) | `--font-anton` | Hero display headings |
| **Manrope** (local) | `--font-manrope` | Body text, UI elements |
| **Space Grotesk** (Google) | `--font-space-grotesk` | Accent/label text |

> **Note:** `docs/02_UI_Design_System.md` specifies *Poppins exclusively*. The actual implementation uses Anton + Manrope + Space Grotesk. This is a confirmed deviation from the design spec.

## Design System

Design tokens are defined in `app/globals.css` as Tailwind v4 `@theme` variables. Key tokens (from `docs/19_Design_Tokens.md` and actual CSS):

```css
/* Primary palette */
--color-primary: #006B2A;     /* GreenChillyz brand green */
--color-secondary: #1F6C3A;   /* Darker green */
--color-gold: #D4AF37;        /* Signature/premium (use sparingly) */
--color-surface: #FFF8F0;     /* Off-white base (never pure white) */
--color-error: #BA1A1A;

/* Typography scale */
--font-display-hero: 84px / 800 weight (-0.04em tracking)
--font-headline-lg: 48px / 700
--font-body-lg: 20px / 400

/* Spacing: base-8 scale */
/* Radius: ≥24px on cards, pill on buttons */
```

## Page Architecture

The homepage (`app/page.tsx`) renders:

```jsx
<SmoothScroll>          // Lenis smooth scroll wrapper
  <Preloader />         // Full-screen entry animation
  <Navbar />            // Navigation (eager load)
  <OnboardingWrapper /> // Customer onboarding modal (dynamic, SSR)
  <main>
    <HeroSection />                  // Eager — above fold
    <BrandSnapshotSection />         // Dynamic, SSR
    <BrandStorySection />            // Dynamic, SSR
    <SignatureCreationsSection />    // Dynamic, SSR
    <OffersSection />                // Dynamic, SSR
    <GamesSection />                 // Dynamic, SSR
    <BusinessVerticalsSection />     // Dynamic, SSR
    <LocationsSection />             // Dynamic, SSR
    <WhyGreenChillyzSection />       // Dynamic, SSR
    <ReviewsSection />               // Dynamic, SSR
  </main>
  <Footer />
</SmoothScroll>
```

Only `HeroSection` is eagerly imported. All other sections use `next/dynamic` for code splitting while still SSR-rendering (`ssr: true`).

## Component Architecture

Components are **feature-first**, not type-first:

```
components/
├── hero/              ← Hero section components
├── brand-story/       ← Brand narrative components  
├── offers/            ← Offer display components
├── games/             ← Game UI components
├── locations/         ← Store locator components
├── navbar/            ← Navigation components
├── ui/                ← Shared primitives (Button, Card, Input, Badge…)
└── providers/         ← AppProviders wrapper
```

Shared primitives live in `components/ui/` and are built to the design system spec. Feature components live in their own subdirectory and never share internal state with other feature directories.

## State Management

| Purpose | Solution |
|---|---|
| Server state / API data | TanStack Query (React Query v5) |
| Geo / location state | Context API or Zustand (per `docs/21_Server_Architecture.md`) |
| Form state | React Hook Form + Zod validation |
| Auth state | Context + HttpOnly cookie (token never touches JS) |
| Animation state | GSAP ScrollTrigger, Framer Motion local state |

## Animation System

Three animation libraries with defined responsibilities:

| Library | Responsibility |
|---|---|
| **GSAP + ScrollTrigger** | Scroll-driven timelines, per-section orchestration |
| **Framer Motion** | Component-level enter/exit animations, micro-interactions |
| **Lenis** | Smooth scroll physics (wraps the whole page) |

Animation rules (from `docs/03_Animation_Guidelines.md`):
- Respect `prefers-reduced-motion` — all animated components must have a static fallback
- Hero animation never blocks on data fetching
- No raw CSS `@keyframes` for anything beyond trivial hover states
- Never introduce `anime.js` or any animation library not in this list

## Data Fetching

```
HTTP Client: Axios
Server State: TanStack Query (useQuery / useMutation)
Base URL: process.env.NEXT_PUBLIC_API_URL
Auth: credentials: 'include' (cookies sent automatically)
```

The frontend never hardcodes API logic in components. All API calls go through typed service functions in `lib/`.

## Performance Strategy

From `docs/08_Performance_Guidelines.md`:

| Metric | Target |
|---|---|
| LCP | < 2.0s |
| CLS | < 0.05 |
| INP | < 200ms |

Strategies implemented:
- Hero section is eager; everything below fold is `dynamic()` import
- All images served through Cloudflare CDN (or Cloudinary per original plan)
- Frame-sequence animations (chilli, burger, drinks) use pre-rendered JPG sequences in `public/sequences/`
- `font-display: swap` on all fonts
- Structured data (JSON-LD) injected server-side in `page.tsx`

## SEO

- `app/layout.tsx` sets global metadata via Next.js `Metadata` API
- `metadataBase: new URL('https://greenchillyz.com')`
- Per-page metadata overrides possible via `generateMetadata()`
- `robots.ts` and `sitemap.ts` generate dynamic robots.txt and sitemap.xml
- Structured data: `Organization` and `LocalBusiness` JSON-LD via `lib/structuredData.ts`

## Accessibility

WCAG 2.1 AA baseline (from `docs/11_Accessibility.md`):
- All images require `alt` text; decorative images use `aria-hidden`
- Keyboard navigation must work across all sections
- `prefers-reduced-motion` respected by all animation components
- Minimum touch target: 44×44px
- Glass panels must maintain sufficient contrast against real backgrounds
