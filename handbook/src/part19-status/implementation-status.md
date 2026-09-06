# 47. Implementation Status

Last verified: 2026-09-06 via codebase audit.

**Legend:** ✅ Implemented · 🔶 Partial · 📋 Planned · ⚠️ Differs from spec · ❓ Unconfirmed

---

## Backend (Server)

| Module | Status | Notes |
|---|---|---|
| Auth (customer) | ✅ | Register, login, Google OAuth, refresh, logout, OTP, devices |
| Dashboard Auth | ✅ | Store code login, argon2 hash, blind index, family-burn refresh |
| Wallet | ✅ | Balance, transactions, credit/debit/expire, cache, idempotency |
| Games | ✅ | Config, session lifecycle, reward evaluation, daily limit, leaderboard |
| Stores | ✅ | CRUD, nearby geo-sort (Haversine), gallery, timings, holidays |
| Rewards | ✅ | Catalog, redemption, vouchers, campaigns, assignments, overrides |
| Reward Engine | ✅ | Campaign evaluation, profile rules, resolution pipeline |
| Dashboard (admin) | ✅ | APIs for stores, customers, wallet, rewards, analytics, notifications, menu |
| Menu | 🔶 | Schema defined, endpoints exist, tables NOT YET MIGRATED in production |
| Notifications | 🔶 | Module exists, BullMQ workers, email/SMS/push channels (providers need config) |
| Challenges | ❓ | `ChallengesModule` imported in AppModule, implementation unreviewed |
| Geo | 📋 | Designed in docs/21, module does NOT exist in server/src/modules/ |
| Customer Bootstrap | ✅ | `CustomerBootstrapModule` handles profile creation on first auth |
| Audit | ✅ | `AuditModule`, `AuditLog` table, write-on-significant-actions |
| Health | ✅ | `/api/v1/health` via @nestjs/terminus |
| Coin Economy | ✅ | 18 TransactionSource values, expiry cron, BullMQ |

---

## Customer Frontend (client/)

| Feature | Status | Notes |
|---|---|---|
| Homepage — all 11 sections | ✅ | Preloader, Navbar, Hero, 9 dynamic sections |
| Smooth scroll (Lenis) | ✅ | SmoothScroll provider |
| GSAP scroll animations | ✅ | Per-section ScrollTrigger |
| Framer Motion transitions | ✅ | Component-level |
| SEO metadata | ✅ | metadataBase, OG tags |
| Fonts (Anton, Manrope, Space Grotesk) | ✅ | ⚠️ Design spec said Poppins |
| Google OAuth | ✅ | Via Supabase SDK |
| Customer auth flow | ✅ | Login, register, refresh |
| Profile / account page | ❓ | Not found in page audit |
| Wallet page | ❓ | Not found in page audit |
| Games page | ❓ | GamesSection on homepage; dedicated /games route unconfirmed |
| Rewards/offers page | ❓ | OffersSection on homepage; dedicated route unconfirmed |
| Store/outlet pages | 📋 | LocationsSection shows list; individual outlet pages pending |
| React Query integration | ✅ | @tanstack/react-query in package.json + AppProviders |
| Image storage | ✅ | ⚠️ Cloudflare R2 (spec said Cloudinary) |

---

## Franchise Dashboard (dashboard/)

| Feature | Status | Notes |
|---|---|---|
| Login page | ✅ | dashboard/app/login/page.tsx |
| Outlet overview | 📋 | Backend ready, frontend pending |
| Coin redemption flow | 📋 | Backend ready, frontend pending |
| Outlet profile management | 📋 | Backend ready, frontend pending |
| Voucher creation | 📋 | Backend ready, frontend pending |
| Redemption history | 📋 | Backend ready, frontend pending |
| Analytics | 📋 | Backend ready, frontend pending |
| Session management | 📋 | Backend ready, frontend pending |

---

## Database Schema

| Model Group | Status | Notes |
|---|---|---|
| User + CustomerProfile | ✅ | Fully migrated |
| Wallet + WalletTransaction | ✅ | Fully migrated, idempotency keys |
| Game + GameSession | ✅ | Fully migrated |
| Store + Brand | ✅ | Fully migrated, dashboard auth fields |
| Reward + RewardRedemption + RewardVoucher | ✅ | Fully migrated |
| RewardCampaign + RewardHistory | ✅ | Fully migrated |
| RewardProfile + ProfileRewardRule | ✅ | Fully migrated |
| DashboardSession + DashboardRefreshToken | ✅ | Fully migrated |
| AuditLog | ✅ | Fully migrated |
| MenuCategory + MenuItem | 🔶 | Schema defined, NOT YET MIGRATED per schema comment |
| StoreVoucher | ✅ | Fully migrated |
| Notification | ❓ | Schema unreviewed |
