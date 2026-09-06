# 38. How to Add a New Feature

This guide walks through adding a complete feature end-to-end. Example: adding a "Referral" system.

---

## Step 1 — Plan the Data Model

Add to `server/prisma/schema.prisma`:
```prisma
model Referral {
  id          String    @id @default(uuid())
  referrerId  String
  refereeId   String
  status      ReferralStatus @default(PENDING)
  rewardedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  referrer    User @relation("ReferrerReferrals", fields: [referrerId], references: [id])
  referee     User @relation("RefereeReferral", fields: [refereeId], references: [id])

  @@unique([refereeId])  // one referral per new user
  @@index([referrerId])
}

enum ReferralStatus {
  PENDING
  COMPLETED
  REWARDED
}
```

Push to database:
```bash
cd server && bunx prisma db push && bunx prisma generate
```

---

## Step 2 — Create the NestJS Module

```bash
# Scaffold with NestJS CLI (optional)
bunx nest generate module referral
bunx nest generate service referral
bunx nest generate controller referral
```

Or create manually:
```
server/src/modules/referral/
├── referral.module.ts
├── referral.controller.ts
├── referral.service.ts
└── dto/
    ├── create-referral.dto.ts
    └── referral-response.dto.ts
```

---

## Step 3 — Implement the Service

```typescript
// referral.service.ts
@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async claimReferralReward(referrerId: string, refereeId: string): Promise<void> {
    const referral = await this.prisma.referral.findFirst({
      where: { refereeId, status: 'COMPLETED' },
    });
    if (!referral) throw new NotFoundException('No eligible referral');

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'REWARDED', rewardedAt: new Date() },
    });

    // Credit via WalletService — not direct Prisma
    await this.walletService.credit({
      userId: referrerId,
      amount: 100,  // referral bonus
      source: TransactionSource.REFERRAL_BONUS,
      idempotencyKey: `referral-reward-${referral.id}`,
    });
  }
}
```

---

## Step 4 — Implement the Controller

```typescript
// referral.controller.ts
@ApiTags('referrals')
@Controller({ path: 'referrals', version: '1' })
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('claim')
  @ApiOperation({ summary: 'Claim referral reward' })
  async claimReward(@CurrentUser() user: JwtPayload) {
    return this.referralService.claimReferralReward(user.sub, ...);
  }
}
```

---

## Step 5 — Register the Module

Add to `server/src/app.module.ts`:
```typescript
import { ReferralModule } from './modules/referral/referral.module';

@Module({
  imports: [
    // ... existing modules
    ReferralModule,
  ],
})
export class AppModule {}
```

---

## Step 6 — Add Permissions (if admin-only)

In `referral/constants/index.ts`:
```typescript
export const REFERRAL_PERMISSIONS = {
  VIEW_ALL: 'referral:view:all',
  MANAGE: 'referral:manage',
};
```

Seed these permissions into the `Permission` table (one-time setup via Prisma Studio or a seed script).

---

## Step 7 — Frontend Integration

1. Add API function in `client/lib/api/referrals.ts`
2. Create React Query hook in `client/hooks/useReferral.ts`
3. Build the UI component
4. Add route in `client/app/referrals/page.tsx`

---

## Step 8 — Test

1. Write test scenarios (see [Section 32](../part13-testing/test-scenarios.md) for pattern)
2. Test via Swagger first
3. Test idempotency if coins are involved
4. Test auth (what happens if unauthenticated?)

---

## Checklist

```
[ ] Schema updated and db pushed
[ ] Prisma client regenerated  
[ ] Module/service/controller created
[ ] Module registered in AppModule
[ ] Auth guards applied
[ ] DTOs have class-validator decorators
[ ] Swagger @ApiTags and @ApiOperation added
[ ] Tested via Swagger
[ ] Frontend hook + component created (if applicable)
[ ] Idempotency key used for any wallet operation
```
