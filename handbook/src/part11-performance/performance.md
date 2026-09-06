# 27. Performance Architecture

## Backend Performance

### Caching Strategy

| Layer | Mechanism | What Is Cached | TTL |
|---|---|---|---|
| L1 — Redis | `WalletCacheService` | Wallet balance | 5 min |
| L1 — Redis | `StoreCacheService` | Store data + nearby list | 30 min |
| L1 — Redis | Dashboard sessions | Auth session data | 15 min |
| L1 — Redis | Homepage data | Personalized home (planned) | 30 min |
| L2 — DB indexes | Prisma + PostgreSQL | `email`, `username`, `slug`, HMAC lookup | Always |

Cache invalidation is write-through: on wallet credit/debit, the balance cache key is deleted. Store cache is invalidated on store update.

### Database Performance

Key indexes in the schema:
```sql
@@unique([email])               -- User
@@unique([username])            -- User
@@unique([slug])                -- Store, Reward, Game
@@index([userId])               -- WalletTransaction (fast wallet history)
@@index([dashboardCodeLookup])  -- Store (single-field HMAC lookup for dashboard login)
@@index([idempotencyKey])       -- WalletTransaction (dedup check)
@@index([status, expiresAt])    -- WalletTransaction (expiry cron)
@@index([entityType, entityId]) -- AuditLog (audit queries)
```

The wallet balance is denormalized (`Wallet.balance`) — no `SUM()` scan on transaction history for the balance query.

### Request Timeout

`TimeoutInterceptor` enforces a 30-second global request timeout. Long-running operations (coin expiry, report generation) should be moved to BullMQ workers.

### Background Jobs

Heavy operations run asynchronously via BullMQ:
- Coin expiry calculation (`POST /wallet/expire` triggers a queue job)
- Email/SMS/push delivery
- Reward evaluation for complex campaigns

---

## Frontend Performance

### Next.js 16 App Router

- **React Server Components (RSC)** used for static/data-fetching sections
- **Dynamic imports** for all homepage sections except `HeroSection` (code splitting)
- **Image optimization** via `next/image` (WebP conversion, lazy loading, blur placeholder)
- `metadataBase` set for correct Open Graph URL generation

### Performance Targets (from `docs/16_Project_TODO.md`)

| Metric | Target | Status |
|---|---|---|
| Lighthouse Performance | > 90 | ❓ Pending real asset audit |
| LCP | < 2.5s | ❓ Pending |
| CLS | < 0.1 | ❓ Pending |
| INP | < 200ms | ❓ Pending |
| Bundle size (initial JS) | < 150KB gzipped | ❓ Pending |

> Note: Lighthouse audit is pending real content/image assets. Performance characteristics with placeholder assets may not reflect production reality.

### Animation Performance

| Library | Use | Performance Note |
|---|---|---|
| GSAP ScrollTrigger | Scroll-driven section reveals | Uses `will-change: transform`, RAF-based |
| Framer Motion | Component transitions | Layout animations use GPU compositing |
| Lenis | Smooth scroll | Replaces native scroll with rAF loop — adds ~2ms per frame |

All animations should use `transform` and `opacity` only (compositor-friendly, avoids layout thrash).

### Font Loading

Three font families, two load strategies:
- `Anton` (local) — no network request, instant
- `Manrope` (local) — no network request, instant
- `Space Grotesk` (Google Fonts) — external request; preconnect via `next/font/google`

`next/font` handles font subsetting, preloading, and `font-display: swap` automatically.

### Client-Side Caching

- `@tanstack/react-query` manages server state with stale-while-revalidate
- Query cache survives page navigation within the SPA
- Default `staleTime` and `gcTime` should be set in `QueryClient` config (verify in `AppProviders`)

---

## Infrastructure Scaling (Planned)

| Component | Current | Scaling Path |
|---|---|---|
| PostgreSQL | Supabase (shared) | Supabase Pro → dedicated instance |
| Redis | Single instance | Redis Cluster or managed (Upstash) |
| Backend | Single process | Horizontal PM2 cluster or containerized |
| Geo queries | Haversine in JS | PostGIS extension (schema comment suggests this) |
| File storage | Cloudflare R2 | R2 is globally distributed — no change needed |
