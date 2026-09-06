# 48. Known Gaps & Technical Debt

## Critical Gaps (Blocks Functionality)

### Dashboard Frontend — Franchise Features
All franchise dashboard features beyond login are pending frontend implementation. The backend APIs are complete.

**Impact:** Franchise operators cannot manage their outlets, view redemptions, or validate vouchers via the dashboard.

**Files to create:**
```
dashboard/app/(dashboard)/
├── page.tsx                    ← Outlet overview
├── redemptions/page.tsx
├── vouchers/page.tsx
├── settings/page.tsx
└── analytics/page.tsx
```

---

### Menu Tables Not Migrated
`MenuCategory` and `MenuItem` are defined in the schema but the comment in `schema.prisma` says "NOT YET MIGRATED." The tables may not exist in production.

**Impact:** Menu API endpoints will fail with "table does not exist" if called in production.

**Fix:** Run `bunx prisma db push` to create the tables, then verify existing data is not affected.

---

### Geo-Personalization Module Missing
The `geo` module is fully designed in `docs/21_Server_Architecture.md` (endpoint `POST /api/v1/geo/resolve`, Redis caching strategy, Haversine → PostGIS path) but the module does not exist at `server/src/modules/geo/`.

**Impact:** The planned personalized homepage experience (`GET /api/v1/home/personalized`) is not available.

---

## Moderate Gaps (Reduces Quality)

### Customer Frontend — Inner Pages Unconfirmed
Pages for wallet, profile, game history, and reward catalog are not confirmed in the page audit. Only the homepage is verified.

**Investigation needed:** Check `client/app/` directory for all page routes.

---

### Font Discrepancy
Design spec (`docs/02_UI_Design_System.md`) specifies **Poppins** exclusively. Implementation uses **Anton + Manrope + Space Grotesk**.

**Impact:** Design handoff documents reference the wrong fonts. Stakeholder confusion risk.

**Options:** Either update the design spec to match implementation, or align the implementation to use Poppins.

---

### Store Locator Map
`LocationsSection` uses a Mapbox placeholder. An actual interactive map is not implemented.

**Impact:** Customers cannot interact with a map to find nearby outlets.

---

### OAuth Source Tracking
Users who signed up via Google OAuth may not have their `passwordHash` set (expected). But if OTP verification is attempted for Google-auth users, the flow needs to gracefully handle this case. This should be verified.

---

## Minor Gaps (Low Impact)

### Test Coverage Unknown
No test file audit was performed. Test coverage level is unconfirmed. Jest is installed but spec file existence and coverage are unknown.

**Action:** Run `find server/src -name "*.spec.ts" | wc -l` to count existing test files.

---

### Notification Providers Not Configured
Email (SMTP), SMS, and push notification providers need real credentials to function. Currently they degrade gracefully but no notifications are sent without proper `MAIL_*`, `SMS_*`, and `PUSH_FCM_*` env vars.

---

### Rate Limiting on OTP Routes
OTP request routes should have strict rate limiting (e.g., 3 requests per 10 minutes per IP) to prevent SMS/email flooding. Verify that `ThrottlerModule` or a custom guard applies appropriate limits to `POST /auth/request-otp`.

---

### Challenges Module
`ChallengesModule` is imported in `app.module.ts` but was not reviewed in this audit. Its implementation status is unknown.

---

## Design Spec Differences Summary

| Item | Design Spec | Actual Implementation |
|---|---|---|
| Fonts | Poppins | Anton + Manrope + Space Grotesk |
| Image storage | Cloudinary | Cloudflare R2 |
| Geo module | Implemented in server | Not implemented (docs only) |
| Dashboard frontend | Full UI | Login page only |
| Map (LocationsSection) | Interactive Mapbox | Placeholder |
