# 32. Critical Business Test Scenarios

These scenarios represent the core business logic that must work correctly. Test these manually during development and automate them before any production release.

---

## Scenario 1 — New Customer Registration and First Coin Earn

**Steps:**
1. `POST /api/v1/auth/register` with valid email + password
2. Verify `gc_access_token` cookie is set
3. `GET /api/v1/auth/me` — verify profile returned
4. `GET /api/v1/wallet/me/balance` — verify balance is 0
5. Start a game: `POST /api/v1/games/sessions/start`
6. End game with valid score: `POST /api/v1/games/sessions/end`
7. `GET /api/v1/wallet/me/balance` — verify coins credited

**Expected:** Balance increases by the game's reward amount. One `WalletTransaction` with source `GAME_REWARD` exists.

---

## Scenario 2 — Wallet Idempotency

**Steps:**
1. Credit coins via admin: `POST /api/v1/wallet/credit` with idempotencyKey = `"test-key-001"`
2. Repeat the exact same request with the same idempotencyKey
3. Check wallet balance and transaction count

**Expected:** Balance only increases once. Only one `WalletTransaction` for that idempotency key exists.

---

## Scenario 3 — Game Daily Limit

**Steps:**
1. Start and complete game session (session 1) — succeeds
2. Immediately start and complete game session (session 2) for the same game

**Expected:** Session 2 is rejected if the game has `dailyLimit = 1`. The error should indicate daily limit reached.

---

## Scenario 4 — Token Family Burn (Security)

**Steps:**
1. Login → receive `gc_refresh_token` (token A)
2. Refresh → receive new `gc_refresh_token` (token B); token A is now revoked
3. Send token A again to `POST /api/v1/auth/refresh`

**Expected:** ALL tokens in that family are revoked (burn). Subsequent refresh with token B also fails. User must login again.

---

## Scenario 5 — Dashboard Auth Isolation

**Steps:**
1. Login to franchise dashboard: `POST /api/v1/dashboard/auth/login`
2. Use `gc_dashboard_access_token` cookie to call `GET /api/v1/auth/me`

**Expected:** 401 Unauthorized. Dashboard cookie cannot authenticate customer endpoints.

**Also test the reverse:** Customer `gc_access_token` cannot authenticate dashboard endpoints.

---

## Scenario 6 — Dashboard Login Lockout

**Steps:**
1. `POST /api/v1/dashboard/auth/login` with wrong storeCode × N (N = `DASHBOARD_MAX_FAILED_ATTEMPTS`)
2. Try once more with the correct storeCode

**Expected:** After N failures, all login attempts (including correct code) return locked status until lockout expires (`DASHBOARD_LOCK_DURATION_MINUTES`).

---

## Scenario 7 — Franchise Outlet Isolation

**Steps:**
1. Login as Store A (get Store A's JWT)
2. Attempt to access Store B's vouchers by passing Store B's ID

**Expected:** Only Store A's data is returned. The `storeId` in the JWT determines scope — URL parameters cannot override it.

---

## Scenario 8 — Reward Redemption Flow

**Steps:**
1. Ensure customer has sufficient coin balance
2. `POST /api/v1/rewards/:id/redeem`
3. Check wallet balance (should decrease by reward cost)
4. Check `RewardRedemption` and `RewardVoucher` records

**Expected:** Balance decremented, redemption record created, voucher issued with unique code.

---

## Scenario 9 — Coin Expiry

**Steps:**
1. Admin credits coins with `expiresAt` set in the past (or use a short expiry for testing)
2. Run expiry: `POST /api/v1/wallet/expire`
3. Check wallet balance

**Expected:** Expired coins are deducted. A `WalletTransaction` with type `EXPIRE` and source `COIN_EXPIRY` is created.

---

## Scenario 10 — Store Visibility

**Steps:**
1. `GET /api/v1/stores` (public, no auth)
2. `GET /api/v1/stores/nearby?latitude=XX&longitude=XX` (public)

**Expected:**
- Only stores with `isActive = true` are returned
- Soft-deleted stores (`deletedAt != null`) are excluded
- Nearby endpoint returns stores sorted by distance

---

## Regression Smoke Test

Run these after any backend change:

```
[ ] POST /api/v1/auth/register   → 201
[ ] POST /api/v1/auth/login      → 200, cookies set
[ ] GET  /api/v1/auth/me         → 200, user data
[ ] GET  /api/v1/wallet/me       → 200
[ ] GET  /api/v1/games           → 200, array
[ ] GET  /api/v1/stores          → 200, array
[ ] GET  /api/v1/health          → { status: "ok" }
```
