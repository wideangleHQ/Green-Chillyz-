# 44. Complete Admin Journey

Admin users are `User` records with elevated `Role` assignments. They authenticate via the same customer login flow but have additional capabilities gated by `PermissionsGuard`.

---

## Admin Login

```
Admin opens greenchillyz.com or a separate admin URL
  ↓
POST /api/v1/auth/login
  { identifier: "admin@greenchillyz.com", password: "..." }
  ↓
Server: verifies password, checks UserRole for elevated role
  ↓
gc_access_token contains JWT payload with roles: ["SUPER_ADMIN"]
  ↓
Admin accesses /api/v1/dashboard/* endpoints
```

> Admin does NOT use the franchise dashboard login. Admin uses customer auth (`gc_access_token` cookie) and accesses the `/api/v1/dashboard/` namespace.

---

## Platform Oversight

```
GET /api/v1/dashboard/analytics/summary
  → Total users, active stores, total coins circulating
  → Daily active users, new registrations
  → Top games by sessions
  → Top rewards by redemptions
```

---

## Store Management

```
Create outlet:
  POST /api/v1/dashboard/stores

Set/rotate store access code:
  PATCH /api/v1/dashboard/stores/:id { dashboardCode: "..." }

Deactivate outlet:
  PATCH /api/v1/dashboard/stores/:id { isActive: false }

Soft-delete outlet:
  DELETE /api/v1/dashboard/stores/:id
```

---

## Customer Management

```
List customers:
  GET /api/v1/dashboard/customers?page=1&limit=50&search=john

View customer profile:
  GET /api/v1/dashboard/customers/:id
  → User, CustomerProfile, Wallet, recent transactions

Manual coin adjustment:
  POST /api/v1/wallet/credit
  { userId, amount, reason, idempotencyKey }
```

---

## Reward Catalog Management

```
Create reward:
  POST /api/v1/dashboard/rewards
  {
    title: "Free GreenChillyz Burger",
    coinCost: 500,
    brandId: "...",
    validUntil: "2026-12-31",
    stockLimit: 1000
  }

Create campaign:
  POST /api/v1/dashboard/rewards/campaigns
  {
    name: "Festival Bonus",
    gameId: "...",
    bonusMultiplier: 2.0,
    startDate: "2026-10-01",
    endDate: "2026-10-31"
  }

Approve store voucher:
  PATCH /api/v1/dashboard/vouchers/:id { status: "APPROVED" }
```

---

## Game Configuration

```
Create game:
  POST /api/v1/games
  { name, slug, type, maxScore, dailyLimit, config }

Update game settings:
  PATCH /api/v1/games/:id
  { isActive: false }  // disable game temporarily

View game analytics:
  GET /api/v1/games/:id/stats
  → Total sessions, average score, coins distributed, daily trend
```

---

## Audit Trail Review

```
GET /api/v1/dashboard/audit-logs
  ?entityType=WalletTransaction
  &actorId=<userId>
  &from=2026-10-01
  &to=2026-10-31

→ Returns paginated log of all significant actions
→ Includes actor identity, IP, old/new values
```

---

## Notification Broadcasting

```
Send broadcast to all customers:
  POST /api/v1/dashboard/notifications/send
  {
    title: "Diwali Bonus!",
    body: "Play any game today and earn double coins!",
    audience: "ALL",
    channels: ["PUSH", "EMAIL"]
  }

Send to specific store's customers:
  POST /api/v1/dashboard/notifications/send
  {
    audience: "STORE",
    storeId: "...",
    title: "..."
  }
```

---

## Menu Management

```
GET    /api/v1/dashboard/menu/categories     → List categories
POST   /api/v1/dashboard/menu/categories     → Create category
GET    /api/v1/dashboard/menu/items          → List items
POST   /api/v1/dashboard/menu/items          → Create item
PATCH  /api/v1/dashboard/menu/items/:id      → Update item
```

> ⚠️ Menu tables may not be migrated in production. Verify with `bunx prisma db push` on dev before using these endpoints.

---

## Admin Capability Summary

| Action | Endpoint | Permission |
|---|---|---|
| All store CRUD | `/api/v1/dashboard/stores/*` | STORE_CREATE, STORE_UPDATE, STORE_DELETE |
| Customer lookup | `/api/v1/dashboard/customers/*` | CUSTOMER_VIEW |
| Manual coin credit | `/api/v1/wallet/credit` | wallet:credit |
| Game config | `/api/v1/games` (POST/PATCH/DELETE) | game:create, game:update, game:delete |
| Game analytics | `/api/v1/games/:id/stats` | game:analytics |
| Reward management | `/api/v1/dashboard/rewards/*` | REWARD_CREATE, REWARD_PUBLISH |
| Campaign management | `/api/v1/dashboard/rewards/campaigns/*` | CAMPAIGN_CREATE |
| Audit logs | `/api/v1/dashboard/audit-logs` | AUDIT_VIEW_ALL |
| Notifications | `/api/v1/dashboard/notifications/*` | NOTIFICATION_SEND |
