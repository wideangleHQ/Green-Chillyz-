# 20. Admin Dashboard

## Overview

The Admin Dashboard is the group-level management interface. It gives administrators full platform oversight: all outlets, all customers, all rewards, all campaigns, all audit logs, and platform-wide analytics.

## Authentication

Admin users authenticate via the **customer auth system** (`POST /api/v1/auth/login`) — they are `User` records with elevated `Role` assignments. Admin access is controlled via `UserRole` and `RolePermission`, not via a separate login system.

> **This differs from franchise auth:** Franchise users authenticate with a store access code and have no user account. Admin users have a full `User` record with role-based permissions.

## Backend Architecture

**Module:** `server/src/modules/dashboard/`

Sub-directories within the dashboard module:
```
modules/dashboard/
├── analytics/          ← Platform analytics endpoints
├── common/             ← Shared dashboard types/guards
├── customers/          ← Customer management
├── menu/               ← Menu management
├── notifications/      ← Notification management
├── rewards/            ← Reward and campaign management
├── stores/             ← Outlet management
├── vouchers/           ← Voucher management
└── wallet/             ← Wallet oversight
```

## Dashboard API Endpoints

All admin endpoints are under `/api/v1/dashboard/` (separate from the customer API namespace at `/api/v1/`).

### Stores Management
```
GET    /api/v1/dashboard/stores          → List all stores
POST   /api/v1/dashboard/stores          → Create store
PATCH  /api/v1/dashboard/stores/:id      → Update store
DELETE /api/v1/dashboard/stores/:id      → Soft-delete store
```

### Customer Management
```
GET  /api/v1/dashboard/customers         → List customers (paginated, filterable)
GET  /api/v1/dashboard/customers/:id     → Customer detail + profile + wallet
```

### Rewards & Campaigns
```
GET    /api/v1/dashboard/rewards         → List rewards
POST   /api/v1/dashboard/rewards         → Create reward
PATCH  /api/v1/dashboard/rewards/:id     → Update reward
GET    /api/v1/dashboard/rewards/campaigns → List campaigns
POST   /api/v1/dashboard/rewards/campaigns → Create campaign
```

### Vouchers
```
GET    /api/v1/dashboard/vouchers        → All vouchers across stores
GET    /api/v1/dashboard/vouchers/:id    → Voucher detail
PATCH  /api/v1/dashboard/vouchers/:id    → Update/approve voucher
```

### Wallet Oversight
```
GET  /api/v1/dashboard/wallet/users/:id  → Any user's wallet
POST /api/v1/dashboard/wallet/credit     → Credit coins (admin action)
POST /api/v1/dashboard/wallet/debit      → Debit coins (admin action)
```

### Analytics
```
GET /api/v1/dashboard/analytics/summary       → Platform summary
GET /api/v1/dashboard/analytics/coins         → Coin economy stats
GET /api/v1/dashboard/analytics/games         → Games performance
GET /api/v1/dashboard/analytics/redemptions   → Redemption analytics
```

### Notifications
```
GET  /api/v1/dashboard/notifications          → System notifications
POST /api/v1/dashboard/notifications/send     → Send notification to users
```

### Menu
```
GET    /api/v1/dashboard/menu/categories      → List menu categories
POST   /api/v1/dashboard/menu/categories      → Create category
GET    /api/v1/dashboard/menu/items           → List menu items
POST   /api/v1/dashboard/menu/items           → Create menu item
PATCH  /api/v1/dashboard/menu/items/:id       → Update menu item
```

## Frontend Status

As of the current commit, the admin dashboard **frontend** is not implemented beyond the shared login page at `dashboard/app/login/`. The `(dashboard)` route group exists in the Next.js app structure but contains no implemented pages.

**Backend:** ✅ APIs implemented  
**Frontend:** 📋 Pending implementation

## Permission System

Admin capability is granted via `UserRole` + `RolePermission`:

```sql
-- Admin user has a role like "SUPER_ADMIN" or "CORPORATE_ADMIN"
-- That role has permissions like:
WALLET_VIEW_ANY, WALLET_CREDIT, WALLET_DEBIT
GAME_CREATE, GAME_UPDATE, GAME_DELETE, GAME_ANALYTICS
STORE_CREATE, STORE_UPDATE, STORE_DELETE
REWARD_CREATE, REWARD_UPDATE, REWARD_PUBLISH
...
```

The `PermissionsGuard` + `@Permissions(...)` decorator enforce this at the controller level.
