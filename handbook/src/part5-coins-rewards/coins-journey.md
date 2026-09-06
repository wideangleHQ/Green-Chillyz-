# 16. Complete Coins Journey

## End-to-End Flow

```
Customer Registers
        │
        ▼
CustomerBootstrapModule runs
  → Creates Wallet (balance: 0)
  → Creates CustomerProfile (assignedStoreId)
  → Issues SIGNUP_BONUS if campaign active
        │
        ▼
Customer plays a game on /games
  → POST /api/v1/games/sessions/start { gameId }
  → GameSessionService checks daily limit + cooldown
  → Creates GameSession { status: STARTED }
        │
        ▼
Customer completes the game
  → POST /api/v1/games/sessions/end { sessionId, score }
  → GameSessionService validates session ownership
  → Server-side validates outcome (score bounds, timing)
  → RewardEngineService.evaluateReward() called
        │
        ▼
Reward Evaluation (RewardEngineService)
  → Queries active RewardCampaign for GAME_COMPLETED event
  → Checks campaign: store eligibility, brand eligibility, daily limit, budget
  → Applies rules (RewardRule): multipliers, bonus coins
  → Computes final coin amount (baseCoins × multiplier + bonusCoins)
  → Records RewardHistory (granted: true/false, reason)
        │
        ▼
Coins Credited (WalletService.credit)
  → Creates WalletTransaction {
      type: CREDIT,
      source: GAME_REWARD,
      amount: 50,  (example)
      idempotencyKey: "game:<sessionId>",
      balanceBefore: 0,
      balanceAfter: 50
    }
  → Updates Wallet.balance to 50
  → Updates Wallet.lifetimeEarned
        │
        ▼
NotificationService triggered
  → Creates Notification { type: GAME, title: "You won 50 coins!" }
  → Queues delivery (BullMQ) via NotificationListener
        │
        ▼
Customer balance now: 50 coins
  GET /api/v1/wallet/me/balance → { balance: 50.00 }
        │
        ▼
Customer visits physical outlet
  → Staff opens Franchise Dashboard
  → Staff enters customer's phone number or reference
  → Dashboard calls: POST /api/v1/dashboard/rewards/redeem
        │
        ▼
Dashboard Redemption Flow
  → Customer authenticated by phone lookup
  → Verifies customer is assigned to this store
  → Customer selects a Reward (e.g., "Free Burger" costing 40 coins)
  → RewardRedemption created:
      { rewardId, userId, storeId, coinsSpent: 40, idempotencyKey: "redeem:<uuid>" }
  → WalletService.debit():
      WalletTransaction { type: DEBIT, source: REWARD_REDEMPTION, amount: 40 }
  → Wallet.balance decreases from 50 to 10
  → RewardVoucher created (unique code + HMAC signature, expires in 30 days)
        │
        ▼
Staff marks voucher as used
  → Updates RewardVoucher { status: USED, redeemedAt }
  → Customer receives their free burger
        │
        ▼
Customer balance: 10 coins remaining
  → Customer returns next visit, earns more coins
  → Cycle continues
```

## Technical Touchpoints

| Step | Module | Key Entity |
|---|---|---|
| Registration | `CustomerBootstrapModule` | `User`, `CustomerProfile`, `Wallet` |
| Game start | `GameModule` → `GameSessionService` | `GameSession` |
| Game end + reward | `GameModule` → `RewardEngineService` | `GameSession`, `RewardHistory` |
| Coin credit | `WalletModule` → `WalletService` | `WalletTransaction`, `Wallet` |
| Balance query | `WalletModule` → `WalletCacheService` | `Wallet` |
| Redemption | `DashboardModule` → `DashboardRewardsModule` | `RewardRedemption`, `RewardVoucher` |
| Voucher use | `DashboardModule` | `RewardVoucher` |

## Anti-Abuse Mechanisms

| Mechanism | Where Implemented |
|---|---|
| Daily game play limit | `GameSession` check against daily count (Redis) |
| Game cooldown period | `Game.cooldown` field, checked per user |
| Idempotency key | `WalletTransaction.idempotencyKey` — prevents duplicate credits |
| Server-side score validation | `GameSessionService.endSession()` — never trusts client score |
| Campaign budget cap | `RewardCampaign.totalBudget`, `maxClaims`, `dailyLimit` |
| Duplicate redemption prevention | `RewardRedemption.idempotencyKey` unique constraint |
| Voucher signature | `RewardVoucher.signature` (HMAC) — prevents forgery |

## Coin Expiry

If `WalletTransaction.expiresAt` is set (controlled by `RewardCampaign.coinExpiryDays`), the expiry cron runs `POST /api/v1/wallet/expire` and debits expired coins with `source: EXPIRATION`.
