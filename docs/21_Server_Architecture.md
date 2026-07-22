# 18 — Server Architecture (Geo-Personalization Engine)

Extends `07_Tech_Stack.md`. This file governs backend architecture and the geo-based homepage personalization system. Frontend behavior implications are cross-referenced into `01_Homepage_Experience.md` and `08_Performance_Guidelines.md` — this file does not redefine homepage storytelling, only the data layer beneath it.

## Purpose
Deliver a personalized homepage (nearest outlet, offers, hero, menu, reviews, gallery) with no perceptible delay to first paint, in an architecture that scales unchanged from 12 outlets to 500+.

## Goals
- Hero animation never blocks on geolocation or network data.
- All personalization logic (nearest outlet, ranking, content selection) lives in the backend — the frontend only supplies coordinates and renders a response.
- Swapping the outlet-distance algorithm (Haversine → PostGIS) at scale requires zero frontend changes and zero API contract changes.

## Core Principle
**The frontend never decides anything.** Its only responsibility is capturing coordinates and rendering whatever the backend returns. Nearest outlet, offers, hero tagline, reviews, gallery, featured menu, and any future AI recommendations are exclusively backend concerns. This keeps business logic centralized and testable in one place.

---

## Stack (Backend/Infra Additions to `07_Tech_Stack.md`)

| Layer | Technology | Role |
|---|---|---|
| Runtime | **Bun** | Backend runtime for NestJS |
| Framework | **NestJS** | API layer (already listed in `07_Tech_Stack.md`) |
| ORM | **Prisma** | Typed data access over PostgreSQL |
| Database | **PostgreSQL (Supabase)** | System of record |
| Cache | **Redis** (Upstash or Redis Cloud) | Aggregated-response cache, sub-10ms reads |
| Client data layer | **TanStack Query** | Server-state fetching/caching on the frontend |
| Client geo state | **Zustand** (or Context API) | Lightweight local state for resolved location |
| Location input | **Browser Geolocation API** | Primary coordinate source |
| Location fallback | **ipwho.is** | IP-based fallback only, never called if GPS succeeds |

> These additions do not replace anything in `07_Tech_Stack.md` — Next.js, Tailwind, shadcn/ui, Framer Motion/GSAP/Lenis remain the frontend standard. `07_Tech_Stack.md` should be read alongside this file for the full picture.

---

## High-Level Flow
```
User visits website
   → Next.js streams page, Hero animation starts immediately (no blocking)
   → In parallel: check cached personalization (localStorage/session) + run geo detection
        → Browser Geolocation API (2–3s timeout)
             → granted → GPS coordinates
             → denied  → ipwho.is fallback → city-level coordinates
   → POST /api/v1/geo/resolve
   → NestJS Geo Personalization Engine
        → Redis cache check → miss → Supabase (Prisma)
   → Single aggregated personalized JSON response
   → React (Context/Zustand + TanStack Query) updates Hero text, Offers, Menu, Reviews, Gallery
   → The Hero animation itself never re-renders because of this update
```

## Backend Modules
```
Geo Module
├── GeoController        — HTTP boundary, request validation
├── GeoService            — orchestration
├── GeoResolver           — validates + normalizes coordinates, determines accuracy tier
├── GeoCache               — Redis read/write for geo lookups
├── OutletLocator          — nearest-outlet computation (Haversine today, PostGIS at scale)
├── PersonalizationService — Promise.all fan-out to Hero/Offers/Menu/Reviews/Gallery/Brand
└── DTOs                   — typed request/response contracts
```
Each service has exactly one responsibility — no module reaches into another's data source directly.

## Request Contract
`POST /api/v1/geo/resolve`
```json
{ "latitude": 20.2961, "longitude": 85.8245, "source": "gps" }
```
`source` is `"gps"` or `"ip"`. Coordinates are always validated (range-checked) before use — see Security below.

## Single Aggregated Endpoint
Rather than separate `/offers`, `/menu`, `/gallery`, `/reviews` calls, the frontend makes **one** call:
`GET /api/v1/home/personalized`
Backend returns everything in one payload:
```json
{
  "location": { "city": "Bhubaneswar", "accuracy": "gps", "nearestOutlet": { "id": 4, "distance": 2.4 } },
  "hero": {}, "menu": [], "offers": [], "reviews": [], "gallery": [], "brand": {}
}
```
This is a hard rule: the homepage never issues 4–5 separate personalization requests where one aggregated request will do.

