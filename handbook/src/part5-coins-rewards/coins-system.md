# 15. Coins System

## Overview

The Coins system is the loyalty economy of the GreenChillyz platform. Every customer has a **Wallet** with a coin balance. Coins are earned through game play, reward events, and campaigns. They are spent by redeeming rewards (vouchers) at outlets.

## Data Model

### Wallet
```
Wallet
├── id (UUID)
├── userId (1:1 with User)
├── balance (Decimal 12,2)           ← Current spendable balance
├── pendingBalance (Decimal 12,2)    ← Reserved/pending coins
├── lifetimeEarned (Decimal 12,2)    ← Total ever earned (denormalized)
├── lifetimeSpent (Decimal 12,2)     ← Total ever spent (denormalized)
├── lifetimeExpired (Decimal 12,2)   ← Total expired (denormalized)
└── isActive
```

### WalletTransaction
Every coin movement creates an immutable transaction record:
```
WalletTransaction
├── id (UUID)
├── walletId
├── type: CREDIT | DEBIT | REFUND | EXPIRE | ADJUSTMENT
├── source: GAME_REWARD | BIRTHDAY_REWARD | SIGNUP_BONUS | ... (17 sources)
├── status: PENDING | COMPLETED | FAILED | REVERSED
├── amount (Decimal 12,2)
├── balanceBefore, balanceAfter      ← Point-in-time snapshots
├── description
├── idempotencyKey (unique)          ← Duplicate prevention
├── referenceId, referenceType       ← Links to game session, redemption, etc.
├── expiresAt, expiredAt             ← Coin expiry tracking
├── ipAddress, deviceInfo
└── metadata (JSONB)
```

## Wallet API

**Controller:** `server/src/modules/wallet/wallet.controller.ts`

```
GET  /api/v1/wallet/me               → My wallet summary (balance + stats)
GET  /api/v1/wallet/me/balance       → Just my current balance
GET  /api/v1/wallet/me/transactions  → My transaction history (paginated)

GET  /api/v1/wallet/user/:userId     → Any user's wallet (admin only)
GET  /api/v1/wallet/user/:userId/transactions → Any user's history (admin)

POST /api/v1/wallet/credit           → Credit coins (admin only)
POST /api/v1/wallet/debit            → Debit coins (admin only)
POST /api/v1/wallet/expire           → Run coin expiration (admin/cron)
```

## Permissions

| Operation | Required Permission |
|---|---|
| View own wallet | Authenticated (any user) |
| View any user wallet | `WALLET_PERMISSIONS.VIEW_ANY` |
| Credit coins | `WALLET_PERMISSIONS.CREDIT` |
| Debit coins | `WALLET_PERMISSIONS.DEBIT` |
| Run expiration | `WALLET_PERMISSIONS.ADJUST` |

## Idempotency

Every `credit` and `debit` operation accepts an `idempotencyKey`. If the same key is submitted twice, the second call returns the result of the first without creating a new transaction. This protects against:
- Network retries
- Duplicate job execution
- Race conditions in BullMQ queue delivery

## Transaction Sources

The `TransactionSource` enum defines 18 sources for auditing and analytics:

| Source | When Used |
|---|---|
| `GAME_REWARD` | Player completes a game session |
| `SIGNUP_BONUS` | New customer registers (if campaign active) |
| `REFERRAL_BONUS` | Referred customer registers |
| `BIRTHDAY_REWARD` | Customer's birthday (if campaign configured) |
| `ANNIVERSARY_REWARD` | Customer account anniversary |
| `REVIEW_REWARD` | Customer submits a review |
| `PROMO_CODE` | Promo code redemption |
| `STORE_VISIT` | Customer checks in at a store |
| `CHECK_IN_REWARD` | Check-in reward event |
| `CAMPAIGN_REWARD` | General campaign reward |
| `LOYALTY_TIER` | Tier upgrade bonus |
| `ORDER_CASHBACK` | Post-purchase cashback |
| `REWARD_REDEMPTION` | Debit when customer redeems a reward |
| `ORDER_PAYMENT` | Debit when coins used for payment |
| `ADMIN_ADJUSTMENT` | Manual adjustment by admin |
| `EXPIRATION` | Expired coins removed |
| `REFUND` | Reversed transaction |
| `SYSTEM_REWARD` | System-generated reward |

## Coin Expiry

Coins can have an `expiresAt` date set on the `WalletTransaction`. The `POST /api/v1/wallet/expire` endpoint (admin/cron) scans for expired transactions and credits negative `EXPIRE` transactions to reduce the balance. The `WalletCacheService` caches balance reads to reduce database load.

## Balance Calculation

The wallet `balance` field is maintained denormalised for fast reads. Every credit/debit operation:
1. Reads current balance (`balanceBefore`)
2. Computes `balanceAfter = balanceBefore ± amount`
3. Writes the `WalletTransaction` with both snapshots
4. Updates `Wallet.balance` to `balanceAfter`

This is done within a Prisma transaction to ensure atomicity.
