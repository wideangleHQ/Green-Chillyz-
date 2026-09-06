# 10. Data Ownership & Access

## Data by Owner

| Data | Belongs To | Visibility |
|---|---|---|
| Customer profile, wallet, game history | Customer | Customer (self), Admin |
| Outlet gallery, timings, facilities | Store | Public (read), Franchise (write), Admin |
| Store vouchers and promotions | Store | Public (read), Franchise (write), Admin |
| Reward catalog | Group (Brand-level) | Public (read), Admin (write) |
| Reward campaigns | Group (Admin) | Admin, affects all stores |
| Reward profiles & rules | Group (Admin) | Admin, assignable to stores |
| Dashboard sessions | Store (not a person) | Store's access code holder, Admin |
| Audit logs | Immutable — system-owned | Admin read |
| Notification preferences | Customer | Customer (self) |
| Staff profiles | Store | Store managers, Admin |

## Outlet Data Isolation

The platform enforces store-scoped access in two places:

### 1. Dashboard Auth Guard
The `DashboardAuthGuard` populates request context with the authenticated `storeId`. Every dashboard endpoint receives this context and filters queries by `storeId`.

**In `dashboard-auth.controller.ts`:**
```typescript
@Controller({ path: 'dashboard/auth', version: '1' })
@UseGuards(DashboardAuthGuard)
```

Downstream dashboard module services receive `storeId` from the authenticated context. A store **cannot** query or mutate another store's data because the `storeId` is extracted from the verified JWT, not from the request body.

### 2. store-scope.guard.ts
A dedicated guard (`store-scope.guard.ts`) verifies that a requested resource belongs to the authenticated store. This prevents parameter-tampering attacks where a franchise user provides a different `storeId` in the URL.

### 3. CustomerProfile.assignedStoreId
Each customer is assigned to one outlet. Coin redemptions at the outlet reference this relationship. A franchise dashboard can view redemptions for customers assigned to their store, but not other stores' customers.

## What Admin Can Access

Admin users (identified by `Role` and `Permission` assignments via `UserRole`) can:
- View and manage all stores, brands, customers
- Credit/debit wallet for any user (`WALLET_PERMISSIONS.VIEW_ANY`, `WALLET_PERMISSIONS.CREDIT`, `WALLET_PERMISSIONS.DEBIT`)
- Manage reward campaigns, profiles, rules
- View all audit logs and analytics
- Assign and revoke roles
- Access game analytics across all games

## What Franchise Users Can Access

A franchise store session (dashboard login) is scoped strictly to that store's data:
- View and update their store profile, gallery, timings, holidays
- Create and manage their store's vouchers
- View redemptions made at their store
- View wallet transactions related to their store
- View their store's announcements

**They cannot:**
- See another store's data
- Access any customer's personal wallet without context of a redemption
- Modify reward campaigns or profiles (admin-only)
- Access audit logs beyond their store scope

## What Customers Can Access

Via the customer API (authenticated routes):
- Their own profile, wallet, transactions
- Their own game sessions and history
- Their own reward redemptions and vouchers
- Their own notifications and preferences
- Public store and offer data

**They cannot:**
- See another customer's data
- Access any dashboard functionality
- Modify their `assignedStoreId` directly (admin-managed)
- Access admin or franchise endpoints

## Public (Unauthenticated) Data

The following data is publicly readable without authentication:
- Store listings (name, location, timings, gallery, facilities)
- Brand information
- Reward/voucher listings (to browse available offers)
- Menu categories and items (when implemented)
