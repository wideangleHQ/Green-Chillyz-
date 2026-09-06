# 31. Testing Strategy

## Current State

| Layer | Framework | Status |
|---|---|---|
| Backend unit tests | Jest (via NestJS defaults) | ❓ Unconfirmed coverage level |
| Backend e2e tests | Jest + Supertest | ❓ Unconfirmed |
| Frontend unit tests | Jest + React Testing Library | ❓ Unconfirmed |
| Frontend e2e tests | Playwright / Cypress | ❓ Not found in package.json |
| Load testing | k6 / Artillery | 📋 Not implemented |

> The test infrastructure exists (Jest is installed with NestJS), but test file coverage has not been verified in this audit. Run `find server/src -name "*.spec.ts"` to list existing test files.

---

## Testing Architecture

### Backend (NestJS + Jest)

NestJS generates `*.spec.ts` files alongside services. The standard testing approach:

```typescript
// Unit test — mock dependencies
describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WalletCacheService, useValue: mockCache },
      ],
    }).compile();
    service = module.get(WalletService);
  });
});
```

```typescript
// E2E test — real HTTP
describe('POST /api/v1/auth/register', () => {
  it('returns user and sets cookies', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Test1234!' })
      .expect(201)
      .expect(res => {
        expect(res.headers['set-cookie']).toBeDefined();
      });
  });
});
```

### Frontend (Next.js + Jest)

Standard Next.js testing with React Testing Library:
```typescript
import { render, screen } from '@testing-library/react';

test('renders homepage hero', () => {
  render(<HeroSection />);
  expect(screen.getByRole('heading')).toBeInTheDocument();
});
```

---

## Critical Test Areas

### Must-Test: Financial Operations

Wallet operations are irreversible in production — test these first:

1. **Idempotency:** Same `idempotencyKey` must not credit/debit twice
2. **Concurrent credits:** Two simultaneous requests with different keys must both succeed
3. **Balance atomicity:** `balance` field must stay consistent with `SUM(amount)` in transactions
4. **Expiry:** Expired coins must be deducted correctly

### Must-Test: Auth Flows

1. Registration → login → refresh → logout chain
2. Token family burn on refresh token reuse
3. Dashboard login with wrong code triggers lockout after N attempts
4. Dashboard cookie cannot access customer endpoints
5. Customer cookie cannot access dashboard endpoints

### Must-Test: Game Session Lifecycle

1. Start session → end session → coins credited
2. Daily limit enforced (second session same day rejected)
3. Score validation (above `maxScore` is rejected)

---

## Running Tests

```bash
# Server — unit tests
cd server && bun run test

# Server — e2e tests
cd server && bun run test:e2e

# Server — coverage
cd server && bun run test:cov

# Client
cd client && npm test

# Dashboard
cd dashboard && npm test
```

---

## Testing Environment

E2E tests need a real database and Redis. Use a separate test database — do not run e2e against production.

Recommended: use Supabase's branching feature for a test branch, or spin up a local PostgreSQL container:

```bash
docker run -d \
  -e POSTGRES_DB=gc_test \
  -e POSTGRES_PASSWORD=test \
  -p 5433:5432 \
  postgres:16-alpine
```

Set `DATABASE_URL` in your test environment to point at the test database.
