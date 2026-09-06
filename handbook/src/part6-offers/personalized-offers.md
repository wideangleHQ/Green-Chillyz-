# 19. Personalized & Birthday Offers

## Birthday & Anniversary Offers

The platform's data model supports birthday and anniversary rewards via:

1. **CustomerProfile.dateOfBirth** — stored when customer registers or updates profile
2. **TransactionSource.BIRTHDAY_REWARD** — distinct source for birthday coin credits
3. **TransactionSource.ANNIVERSARY_REWARD** — for account anniversary
4. **RewardEventType.BIRTHDAY** and **RewardEventType.ANNIVERSARY** — campaign event types

### Current Status: 📋 Planned

The `TransactionSource` and `RewardEventType` enums define the birthday/anniversary workflow, and `CustomerProfile.dateOfBirth` captures the required data. However, **no birthday trigger service or cron job** has been found in the current backend modules. This is a planned feature that requires:
- A scheduled job (cron) to identify customers with upcoming birthdays
- Trigger `BIRTHDAY_REWARD` transactions via the wallet/reward engine
- Optionally: send notifications via `NotificationService`

## Geo-Personalized Offers

Per `docs/21_Server_Architecture.md`, the intended design is:

```
Customer visits greenchillyz.com
  → Browser Geolocation API called
  → POST /api/v1/geo/resolve { latitude, longitude, source: "gps" }
  → Backend resolves nearest outlet
  → Returns personalized bundle including outlet-specific offers
```

### Current Status: 📋 Planned

The `geo` module is **not present** in `server/src/modules/`. The homepage `OffersSection` currently shows static or all-store offers.

## Outlet-Specific Personalization

When the geo-personalization engine is implemented, personalization will work as follows:

```
1. Customer's nearest outlet determined (Haversine formula)
2. Query: active StoreVouchers for that outlet
3. Query: active Rewards with store availability for that outlet
4. Return combined personalized offer bundle
5. Cache per outlet: Redis key homepage:outlet:{id} (TTL 30 min)
```

## Referral Offers

The referral system is partially modelled:
- `CustomerProfile.referralCode` (unique per customer)
- `CustomerProfile.referredById` (who referred this customer)
- `TransactionSource.REFERRAL_BONUS` (source enum exists)
- `RewardEventType.REFERRAL_COMPLETED` (event type exists)

**Status:** 🔶 Data model ready; referral trigger logic implementation status unconfirmed.

## Reward Profile Milestones

`RewardProfile` + `ProfileRewardRule` enables milestone-based rewards:

```
Profile: "Standard Loyalty"
  Rule 1: coinRequirement: 100  → rewardType: VOUCHER → rewardReference: "free-appetizer"
  Rule 2: coinRequirement: 500  → rewardType: COIN_BONUS → 50 bonus coins
  Rule 3: coinRequirement: 1000 → rewardType: VIP_REWARD → premium gift
```

When a customer reaches a coin milestone (tracked via `WalletTransaction.lifetimeEarned`), the `RewardResolutionModule` identifies the applicable rule and triggers the reward.

The store receives a `RewardAssignment` linking it to a `RewardProfile`. `RewardOverride` allows per-store rule customization without modifying the base profile.
