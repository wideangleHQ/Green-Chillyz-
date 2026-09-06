# 49. Recommended Future Improvements

Prioritized by business impact and implementation effort.

---

## High Priority

### 1. Franchise Dashboard Frontend
**What:** Build all the dashboard pages — outlet overview, redemption flow, voucher management, analytics.  
**Why:** Backend is fully built and waiting. Franchise operators have no self-service capability without this.  
**Effort:** Medium — follow the established Next.js + React Query patterns in `client/`.

### 2. Menu System Migration
**What:** Run `prisma db push` to create `MenuCategory` and `MenuItem` tables. Build CRUD APIs and frontend menu display.  
**Why:** Customers cannot see the menu online. SignatureCreationsSection shows mock data.  
**Effort:** Low (tables already exist in schema). Medium for frontend menu display.

### 3. Geo-Personalization
**What:** Implement `server/src/modules/geo/` — the endpoint `POST /api/v1/geo/resolve` and `GET /api/v1/home/personalized` as designed in `docs/21_Server_Architecture.md`.  
**Why:** Currently all customers see the same homepage content regardless of their location. Nearby outlet context drives engagement.  
**Effort:** Medium — design exists, implement and add Redis caching layer.

### 4. Interactive Store Locator Map
**What:** Replace the LocationsSection placeholder with a working Mapbox or Google Maps integration.  
**Why:** Customers cannot visually find outlets.  
**Effort:** Medium — Mapbox SDK integration, render store pins from `/api/v1/stores` API.

---

## Medium Priority

### 5. Customer Profile & Wallet Pages
**What:** Inner pages for the customer web app — `/profile`, `/wallet`, `/rewards`, `/games`.  
**Why:** Customers can earn coins but have limited visibility into their balance and history from the website.  
**Effort:** Medium — standard Next.js pages consuming existing APIs.

### 6. Birthday & Anniversary Offers
**What:** Trigger birthday/anniversary reward campaigns when `CustomerProfile.birthday` matches today.  
**Why:** High-engagement touchpoint, data is already captured. `RewardCampaign` supports this.  
**Effort:** Low — add a cron job that checks `CustomerProfile.birthday` daily and calls reward engine.

### 7. Referral System
**What:** Add a `Referral` model and track when a new user is referred by an existing customer. Reward both parties.  
**Why:** Low-CAC growth lever. Common in loyalty apps.  
**Effort:** Medium — new model, new module, new frontend flow.

### 8. Performance Audit
**What:** Run Lighthouse on greenchillyz.com with real assets and optimize to > 90 score.  
**Why:** Pending since `docs/16_Project_TODO.md`. Performance affects SEO and user experience.  
**Effort:** Medium — image optimization, font loading, code splitting review.

---

## Lower Priority

### 9. PostGIS Geo Queries
**What:** Replace Haversine-in-JavaScript with PostgreSQL PostGIS extension for geo sorting.  
**Why:** More accurate, better performance at scale (100+ outlets). Currently Haversine is acceptable.  
**Effort:** Medium — requires PostGIS extension on Supabase, schema change for geo columns, query rewrite.

### 10. Admin Dashboard Frontend
**What:** Build the admin-facing UI for platform management (currently backend-only).  
**Why:** Admins use raw API calls or Prisma Studio. A proper UI reduces operational friction.  
**Effort:** High — many pages (stores, customers, rewards, analytics, campaigns).

### 11. Test Suite
**What:** Write comprehensive unit and integration tests for wallet, auth, and game modules.  
**Why:** Financial operations (wallet credit/debit) require high confidence. Manual testing is insufficient at scale.  
**Effort:** Medium — patterns are standard NestJS Jest. Start with the critical scenarios in [Section 32](../part13-testing/test-scenarios.md).

### 12. Notification System Wiring
**What:** Configure SMTP provider and FCM. Wire notification triggers (welcome email, coin expiry warning, voucher expiry).  
**Why:** Notifications drive re-engagement. Infrastructure exists but needs live providers.  
**Effort:** Low once providers are chosen — mostly configuration.

### 13. Rate Limiting Hardening
**What:** Apply stricter rate limits to OTP, login, and coin-earning endpoints.  
**Why:** Abuse prevention. Current rate limiting is generic (60 req/min).  
**Effort:** Low — ThrottlerModule config per route.

### 14. Sentry Integration
**What:** Add Sentry error tracking to backend and frontend.  
**Why:** Currently errors are only in server logs. Sentry provides grouping, user context, and alerting.  
**Effort:** Low — install package, one init call, configure DSN.
