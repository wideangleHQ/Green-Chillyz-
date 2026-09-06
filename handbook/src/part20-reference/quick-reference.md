# 52. Quick Reference

## Ports

| Service | Port | Command |
|---|---|---|
| Backend API | 4000 | `cd server && bun run start:dev` |
| Customer Frontend | 5000 | `cd client && npm run dev` |
| Franchise Dashboard | 5100 | `cd dashboard && npm run dev` |
| Prisma Studio | 5555 | `cd server && bunx prisma studio` |
| Handbook | 3000 | `cd handbook && mdbook serve --open` |

---

## Key URLs (Development)

| Resource | URL |
|---|---|
| API health | http://localhost:4000/api/v1/health |
| Swagger UI | http://localhost:4000/api/docs |
| Customer site | http://localhost:5000 |
| Dashboard | http://localhost:5100 |

---

## Key URLs (Production)

| Resource | URL |
|---|---|
| Customer site | https://greenchillyz.com |
| Dashboard | https://dashboard.greenchillyz.com |
| API base | https://api.greenchillyz.com/api/v1 |
| API health | https://api.greenchillyz.com/api/v1/health |

---

## Database Commands

```bash
# Push schema changes (safe)
cd server && bunx prisma db push

# Regenerate Prisma client after schema change
cd server && bunx prisma generate

# Open database GUI
cd server && bunx prisma studio

# NEVER use these:
# bunx prisma migrate dev
# bunx prisma migrate reset
```

---

## Common API Calls

```bash
BASE=http://localhost:4000/api/v1

# Health check
curl $BASE/health

# Register
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"Test1234!"}'

# List stores (public)
curl $BASE/stores

# Nearby stores
curl "$BASE/stores/nearby?latitude=20.296&longitude=85.824"

# List active games (requires auth cookie)
curl $BASE/games --cookie "gc_access_token=<token>"

# Dashboard login
curl -X POST $BASE/dashboard/auth/login \
  -H "Content-Type: application/json" \
  -d '{"storeCode":"GC-XXXX0001"}'
```

---

## Module Registry

| Module | Path | Purpose |
|---|---|---|
| AuthModule | `server/src/modules/auth/` | Customer auth |
| DashboardAuthModule | `server/src/modules/dashboard-auth/` | Franchise auth |
| WalletModule | `server/src/modules/wallet/` | Coin economy |
| GameModule | `server/src/modules/game/` | Mini-games |
| StoreModule | `server/src/modules/store/` | Outlet data |
| RewardModule | `server/src/modules/reward/` | Reward catalog |
| RewardsModule | `server/src/modules/rewards/` | Reward listings |
| RewardProfileModule | `server/src/modules/reward-profile/` | Profile rules |
| RewardRulesModule | `server/src/modules/reward-rules/` | Rule evaluation |
| RewardAssignmentModule | `server/src/modules/reward-assignment/` | Assignment logic |
| RewardOverridesModule | `server/src/modules/reward-overrides/` | Override handling |
| CoinEconomyModule | `server/src/modules/coin-economy/` | Economy-wide ops |
| DashboardRewardsModule | `server/src/modules/dashboard/rewards/` | Admin reward mgmt |
| RewardResolutionModule | `server/src/modules/reward-resolution/` | Resolution pipeline |
| ChallengesModule | `server/src/modules/challenges/` | Challenges (❓) |
| MenuModule | `server/src/modules/menu/` | Menu (🔶) |
| NotificationModule | `server/src/modules/notification/` | Push/email/SMS |
| AuditModule | `server/src/modules/audit/` | Audit logging |
| CustomerBootstrapModule | `server/src/modules/customer-bootstrap/` | First-auth setup |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and working |
| 🔶 | Partially implemented |
| 📋 | Planned but not implemented |
| ⚠️ | Implemented differently from the original spec |
| ❓ | Unconfirmed / not audited |

---

## Important Files

| File | Purpose |
|---|---|
| `server/prisma/schema.prisma` | Database schema (source of truth) |
| `server/src/app.module.ts` | Root module — all 22 feature modules |
| `server/src/main.ts` | Bootstrap config (prefix, versioning, guards) |
| `server/src/config/env.validation.ts` | Required env var schema |
| `client/app/layout.tsx` | Root layout, fonts, metadata |
| `client/app/page.tsx` | Homepage composition |
| `dashboard/app/login/page.tsx` | Franchise dashboard login (only implemented page) |
| `docs/21_Server_Architecture.md` | Geo-personalization design (not yet implemented) |
| `docs/02_UI_Design_System.md` | Design spec (note: font spec differs from code) |

---

## Cookie Names

| Cookie | Who Uses It | Expiry |
|---|---|---|
| `gc_access_token` | Customer frontend | 15 minutes |
| `gc_refresh_token` | Customer frontend | 7 days |
| `gc_dashboard_access_token` | Franchise dashboard | 15 minutes |
| `gc_dashboard_refresh_token` | Franchise dashboard | 7 days |

---

## TransactionSource Values

`GAME_REWARD` · `REFERRAL_BONUS` · `BIRTHDAY_BONUS` · `ANNIVERSARY_BONUS` · `PROMO_CREDIT` · `PURCHASE_REWARD` · `MANUAL_CREDIT` · `WELCOME_BONUS` · `ACHIEVEMENT_REWARD` · `CHALLENGE_REWARD` · `MILESTONE_REWARD` · `EVENT_BONUS` · `REVIEW_REWARD` · `REFERRAL_CODE` · `REWARD_REDEMPTION` · `MANUAL_DEBIT` · `COIN_EXPIRY` · `SYSTEM_ADJUSTMENT`
