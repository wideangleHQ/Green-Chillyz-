# 42. Complete Customer Journey

This traces a real customer's end-to-end experience across the platform.

---

## Discovery

```
Customer finds greenchillyz.com
  ↓
Homepage loads:
  - Preloader (brand animation)
  - HeroSection (above fold, eager loaded)
  - BrandSnapshotSection (lazy loaded on scroll)
  - BrandStorySection
  - SignatureCreationsSection (menu highlights)
  - OffersSection (current promotions)
  - GamesSection (mini-games preview)
  - BusinessVerticalsSection
  - LocationsSection (find nearest outlet)
  - WhyGreenChillyzSection
  - ReviewsSection
```

**Code path:** `client/app/page.tsx` → dynamic section components

---

## Registration

```
Customer clicks "Join" / "Sign Up"
  ↓
OnboardingWrapper activates (overlay flow)
  ↓
Choice: Email registration OR Google OAuth

Path A — Email:
  POST /api/v1/auth/register
  { fullName, email, password }
  → gc_access_token + gc_refresh_token cookies set
  → User record created
  → CustomerProfile created (linked to User)
  → Wallet created (balance: 0)

Path B — Google:
  Supabase Auth SDK → Google sign-in
  Supabase returns JWT token
  POST /api/v1/auth/google { token }
  → Server verifies token via SUPABASE_JWT_SECRET
  → User created/fetched (upsert on email)
  → Same wallet + profile creation
```

**Code path:** `client/components/OnboardingWrapper.tsx`, `server/src/modules/auth/auth.service.ts`

---

## First Visit to a Store

```
Customer uses LocationsSection (map placeholder, lists nearby stores)
  ↓
Visits outlet page: greenchillyz.com/outlets/[slug]
  ↓
[📋 Planned] GET /api/v1/stores/[slug]
  - Store details, hours, gallery
  - Active vouchers/offers for this outlet
```

**Status:** Backend API implemented; outlet public page frontend is pending.

---

## Playing a Game

```
Customer navigates to Games section / game page
  ↓
Selects a game (e.g., "Spin the Wheel")
  ↓
POST /api/v1/games/sessions/start
  { gameId: "..." }
  → Server checks: daily limit, cooldown, active game
  → GameSession created (status: STARTED)
  → Returns sessionId
  ↓
Customer plays game (frontend only — no server involvement during play)
  ↓
Game ends → score calculated client-side
  ↓
POST /api/v1/games/sessions/end
  { sessionId, score }
  → Server validates: score <= maxScore, session belongs to user, status = STARTED
  → RewardEngineService evaluates campaigns
  → WalletTransaction CREATED (source: GAME_REWARD)
  → Wallet.balance UPDATED (denormalized)
  → GameSession.status = REWARDED
  → Returns { coins: 50, message: "You won 50 coins!" }
```

**Code path:** `server/src/modules/game/`, `server/src/modules/wallet/`

---

## Checking Wallet Balance

```
Customer opens wallet / profile page
  ↓
GET /api/v1/wallet/me/balance
  → WalletCacheService checks Redis first
  → Cache hit: returns balance directly
  → Cache miss: Prisma query, updates cache
  ↓
GET /api/v1/wallet/me/transactions?page=1&limit=20
  → Paginated transaction history with source labels
```

---

## Redeeming a Reward

```
Customer browses rewards catalog
  ↓
GET /api/v1/rewards (public — no auth needed for browsing)
  ↓
Customer selects a reward and clicks "Redeem"
  ↓
POST /api/v1/rewards/:id/redeem
  → Auth required (JwtAuthGuard)
  → Checks balance >= reward.coinCost
  → Creates RewardRedemption + RewardVoucher
  → Debits wallet (WalletTransaction: source REWARD_REDEMPTION)
  → Returns voucher with unique code
  ↓
Customer shows voucher at outlet
  ↓
[📋] Franchise staff scans/validates voucher via dashboard
```

---

## Session Persistence

```
Customer returns to site after closing browser
  ↓
gc_access_token cookie (15min expiry) — may be expired
  ↓
gc_refresh_token cookie (7d expiry) — still valid
  ↓
Automatic refresh:
  POST /api/v1/auth/refresh
  → New gc_access_token issued
  → Refresh token rotated (new gc_refresh_token)
  → User stays logged in seamlessly
```

**Code path:** Client-side: React Query + axios interceptor; Server: `server/src/modules/auth/auth.service.ts`

---

## Complete State Diagram

```
Anonymous
  → Registration/Login
  → Authenticated
      → Game Play → Coins Earned
      → Reward Browse → Reward Redeem → Voucher
      → Profile View → Device Management
      → Logout (or Token Expiry → Re-Login)
```
