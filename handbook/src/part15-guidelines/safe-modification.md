# 35. How to Safely Modify the Project

## Before You Change Anything

1. **Read the relevant section of this handbook** to understand what you're touching
2. **Check the SUMMARY.md** for where things live in the codebase
3. **Run `graphify query "<topic>"`** if the graphify knowledge graph is current
4. **Read the existing code** — don't guess at behavior from naming alone

---

## Database Changes — Critical Rules

> These rules protect production data. Violating them has caused production incidents on other projects.

### Rule 1: Use `db push`, never `migrate dev`
```bash
# Safe
bunx prisma db push

# NEVER do these
bunx prisma migrate dev     ← corrupts stale migration history
bunx prisma migrate reset   ← destroys all data
```

### Rule 2: Adding a column
```prisma
// Safe — nullable or with default
model User {
  newField String?           // nullable, no existing rows affected
  otherField String @default("value")  // default, no existing rows affected
}
```

Then `bunx prisma db push`. No data is touched.

### Rule 3: Renaming a column
Do NOT rename a column in the schema and `db push` directly — it will DROP the old column and ADD a new one, losing data.

Safe approach:
1. Add the new column (nullable)
2. Backfill data: write a one-time migration script
3. Make old column nullable (if it was required)
4. Update all code to use new column name
5. Remove old column in a later deploy after confirming no references

### Rule 4: Dropping a column or table
Dangerous in production. Steps:
1. Remove all code references first (deploy that code)
2. Verify no queries use the column in production logs
3. Then drop in schema + `db push`

### Rule 5: Menu tables
`MenuCategory` and `MenuItem` are in the schema but may not be migrated in production. Before using them, confirm with `bunx prisma db push --accept-data-loss` on a dev database and check if the tables get created. Do not assume they exist.

---

## Adding a New Endpoint

1. Create a DTO in `server/src/modules/<module>/dto/`
2. Add the method to the service
3. Add the route to the controller
4. If new auth is required: add `@UseGuards()` and `@Permissions()` decorators
5. Run `bun run start:dev` and verify via Swagger
6. Test the endpoint manually with correct + incorrect inputs

---

## Modifying the Reward Engine

The reward engine (`RewardCampaign` → `RewardHistory`, `RewardProfile` → `ProfileRewardRule`) is the most complex subsystem. Changes here affect coin earning.

Before modifying:
1. Read `part5-coins-rewards/` handbook sections
2. Understand all 18 `TransactionSource` values
3. Write the test scenario first (see [Section 32](../part13-testing/test-scenarios.md))
4. Test idempotency — reward evaluation must be idempotent for the same game session

---

## Frontend Component Changes

Safe approach:
1. Make change in isolation (storybook or isolated page)
2. Check all viewport sizes (mobile 375px, tablet 768px, desktop)
3. Verify dark/light theme if applicable
4. Check animations still work (`lenis` scroll, GSAP triggers, Framer Motion)
5. Verify `next build` succeeds (no TypeScript errors)

---

## What NOT to Do

| Don't | Why |
|---|---|
| `prisma migrate dev` | Stale migration history — will corrupt |
| Direct SQL UPDATE on `Wallet.balance` | Must go through `WalletService` for cache invalidation |
| Skip idempotency key on wallet operations | Risk of double-crediting |
| Add `console.log` and commit | Use `Logger` service; remove debug logs |
| Commit `.env` files | Contains secrets |
| Change `gc_access_token` cookie name | Frontend and CORS config depend on it |
| Change the `/api/v1/` prefix | All frontend API calls are hardcoded to this |
