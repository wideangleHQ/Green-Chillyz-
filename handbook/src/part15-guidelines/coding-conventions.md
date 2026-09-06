# 37. Coding Conventions

## Backend (NestJS + TypeScript)

### File naming
```
module.module.ts          ← NestJS module
module.controller.ts      ← HTTP layer
module.service.ts         ← Business logic
module.service.spec.ts    ← Unit test
dto/create-thing.dto.ts   ← Input DTO
dto/update-thing.dto.ts   ← Partial update DTO
constants/index.ts        ← Permission constants, enum maps
```

### Module structure
```
modules/wallet/
├── wallet.module.ts
├── wallet.controller.ts
├── wallet.service.ts
├── wallet-cache.service.ts   ← Cache layer separated from main service
├── dto/
│   ├── credit-wallet.dto.ts
│   └── debit-wallet.dto.ts
└── constants/
    └── index.ts              ← WALLET_PERMISSIONS, TransactionSource map
```

### Service conventions
- Services receive `userId` from the guard/controller — never from the request body
- All database writes that affect wallet must go through `WalletService` (not direct Prisma calls)
- Cache invalidation must happen in the service method (not in controllers)

### DTO conventions
```typescript
import { IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;
}
```

### Guard placement
```typescript
// Order matters — guards run in order
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(GAME_PERMISSIONS.GAME_ANALYTICS)
@Get(':id/stats')
async getStats() {}
```

### Error handling
Use NestJS built-in exceptions:
```typescript
throw new NotFoundException('Game not found');
throw new ConflictException('Username already taken');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
```

Do not throw raw `Error` objects from services — they hit `GlobalExceptionFilter` and return 500.

---

## Frontend (Next.js + TypeScript)

### File naming
```
app/page.tsx                  ← Page (App Router)
app/layout.tsx                ← Layout
app/(auth)/login/page.tsx     ← Route group (doesn't affect URL)
components/ui/Button.tsx      ← PascalCase for components
hooks/useWallet.ts            ← camelCase with `use` prefix for hooks
lib/api.ts                    ← Utilities, API client
types/index.ts                ← Shared TypeScript types
```

### Component conventions
```tsx
// Prefer named exports over default for non-page components
export function Button({ label, onClick }: ButtonProps) {}

// Pages use default export (Next.js requirement)
export default function HomePage() {}
```

### API calls
All API calls go through a shared axios instance configured in `lib/api.ts` (or equivalent). Never use `fetch` directly in components — keep API logic in hooks or service files.

```typescript
// In a custom hook
export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => api.get('/wallet/me/balance').then(r => r.data),
    staleTime: 1000 * 60, // 1 minute
  });
}
```

### TypeScript strictness
- `noImplicitAny: true` — always type your variables
- Never use `any` — use `unknown` and type-narrow, or define the type
- `?.` optional chaining preferred over null checks for API response fields

---

## Shared Conventions

### No magic strings — use constants
```typescript
// Bad
if (transaction.source === 'GAME_REWARD') {}

// Good
import { TransactionSource } from '../constants';
if (transaction.source === TransactionSource.GAME_REWARD) {}
```

### Idempotency keys
Always pass a UUID idempotency key for wallet operations:
```typescript
const idempotencyKey = `game-reward-${sessionId}`;
```

Format convention: `<source>-<entity-id>` — deterministic so the same operation always produces the same key.

### Logging
Backend: use `Logger` from `@nestjs/common`, not `console.log`.
Frontend: use `console.error` for actual errors in production; strip debug `console.log` before committing.

### Comments
Only when the WHY is non-obvious. Never explain what the code does — the code does that. Document constraints, workarounds, and external dependencies.