## Redis Cache Layer
Aggregated per-outlet responses are cached, not re-queried from Supabase per visitor.
```
Key: homepage:outlet:{id}   TTL: 30 minutes
Key: geo:nearest:{lat}:{lng}
Key: offers:{id} / reviews:{id} / gallery:{id} / menu:{id}
```
Redis is the read layer; Supabase is storage only. Cache hits resolve in under ~10ms; cache misses (Supabase via Prisma) resolve in ~40–80ms.

## Supabase Data Model (relationships)
```
Outlets → Outlet Menus, Outlet Offers, Reviews, Gallery
Hero Configuration → referenced globally, can vary by outlet/brand
Brand Configuration → Green/Yellow/Golden variants
```
Everything references `Outlet ID` as the join key.

## Outlet Locator / Scaling Strategy
| Scale | Approach |
|---|---|
| 12 outlets (today) | Haversine formula, computed in-app |
| 50 outlets | Same architecture, no changes |
| 500+ outlets | Replace only `OutletLocator` internals with PostGIS (`ST_DWithin`, `ST_Distance`, GiST index) |

This is the one architectural seam designed for replacement — nothing else in the module list changes when this swap happens, and the API contract to the frontend stays identical.

## Performance Expectations
```
0ms     Hero animation starts
20ms    Site interactive
150ms   Browser returns GPS
+5ms    Geo request sent
5–10ms  Redis hit (typical repeat visitor)
40–80ms Supabase fallback (cache miss)
~250ms  Homepage content fully personalized
```
Repeat visitors typically see personalization resolve in well under 100ms post-geo-request due to Redis caching. This budget must be validated alongside the Core Web Vitals targets in `08_Performance_Guidelines.md` — personalization latency is separate from and must not regress LCP/CLS/INP.

## Frontend Rendering Rule
Only these regions re-render on personalization response: Hero **text**, Offers, Menu, Reviews, Gallery. The Hero **animation/background** itself never re-renders — it is decoupled from personalization state entirely, per the "Hero never blocks" principle in `01_Homepage_Experience.md`.

## Security
- Never trust client-submitted coordinates without range/sanity validation.
- Rate-limit the geo-resolve endpoint.
- HTTPS required (Browser Geolocation API requires a secure context).
- Cache only non-sensitive, non-user-specific personalization data in shared Redis keys — never mix per-user private data into a shared cache key.
- `ipwho.is` is fallback-only; never called when GPS succeeds.

## Recommended Folder Structure
```
apps/
├── web (Next.js)
└── api (NestJS on Bun)

api/src/
├── geo/
│   ├── controllers/
│   ├── services/
│   ├── dto/
│   └── geo.module.ts
├── personalization/
├── outlets/
├── cache/
├── common/
└── prisma/
```
This nests under the broader `10_Development_Rules.md` folder philosophy — feature-first modules, one responsibility per file.

## Do / Don't
- Do: keep all ranking/selection logic backend-side; the frontend renders, it never computes "nearest" or "best offer."
- Do: treat the aggregated `/home/personalized` endpoint as the only personalization contract the frontend depends on.
- Don't: let the frontend fall back to calling `ipwho.is` directly — it only ever calls the backend, which owns the GPS/IP fallback decision.
- Don't: block or delay the Hero animation for any reason related to geo/personalization.

## AI Implementation Notes for Fable
- This file is authoritative for backend/data-layer decisions; `07_Tech_Stack.md` remains authoritative for frontend library choices. If either seems to conflict, treat this file as the source of truth for anything geo/personalization/caching-related.
- Homepage components (`12_Homepage_Sections.md`) should be built to accept personalization data as props/query results (via TanStack Query) rather than fetching directly — keep components presentation-focused, per `10_Development_Rules.md`.
- Do not implement PostGIS now — build `OutletLocator` with Haversine but keep its interface swap-ready (single method, e.g. `findNearest(lat, lng)`), matching the scaling strategy above.
