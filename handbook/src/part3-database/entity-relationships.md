# 9. Entity Relationship Overview

## Core Entity Map

```
Brand ──────────────────────────────────────┐
  │                                          │
  ├─── Store (many per brand)                │
  │      │                                   │
  │      ├─── StoreGallery                   │
  │      ├─── StoreTiming (7 rows/store)     │
  │      ├─── StoreHoliday                   │
  │      ├─── StoreFacility                  │
  │      ├─── StoreManager → User            │
  │      ├─── StoreAnnouncement              │
  │      ├─── DashboardSession               │
  │      ├─── DashboardRefreshToken          │
  │      ├─── CustomerProfile (assigned)     │
  │      ├─── RewardStoreAvailability        │
  │      ├─── RewardAssignment               │
  │      ├─── RewardOverride                 │
  │      ├─── StoreVoucher                   │
  │      └─── AuditLog                       │
  │                                          │
  ├─── Reward (brand-specific rewards)       │
  ├─── MenuCategory (brand-specific)         │
  └─── MenuItem (brand-specific)             │
                                             │
User ──────────────────────────────────────┐ │
  │                                        │ │
  ├─── CustomerProfile ───────────────────→┘ │
  │      └─── CustomerStoreHistory           │
  ├─── StaffProfile ──────────────────────→──┘
  ├─── UserRole → Role → RolePermission → Permission
  ├─── RefreshToken
  ├─── UserDevice
  ├─── LoginHistory
  ├─── Otp
  ├─── Wallet
  │      └─── WalletTransaction
  ├─── GameSession → Game
  ├─── RewardRedemption → Reward
  │      └─── RewardVoucher
  ├─── RewardHistory → RewardCampaign
  │      └─── RewardRule
  ├─── Notification
  │      └─── NotificationDeliveryLog
  └─── AuditLog
```

## Key Relationships Explained

### User → CustomerProfile (1:1)
Every registered customer has exactly one `CustomerProfile`. The profile stores:
- `assignedStoreId` — the outlet this customer is "home" to (used for personalization and redemption)
- `dateOfBirth`, `gender` — for birthday/anniversary offers
- `referralCode` (unique), `referredById` — referral chain

### User → Wallet (1:1)
Every customer has one wallet. The wallet carries denormalised totals:
- `balance` — current spendable balance
- `lifetimeEarned`, `lifetimeSpent`, `lifetimeExpired` — immutable ledger summaries

Every coin movement creates a `WalletTransaction` row. The balance is the sum of all `CREDIT` minus all `DEBIT`/`EXPIRE` transactions. The `WalletTransaction.idempotencyKey` prevents duplicates.

### Store → DashboardSession (1:many)
The **store itself** is the dashboard principal — not a human user. Dashboard sessions belong to a store. Multiple sessions per store are allowed (multiple devices/tabs).

### Game → GameSession (1:many)
`Game` is the configuration record (slug, daily limits, cooldown, reward config). `GameSession` is each play instance with lifecycle state (`CREATED → STARTED → PLAYING → COMPLETED/REWARDED`).

### Reward → RewardRedemption → RewardVoucher (chain)
When a customer redeems a reward:
1. `RewardRedemption` created (records coins spent, idempotency key)
2. `RewardVoucher` created (unique code, signature, expiry)
3. Customer uses the voucher code at the outlet

### RewardCampaign → RewardHistory (event-based earning)
`RewardCampaign` defines the coin-earning rules for events (GAME_COMPLETED, BIRTHDAY, etc.). Each time a reward is evaluated, a `RewardHistory` row is created recording what was (or wasn't) granted and why.

### RewardProfile → ProfileRewardRule → Reward (milestone system)
`RewardProfile` groups milestone rules. Each `ProfileRewardRule` defines what reward is triggered when a customer reaches a coin threshold. Profiles can be assigned to stores via `RewardAssignment`.

### StoreVoucher (Promotional Vouchers)
`StoreVoucher` is separate from `Reward`/`RewardVoucher`. It represents outlet-level promotional vouchers (e.g., "20% off this weekend") with coupon codes, redemption counts, and validity windows. Redeemed via `StoreVoucherRedemption`.

## Enum Reference

| Enum | Values | Used In |
|---|---|---|
| `TransactionType` | CREDIT, DEBIT, REFUND, EXPIRE, ADJUSTMENT | WalletTransaction |
| `TransactionSource` | ORDER_CASHBACK, REFERRAL_BONUS, SIGNUP_BONUS, REVIEW_REWARD, PROMO_CODE, ADMIN_ADJUSTMENT, ORDER_PAYMENT, EXPIRATION, REFUND, LOYALTY_TIER, GAME_REWARD, BIRTHDAY_REWARD, ANNIVERSARY_REWARD, STORE_VISIT, CHECK_IN_REWARD, CAMPAIGN_REWARD, SYSTEM_REWARD, REWARD_REDEMPTION | WalletTransaction |
| `RewardEventType` | GAME_COMPLETED, REFERRAL_COMPLETED, PURCHASE_COMPLETED, FIRST_PURCHASE, BIRTHDAY, ANNIVERSARY, LOYALTY_UPGRADE, STORE_VISIT, CHECK_IN, ADMIN_BONUS, CAMPAIGN, SYSTEM, CUSTOM_EVENT | RewardCampaign, RewardHistory |
| `GameSessionStatus` | CREATED, STARTED, PLAYING, COMPLETED, FAILED, EXPIRED, ABANDONED, REWARDED | GameSession |
| `RewardType` | FREE_ITEM, DISCOUNT, BUY_ONE_GET_ONE, CASHBACK, COUPON, PARTNER, GIFT, FESTIVAL, LIMITED_TIME, CUSTOM | Reward |
| `VoucherStatus` | ACTIVE, USED, EXPIRED, CANCELLED, INVALID | RewardVoucher |
| `StoreVoucherType` | PERCENTAGE, FLAT_DISCOUNT, FREE_ITEM, COMBO, FREE_BEVERAGE, GIFT, COIN_VOUCHER | StoreVoucher |
| `StoreManagerRole` | MANAGER, SUPERVISOR, STAFF | StoreManager |
| `AuditActorType` | CUSTOMER, EMPLOYEE, STORE_MANAGER, CORPORATE_ADMIN, SUPER_ADMIN, SYSTEM, BACKGROUND_JOB | AuditLog |
| `NotificationChannel` | IN_APP, PUSH, EMAIL, WHATSAPP, SMS, WEBHOOK | Notification |
| `FoodType` | VEG, NON_VEG, EGG | MenuItem |
