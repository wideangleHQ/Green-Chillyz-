# 11. Public Website

## Overview

The public website lives in `client/` and is deployed to Vercel at `greenchillyz.com`. It is built with Next.js 16 App Router and serves as the primary customer-facing digital experience: brand discovery, loyalty engagement, and outlet discovery.

## Implemented Pages

| Route | File | Purpose | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | Homepage — full brand experience | ✅ |
| `/about` | `app/about/page.tsx` | Brand about page | ✅ |
| `/menu` | `app/menu/page.tsx` | Menu browse | ✅ (placeholder) |
| `/rewards` | `app/rewards/page.tsx` | Loyalty/coins programme info | ✅ |
| `/games` | `app/games/page.tsx` | Games page | ✅ |
| `/wallet` | `app/wallet/page.tsx` | Customer coin wallet (auth required) | ✅ |
| `/auth` | `app/auth/` | Login & registration | ✅ |
| `/franchise` | `app/franchise/page.tsx` | Franchise enquiry | ✅ |
| `/join` | `app/join/page.tsx` | Customer join / onboarding | ✅ |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy | ✅ |

## Routing Architecture

Next.js 16 App Router:
- `app/layout.tsx` — root layout with fonts, metadata, and `<AppProviders>`
- `app/page.tsx` — the homepage
- Each subdirectory is a route segment
- No `pages/` directory — 100% App Router

## AppProviders

`components/providers/AppProviders.tsx` wraps the entire app. It provides:
- TanStack Query (`QueryClientProvider`)
- Auth context (customer session state)
- Any other global React context

## SEO Implementation

From `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://greenchillyz.com'),
  title: 'GreenChillyz — Taste, Reimagined',
  description: 'One family, three flavors: GreenChillyz, YellowChillyz and GoldenChillyz...',
  alternates: { canonical: '/' },
  openGraph: { title, description, url, siteName, type: 'website' },
  twitter: { card: 'summary_large_image', title, description }
}
```

- Dynamic `sitemap.ts` generates `sitemap.xml`
- Dynamic `robots.ts` generates `robots.txt`
- Structured data (JSON-LD) injected server-side in `page.tsx` via `buildStructuredData()`

## Static Assets

All static assets live in `client/public/`:

| Directory | Contents |
|---|---|
| `public/sequences/chilli/` | 110+ JPG frames for scroll-driven chilli animation |
| `public/sequences/burger/` | Burger animation frame sequence |
| `public/sequences/drinks/` | Drinks animation frame sequence |
| `public/images/` | Static photographs and graphics |
| `public/fonts/` | Anton and Manrope font files (local) |
| `public/lottie/` | Lottie animation JSON files |
| `public/audio/` | Audio files |
| `public/videos/` | Video files |
| `public/icons/` | Icon assets |

The chilli animation in `assets/chilli animation/` (root-level) contains 110 master frames; optimised copies for web are in `client/public/sequences/chilli/`.

## Data Sources

The public website fetches from the NestJS API:
- Store listings → `GET /api/v1/stores` (public endpoint)
- Rewards → `GET /api/v1/rewards` (public endpoint)
- Games → `GET /api/v1/games` (authenticated)
- Wallet → `GET /api/v1/wallet/me` (authenticated)
- Homepage personalization → `GET /api/v1/geo/resolve` (📋 planned, not yet built)

Content that is not yet API-driven is managed via `client/lib/content.ts` (static content file) and placeholder components.
