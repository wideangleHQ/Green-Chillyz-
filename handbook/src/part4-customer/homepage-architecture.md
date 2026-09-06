# 12. Home Page Architecture

## Composition

The homepage (`client/app/page.tsx`) composes 10+ section components within a `SmoothScroll` (Lenis) wrapper:

```
<SmoothScroll>
  JSON-LD structured data (inline script)
  <Preloader />              ← Full-screen entry animation
  <Navbar />                 ← Sticky navigation
  <OnboardingWrapper />      ← Customer registration modal
  <main>
    <HeroSection />
    <BrandSnapshotSection />
    <BrandStorySection />
    <SignatureCreationsSection />
    <OffersSection />
    <GamesSection />
    <BusinessVerticalsSection />
    <LocationsSection />
    <WhyGreenChillyzSection />
    <ReviewsSection />
  </main>
  <Footer />
</SmoothScroll>
```

## Section-by-Section Reference

### Preloader — `components/preloader/Preloader.tsx`
- Full-screen overlay that plays on first load
- Exits after animation completes, revealing the page underneath
- Respects `prefers-reduced-motion` (skips animation)

### Navbar — `components/navbar/Navbar.tsx`
- Sticky top navigation
- Links to homepage sections (smooth scroll) and page routes
- Shows auth state (Login/Profile based on session)
- Mobile: hamburger menu

### OnboardingWrapper — `components/onboarding/OnboardingWrapper.tsx`
- Dynamic import, SSR-enabled
- Shows a registration/login flow for new visitors
- Triggered by CTA clicks from other sections

### HeroSection — `components/hero/HeroSection.tsx`
- **Eagerly loaded** (not dynamic) — above fold, must be instant
- Contains `HeroMedia.tsx` for the chilli animation / video background
- Animation: GSAP scroll-triggered, frame-sequence chilli animation (`public/sequences/chilli/`)
- Hero text never re-renders when personalization data arrives (separation of concerns)
- Includes primary CTA buttons (Explore Menu, Earn Coins)

**Key performance rule:** Hero animation must start at 0ms. It never waits for API data.

### BrandSnapshotSection — `components/brand-snapshot/BrandSnapshotSection.tsx`
- Quick-facts overview of the GreenChillyz group
- Three brand cards (GreenChillyz, YellowChillyz, GoldenChillyz)
- Animated entry via Framer Motion or GSAP ScrollTrigger

### BrandStorySection — `components/brand-story/BrandStorySection.tsx`
- Brand narrative / storytelling section
- Rich visual content with scroll-triggered animations

### SignatureCreationsSection — `components/signature-creations/SignatureCreationsSection.tsx`
- Showcase of featured menu items
- Currently uses static content from `lib/content.ts` (no live menu API yet)
- Frame-sequence animation for food items (burger/drinks sequences)

### OffersSection — `components/offers/OffersSection.tsx`
- Displays active store vouchers and reward offers
- Intended to be personalized to nearest outlet
- Currently: placeholder or static data while geo-personalization is pending

### GamesSection — `components/games/GamesSection.tsx`
- Teaser for the games platform (earns coins)
- Links to `/games` page
- Animated game preview

### BusinessVerticalsSection — `components/business-verticals/BusinessVerticalsSection.tsx`
- Showcases all three brand verticals
- Visual brand differentiation (green, yellow, gold)

### LocationsSection — `components/locations/LocationsSection.tsx`
- Outlet discovery / store locator
- Intended to use Mapbox for map display (📋 Mapbox integration is placeholder)
- Lists outlets from API with geo-sorting (when personalization is implemented)

### WhyGreenChillyzSection — `components/why-greenchillyz/WhyGreenChillyzSection.tsx`
- Value proposition section
- Key differentiators (food quality, loyalty programme, experience)

### ReviewsSection — `components/reviews/ReviewsSection.tsx`
- Customer testimonials
- Currently static/placeholder data — no live review system in backend

### Footer — `components/footer/Footer.tsx`
- Links, social media, brand info
- Newsletter signup (pending backend integration)
- Privacy policy link

## Animation Architecture

The homepage uses a layered animation system:

| Layer | Tool | Scope |
|---|---|---|
| Smooth scroll physics | Lenis | Whole page |
| Hero frame sequence | Custom canvas / img sequence | Chilli animation |
| Scroll-driven reveals | GSAP ScrollTrigger | Per-section entry |
| Micro-interactions | Framer Motion | Hover states, card reveals |

**All animated components must:**
1. Check `prefers-reduced-motion` and provide a static fallback
2. Never block page render or LCP

## Content Management

Static content for homepage sections is stored in `client/lib/content.ts` (or similar content files). This is illustrative copy that must be reviewed and replaced with final brand content before launch (flagged in `docs/06_Content_and_Copy.md`).

When the geo-personalization API is implemented (`GET /api/v1/home/personalized`), the following sections will become dynamic:
- OffersSection (outlet-specific offers)
- LocationsSection (nearest outlets)
- ReviewsSection (outlet-specific reviews)
- HeroSection (outlet-specific tagline, though the animation stays static)
