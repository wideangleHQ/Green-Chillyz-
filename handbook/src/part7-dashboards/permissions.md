# 22. Role & Permission Matrix

## Permission System Architecture

Permissions are stored in the `Permission` table (`name`, `module`, `action`). Roles are stored in the `Role` table. `RolePermission` links them. `UserRole` assigns roles to users (optionally scoped to a `storeId`).

## Role Types

| Role | Description | Auth Method |
|---|---|---|
| `SUPER_ADMIN` | Full platform control | Customer JWT + role |
| `CORPORATE_ADMIN` | Group-level management | Customer JWT + role |
| `STORE_MANAGER` | Outlet-level management (legacy) | Customer JWT + role |
| `STAFF` | Outlet staff (limited) | Customer JWT + role |
| `CUSTOMER` (implicit) | All authenticated customers | Customer JWT |
| Dashboard Session | Franchise outlet access | Dashboard store-code JWT |

## Capability Matrix

| Capability | Customer | Franchise Session | Store Manager | Corporate Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| View public website | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register / login | ✓ | — | — | ✓ | ✓ |
| View own wallet | ✓ | — | — | — | — |
| View any wallet | — | — | — | ✓ | ✓ |
| Credit/debit coins | — | — | — | ✓ | ✓ |
| Play games | ✓ | — | — | — | — |
| View game history (own) | ✓ | — | — | — | — |
| View all game analytics | — | — | — | ✓ | ✓ |
| Configure games | — | — | — | ✓ | ✓ |
| Redeem rewards | ✓ | — | — | — | — |
| View own redemptions | ✓ | — | — | — | — |
| Redeem on behalf of customer | — | ✓ | ✓ | ✓ | ✓ |
| View outlet's redemptions | — | ✓ | ✓ | ✓ | ✓ |
| Manage own outlet | — | ✓ | ✓ | ✓ | ✓ |
| Manage any outlet | — | — | — | ✓ | ✓ |
| Create/delete outlets | — | — | — | ✓ | ✓ |
| Create store vouchers | — | ✓ | ✓ | ✓ | ✓ |
| Approve store vouchers | — | — | — | ✓ | ✓ |
| Create reward catalog | — | — | — | ✓ | ✓ |
| Manage reward campaigns | — | — | — | ✓ | ✓ |
| Manage reward profiles | — | — | — | ✓ | ✓ |
| View audit logs (own store) | — | ✓ | ✓ | ✓ | ✓ |
| View all audit logs | — | — | — | ✓ | ✓ |
| Manage users / roles | — | — | — | ✓ | ✓ |
| View notification preferences | ✓ | — | — | ✓ | ✓ |
| Send broadcast notifications | — | — | — | ✓ | ✓ |
| View platform analytics | — | — | — | ✓ | ✓ |
| Expire coins (cron) | — | — | — | ✓ | ✓ |

## Permission Constants

From `server/src/modules/wallet/constants`:
```typescript
WALLET_PERMISSIONS = {
  VIEW_ANY: 'wallet:view:any',
  CREDIT: 'wallet:credit',
  DEBIT: 'wallet:debit',
  ADJUST: 'wallet:adjust',
}
```

From `server/src/modules/game/constants`:
```typescript
GAME_PERMISSIONS = {
  GAME_CREATE: 'game:create',
  GAME_UPDATE: 'game:update',
  GAME_DELETE: 'game:delete',
  GAME_ANALYTICS: 'game:analytics',
}
```

## How Permissions Are Checked

```typescript
@Get(':id/stats')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(GAME_PERMISSIONS.GAME_ANALYTICS)
async getGameStats(@Param('id') id: string) { ... }
```

`PermissionsGuard` reads the `@Permissions(...)` metadata, loads the user's active roles from `UserRole` (where `revokedAt IS NULL`), traverses `RolePermission` → `Permission`, and allows or denies the request.

## Dashboard vs Customer Permission Boundary

Dashboard sessions (franchise) operate on a **completely separate auth stack**:
- Separate JWT secrets (`DASHBOARD_JWT_SECRET`)
- Separate cookies (`gc_dashboard_access_token`)
- Separate guard (`DashboardAuthGuard`)
- Separate session table (`DashboardSession`)

A dashboard session cookie **cannot** be used to access customer API endpoints, and vice versa. The two auth systems are completely isolated.
