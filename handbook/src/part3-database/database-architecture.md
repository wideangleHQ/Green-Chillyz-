# 8. Database Architecture

## Technology

| Property | Value |
|---|---|
| Database | **PostgreSQL 16+** |
| Provider | **Supabase** (managed PostgreSQL) |
| ORM | **Prisma 6** |
| Schema file | `server/prisma/schema.prisma` (~2512 lines) |
| Migration history | `server/prisma/migrations/` |
| Connection | `DATABASE_URL` environment variable |

## Schema Organisation

The schema is divided into logical domains, each clearly commented:

| Domain | Models |
|---|---|
| **Brand** | `Brand` |
| **Store** | `Store`, `StoreGallery`, `StoreTiming`, `StoreHoliday`, `StoreFacility`, `StoreManager`, `StoreAnnouncement` |
| **User & Auth** | `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `RefreshToken`, `UserDevice`, `LoginHistory`, `Otp` |
| **Customer** | `CustomerProfile`, `CustomerStoreHistory` |
| **Staff** | `StaffProfile` |
| **Wallet** | `Wallet`, `WalletTransaction` |
| **Reward Engine** | `RewardCampaign`, `RewardRule`, `RewardHistory` |
| **Games** | `Game`, `GameSession` |
| **Rewards Catalog** | `RewardCategory`, `Reward`, `RewardStoreAvailability`, `RewardRedemption`, `RewardVoucher`, `RewardAnalyticsEvent` |
| **Store Vouchers** | `StoreVoucher`, `StoreVoucherHistory`, `StoreVoucherRedemption` |
| **Notifications** | `Notification`, `NotificationTemplate`, `NotificationPreference`, `NotificationDeliveryLog` |
| **Audit** | `AuditLog` |
| **Dashboard IAM** | `DashboardSession`, `DashboardRefreshToken` |
| **Menu** | `MenuCategory`, `MenuItem`, `MenuItemImage`, `MenuTag`, `MenuItemTag` |
| **Reward Profiles** | `RewardProfile`, `RewardProfileVersion`, `RewardProfileMetadata` |
| **Profile Rules** | `ProfileRewardRule`, `ProfileRewardRuleReward`, `ProfileRewardRuleMetadata` |
| **Assignments & Overrides** | `RewardAssignment`, `RewardOverride` |

## Key Design Decisions

### Soft Deletion
Several models have `deletedAt DateTime?` for soft deletion: `User`, `Store`, `MenuCategory`, `MenuItem`, `RewardProfile`, `ProfileRewardRule`. Hard deletion is avoided to preserve audit trails.

### Audit Fields
`Store` and many business entities carry `createdBy`, `updatedBy`, `deletedBy` (UUID FK to `User`). All models have `createdAt` and `updatedAt` via `@default(now())` and `@updatedAt`.

### Idempotency Keys
`WalletTransaction` and `RewardRedemption` both have `idempotencyKey String @unique`. This prevents duplicate credits/redemptions from retry storms or network failures.

### Dashboard Authentication
The `Store` table directly carries dashboard auth fields:
- `dashboardCodeHash` — argon2 hash of the access code (auth input)
- `dashboardCodeLookup` — HMAC keyed blind index (fast single-row lookup)
- `dashboardCodeEncrypted` — AES-256-GCM ciphertext (recovery only, never auth input)
- `dashboardCode` — plaintext (seed-time only, not used post-bootstrap)
- Lockout: `dashboardFailedAttempts`, `dashboardLockedUntil`

### JSONB Metadata
Many models have a `metadata Json? @db.JsonB` field for extensible structured data. Querying is possible via PostgreSQL JSONB operators.

### GIN Index on Menu Search
`MenuItem.searchKeywords String[]` has a GIN index (`@index([searchKeywords], type: Gin)`) for efficient full-text search across menu items.

### Denormalised Audit Log
`AuditLog` is deliberately denormalised — all entity/event/metadata stored inline rather than in join tables. This optimises the overwhelmingly-common read pattern (filtered scans over a time-ordered stream). The schema comment explains: "Audit reads are overwhelmingly filtered scans over a single time-ordered stream, so joins would cost on every query while buying no scalability."

## Important Indexes

| Table | Index | Purpose |
|---|---|---|
| `stores` | `idx_stores_location` on `(latitude, longitude)` | Geo queries |
| `stores` | `idx_stores_featured` on `(isFeatured, isActive)` | Featured store queries |
| `wallet_transactions` | `idx_wallet_txn_wallet_date` on `(walletId, createdAt DESC)` | Transaction history |
| `wallet_transactions` | `idempotency_key` UNIQUE | Duplicate prevention |
| `game_sessions` | `idx_game_sessions_user_status` | Per-user session queries |
| `reward_redemptions` | `idempotency_key` UNIQUE | Duplicate redemption prevention |
| `audit_logs` | `idx_audit_logs_timeline` on `(createdAt DESC, id)` | Cursor pagination |
| `notifications` | `idx_notifications_user_status` | Per-user notification feed |
| `menu_items` | `idx_menu_items_keywords` GIN on `searchKeywords` | Text search |
| `refresh_tokens` | `idx_refresh_tokens_family` | Token family burn on reuse |

## Migration Strategy

> ⚠️ **Critical Note** (from project memory): The migration history is stale. **Always use `prisma db push`** for schema changes, **never** `migrate dev` or `migrate reset` in this environment, as the migration history does not match the actual database state.

```bash
# Safe: sync schema to database without migration history
npx prisma db push

# Safe: generate Prisma client after schema change  
npx prisma generate

# UNSAFE in this project: do not use
# npx prisma migrate dev    ← stale history
# npx prisma migrate reset  ← destructive
```

## Menu Models Note

The schema contains a comment on the Menu domain:

> `NOT YET MIGRATED. These models are declared so the engine compiles and the importer can be written against real types; the tables are created when the migration is approved.`

This means `MenuCategory`, `MenuItem`, `MenuItemImage`, `MenuTag`, and `MenuItemTag` exist in the Prisma schema but their tables **may not exist in the production database**. Verify before using.
