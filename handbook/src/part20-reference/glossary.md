# 50. Glossary

## Business Terms

**Brand** — One of the three restaurant concepts under the GreenChillyz group: GreenChillyz, YellowChillyz, GoldenChillyz. Each brand has its own visual identity and can have multiple outlets.

**Coin** — The loyalty currency. Customers earn coins by playing games or through reward campaigns. Coins are redeemed for rewards. 1 coin ≠ 1 rupee — the exchange rate is campaign-defined.

**Outlet / Store** — A physical franchise restaurant location. Managed by a franchise operator via the franchise dashboard.

**Franchise Operator** — The person/organization that operates a store. They use a shared store access code to log in to the franchise dashboard.

**Voucher** — A redeemable code that grants a discount or free item. Two types: `StoreVoucher` (created by franchise) and `RewardVoucher` (issued on reward redemption).

**Reward Catalog** — The list of rewards customers can redeem coins for. Managed by admins.

**Campaign** — A time-limited or condition-based rule that determines how many coins a customer earns. Example: "Play any game during Diwali and earn 2x coins."

**Reward Profile** — A collection of rules that determine milestone-based rewards for customers. Example: "First purchase → 50 bonus coins."

---

## Technical Terms

**argon2** — Password hashing algorithm (argon2id variant). Used for customer passwords and franchise store codes. Resistant to GPU brute-force attacks.

**Blind index** — An HMAC of a secret value, used to enable equality-based database lookups on hashed/encrypted data without revealing the plaintext. Used for franchise store code lookups.

**BullMQ** — Job queue library built on Redis. Used for async operations: email, SMS, push, coin expiry.

**Denormalized balance** — `Wallet.balance` stores the current coin balance directly rather than requiring a `SUM()` query on all transactions. Updated atomically on every credit/debit.

**Framer Motion** — React animation library. Used for component enter/exit animations and micro-interactions.

**GSAP (GreenSock Animation Platform)** — JavaScript animation library. Used with `ScrollTrigger` for scroll-driven section reveals.

**HttpOnly cookie** — A browser cookie that JavaScript cannot read. Used for auth tokens (`gc_access_token`, `gc_refresh_token`, `gc_dashboard_access_token`, `gc_dashboard_refresh_token`) to prevent XSS token theft.

**Idempotency key** — A unique identifier on a wallet transaction that prevents duplicate processing. Same key = same operation, can safely retry without double-crediting.

**ioredis** — Node.js Redis client library. Used for caching and as the BullMQ transport.

**JWT (JSON Web Token)** — Signed token containing the user's identity (`sub` = userId) and metadata. Verified on every authenticated request.

**Lenis** — Smooth scroll library. Replaces native scroll with a physics-based interpolated version.

**Prisma** — TypeScript ORM used for database queries. `PrismaService` is the central god-node of the backend dependency graph.

**Token family** — A group of refresh tokens issued from the same initial login. If any token in the family is detected as reused (possible theft), the entire family is invalidated (burned).

---

## Abbreviations

| Abbreviation | Meaning |
|---|---|
| APM | Application Performance Monitoring |
| CLS | Cumulative Layout Shift (Core Web Vital) |
| DTO | Data Transfer Object (input validation class) |
| INP | Interaction to Next Paint (Core Web Vital) |
| JWT | JSON Web Token |
| LCP | Largest Contentful Paint (Core Web Vital) |
| ORM | Object-Relational Mapper |
| OTP | One-Time Password |
| PITR | Point-In-Time Recovery (database backup type) |
| R2 | Cloudflare R2 (object storage service) |
| RSC | React Server Component |
| TTL | Time To Live (cache expiry duration) |
| UUID | Universally Unique Identifier |

---

## Cookie Names

| Cookie | Scope | Purpose |
|---|---|---|
| `gc_access_token` | Customer | Customer JWT access token (15 min) |
| `gc_refresh_token` | Customer | Customer refresh token (7 days) |
| `gc_dashboard_access_token` | Dashboard | Franchise JWT access token (15 min) |
| `gc_dashboard_refresh_token` | Dashboard | Franchise refresh token (7 days) |

---

## Table Name Reference

| Model Name | Database Table | Notes |
|---|---|---|
| `User` | `User` | Core customer account |
| `CustomerProfile` | `CustomerProfile` | Extended customer data |
| `Wallet` | `Wallet` | Coin balance container |
| `WalletTransaction` | `WalletTransaction` | All coin movements |
| `Game` | `Game` | Game configuration |
| `GameSession` | `GameSession` | Individual play instance |
| `Store` | `Store` | Franchise outlet |
| `Brand` | `Brand` | Restaurant brand |
| `Reward` | `Reward` | Redeemable reward |
| `RewardRedemption` | `RewardRedemption` | Redemption record |
| `RewardVoucher` | `RewardVoucher` | Issued voucher |
| `RewardCampaign` | `RewardCampaign` | Coin-earning rule set |
| `DashboardSession` | `DashboardSession` | Franchise login session |
| `AuditLog` | `AuditLog` | Action audit trail |
| `MenuCategory` | `MenuCategory` | Menu (NOT YET MIGRATED) |
| `MenuItem` | `MenuItem` | Menu item (NOT YET MIGRATED) |
