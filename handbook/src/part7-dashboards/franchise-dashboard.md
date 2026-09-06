# 21. Franchise Dashboard

## Overview

The Franchise Dashboard at `dashboard.greenchillyz.com` is the outlet-level management interface for franchise operators. It authenticates using a **store access code** — not a personal user account.

## Core Concept: Store as Principal

Unlike typical user-based auth, the dashboard's authentication principal is the **store itself**:
- No username or email required
- A single shared access code for the outlet
- The code is set during store onboarding and can be rotated
- Multiple staff can use the same code (dashboard sessions are store-scoped, not person-scoped)

This design simplifies franchise onboarding and eliminates the need for managing individual staff accounts.

## Authentication Flow

```
Staff opens dashboard.greenchillyz.com/login
  ↓
Enters store access code (e.g., "GC-XCYZ1234")
  ↓
POST /api/v1/dashboard/auth/login
  { storeCode: "GC-XCYZ1234" }
  ↓
DashboardAuthService:
  1. Computes HMAC blind index from storeCode (peppered with DASHBOARD_CODE_PEPPER)
  2. Single indexed lookup: stores WHERE dashboard_code_lookup = <blind_index>
  3. Verifies argon2 hash: code vs stores.dashboard_code_hash
  4. Checks lockout state (failed attempts, locked_until)
  5. Creates DashboardSession in PostgreSQL + Redis
  6. Issues gc_dashboard_access_token (15m) + gc_dashboard_refresh_token (7d)
  ↓
Store context returned: { id, name, slug, brand, location }
  ↓
Franchise user sees their outlet dashboard
```

### Security Details
- **5 failed attempts** triggers lockout (configurable `DASHBOARD_MAX_FAILED_ATTEMPTS`)
- **15 minute lockout** duration (configurable `DASHBOARD_LOCK_DURATION_MINUTES`)
- IP address and device fingerprint logged per session
- Dashboard sessions are separate from customer sessions (different cookies, different JWT secrets)

## Implemented Dashboard Features

### ✅ Login Page
- `dashboard/app/login/page.tsx`
- Store code input form
- Error handling for invalid codes and lockouts

### 📋 All Other Features (Backend Ready, Frontend Pending)

The backend provides all the APIs needed for a full franchise dashboard. None of the following have frontend implementations yet:

| Feature | Backend Endpoint | Status |
|---|---|---|
| Dashboard home / outlet overview | `GET /api/v1/dashboard/auth/me` | 📋 |
| Coin redemption (customer lookup) | Dashboard rewards endpoints | 📋 |
| Outlet profile management | `PATCH /api/v1/dashboard/stores/:id` | 📋 |
| Gallery management | Store gallery endpoints | 📋 |
| Operating hours | Store timing endpoints | 📋 |
| Holiday closures | Store holiday endpoints | 📋 |
| Voucher creation | Dashboard voucher endpoints | 📋 |
| Voucher management | Dashboard voucher endpoints | 📋 |
| View redemptions | Dashboard redemption endpoints | 📋 |
| Announcements | Store announcement endpoints | 📋 |
| Notifications | Dashboard notification endpoints | 📋 |

## Outlet Data Isolation

### How It Works

The `DashboardAuthGuard` extracts the `storeId` from the verified JWT payload and attaches it to the request context. Every downstream dashboard service receives the `storeId` from context — not from the URL or body.

```typescript
// Pseudocode — DashboardAuthGuard behaviour
const storeId = verifiedJwt.storeId;
request.dashboardContext = { storeId, store: { name, brand } };

// In a dashboard controller
@Get('vouchers')
async getVouchers(@DashboardCurrentStore() store: DashboardPrincipal) {
  // store.storeId comes from the JWT, not from the request
  return this.voucherService.findByStore(store.storeId);
}
```

A franchise user **cannot** access another outlet's data because:
1. Their JWT contains only their `storeId`
2. The `store-scope.guard.ts` validates resource ownership
3. All queries filter by `storeId` from context

## Dashboard Session Management

Dashboard sessions are tracked in two layers:

| Layer | Mechanism | Purpose |
|---|---|---|
| **Redis** | Hot session copy | Fast auth check on every request |
| **PostgreSQL** | `DashboardSession` table | Durable record, session listing, revocation |

**Refresh token rotation** uses the same family-burn mechanism as customer auth:
- `DashboardRefreshToken` table tracks token families
- Presenting a revoked token burns the entire family (detects token theft)

## Token Recovery

If a store loses access to their code:
1. Admin looks up `Store.dashboardCodeEncrypted` (AES-256-GCM ciphertext)
2. Decrypts with `DASHBOARD_CODE_SECRET` to recover the plaintext code
3. Issues new code if needed (resets `dashboardCodeHash`, `dashboardCodeLookup`)

This is the **only** purpose of `dashboardCodeEncrypted` — it is never used in the auth flow.
