# 18. Offers System

## Two Distinct Offer Types

The platform has two separate offer systems that serve different purposes:

| System | Model | Use Case | Creator |
|---|---|---|---|
| **Store Vouchers** | `StoreVoucher` | Outlet-specific promotional vouchers (e.g., "20% off this weekend") | Franchise / Admin |
| **Reward Catalog** | `Reward` | Coin-redeemable rewards (e.g., "Free Burger for 100 coins") | Admin |

## Store Voucher System

### Data Model
```
StoreVoucher
├── storeId (scoped to one outlet)
├── name, shortTitle, description
├── offerTag, discountBadge
├── offerImage, bannerImage
├── couponCode (unique)
├── voucherType: PERCENTAGE | FLAT_DISCOUNT | FREE_ITEM | COMBO | 
│               FREE_BEVERAGE | GIFT | COIN_VOUCHER
├── minimumOrderValue, maximumDiscount, voucherValue
├── itemsIncluded, redeemVenue
├── validDays (JSONB), startDate, endDate, validTime
├── totalLimit, remainingCount, redeemedCount
├── status: DRAFT | ACTIVE | EXPIRED | PAUSED | ARCHIVED
├── isFeatured, priority, sortOrder
└── terms (JSONB)
```

### Voucher Lifecycle
```
Franchise creates voucher (status: DRAFT)
    ↓
Franchise/Admin activates (status: ACTIVE)
    ↓
Voucher appears on public website (OffersSection)
    ↓
Customer presents coupon code at outlet
    ↓
Staff marks as redeemed (StoreVoucherRedemption created)
    ↓
remainingCount decremented
    ↓
Voucher expires or reaches totalLimit → status: EXPIRED/ARCHIVED
```

### Audit Trail
Every status change on a `StoreVoucher` creates a `StoreVoucherHistory` record with:
- `action` (created, activated, paused, etc.)
- `changes` (JSONB diff)
- `performedBy`

## Reward Catalog System

### Data Model
```
Reward
├── title, slug (unique)
├── description, shortDescription
├── image, bannerImage
├── categoryId → RewardCategory
├── brandId → Brand
├── coinCost (int)           ← Coins required to redeem
├── cashAmount (Decimal)     ← Equivalent cash value (display)
├── rewardType: FREE_ITEM | DISCOUNT | BUY_ONE_GET_ONE | CASHBACK | 
│              COUPON | PARTNER | GIFT | FESTIVAL | LIMITED_TIME | CUSTOM
├── availability: GLOBAL | BRAND_SPECIFIC | STORE_SPECIFIC | 
│                CAMPAIGN_SPECIFIC | LOCATION_SPECIFIC
├── status: DRAFT | SCHEDULED | PUBLISHED | PAUSED | SOLD_OUT | ARCHIVED
├── priority, isFeatured
├── stock, dailyLimit, userLimit
├── minimumLoyaltyTier
├── campaignId → RewardCampaign
├── voucherValidDays (default 30)
├── validFrom, validUntil
└── terms
```

### Reward Store Availability
Rewards with `availability: STORE_SPECIFIC` are linked to specific stores via `RewardStoreAvailability`:
```
RewardStoreAvailability
├── rewardId, storeId
└── isActive
```

### Redemption Flow
```
Customer browses /rewards page
    ↓
Selects a reward (e.g., "Free Burger — 100 coins")
    ↓
POST /api/v1/rewards/:id/redeem
{
  storeId: "...",
  idempotencyKey: "redeem-<uuid>"
}
    ↓
RewardModule validates:
  - Customer has sufficient balance
  - Reward is PUBLISHED and within validity window
  - Stock/daily/user limits not exceeded
  - Customer meets minimumLoyaltyTier
    ↓
WalletService.debit(100 coins, REWARD_REDEMPTION)
    ↓
RewardRedemption created { status: COMPLETED }
    ↓
RewardVoucher created {
  code: unique 32-char code,
  signature: HMAC(code + rewardId + userId),
  expiresAt: now + voucherValidDays,
  status: ACTIVE
}
    ↓
Customer presents voucher code at outlet
    ↓
Staff verifies via dashboard
    ↓
RewardVoucher { status: USED, redeemedAt }
```

## Public Offer Discovery

The `OffersSection` on the homepage shows featured vouchers and rewards. Endpoints:

```
GET /api/v1/rewards           → Active/published rewards (public)
GET /api/v1/rewards/:idOrSlug → Reward detail (public)
GET /api/v1/stores/:id/vouchers → Store-specific vouchers (public)
```

## Campaign-Based Rewards

`RewardCampaign` powers event-driven coin earning (not direct redemption):
- `status: ACTIVE`, within `startsAt`–`endsAt` window
- Triggered by events: `GAME_COMPLETED`, `BIRTHDAY`, `STORE_VISIT`, etc.
- Computes coins via `baseCoins × multiplier + bonusCoins`
- Subject to `maxClaims`, `dailyLimit`, `totalBudget` caps
