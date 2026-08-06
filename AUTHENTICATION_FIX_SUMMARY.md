# Authentication Issue Resolution: 401 Unauthorized for Reward Catalog

## Problem Analysis
### Root Cause
The POST `/api/v1/rewards-catalog` endpoint was returning **401 Unauthorized** for authenticated Dashboard users because:
1. **Endpoint used wrong authentication system**: The `/api/v1/rewards-catalog` controller uses `JwtAuthGuard` which authenticates **customers**, not Dashboard users
2. **Cookie mismatch**: Customer authentication looks for `gc_access_token` cookie, but Dashboard sends `gc_dashboard_access_token`
3. **Strategy mismatch**: `JwtAuthGuard` uses Passport strategy `'jwt'`, but Dashboard authentication uses `'dashboard-jwt'` strategy
### Authentication Architecture
The GreenChillyz backend has **TWO SEPARATE** authentication systems:
#### 1. Customer Authentication
- **Guard**: `JwtAuthGuard` (extends `AuthGuard('jwt')`)
- **Strategy**: `'jwt'` (defined in `server/src/modules/auth/strategies/jwt.strategy.ts`)
- **Cookie**: `gc_access_token`
- **Used by**: Mobile app customers, web customers
- **Endpoints**: `/api/v1/rewards-catalog`, `/api/v1/wallet`, `/api/v1/game`, etc.
#### 2. Dashboard Authentication
- **Guard**: `DashboardAuthGuard` → `DashboardJwtGuard` (extends `AuthGuard('dashboard-jwt')`)
- **Strategy**: `'dashboard-jwt'` (defined in `server/src/modules/dashboard-auth/strategies/dashboard-jwt.strategy.ts`)
- **Cookie**: `gc_dashboard_access_token`
- **Used by**: Store managers, franchise operators, admin dashboard
- **Endpoints**: `/api/v1/dashboard/*`
## Solution Implemented
### Created New Dashboard Catalog Controller
**File**: `server/src/modules/dashboard/rewards/dashboard-catalog.controller.ts`
**Route**: `/api/v1/dashboard/catalog`
**Key Features**:
1. ✅ Uses `DashboardAuthGuard` (correct authentication for dashboard users)
2. ✅ Uses `DashboardPermissionsGuard` (enforces dashboard permissions)
3. ✅ Automatically derives `storeId` from authenticated dashboard user
4. ✅ Prevents cross-store catalog manipulation (ownership verification)
5. ✅ Follows existing dashboard controller patterns
### Endpoints Created
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/catalog` | List all rewards for authenticated store |
| POST | `/api/v1/dashboard/catalog` | **Create reward for authenticated store** |
| GET | `/api/v1/dashboard/catalog/categories` | List reward categories |
| POST | `/api/v1/dashboard/catalog/categories` | Create reward category |
| PATCH | `/api/v1/dashboard/catalog/categories/:id` | Update reward category |
| GET | `/api/v1/dashboard/catalog/:id` | Get reward details |
| PATCH | `/api/v1/dashboard/catalog/:id` | Update reward (with ownership check) |
| PATCH | `/api/v1/dashboard/catalog/:id/status/:status` | Change reward status |
| PATCH | `/api/v1/dashboard/catalog/:id/stock/:stock` | Adjust reward stock |
| DELETE | `/api/v1/dashboard/catalog/:id` | Delete reward (with ownership check) |
### Security Features
1. **Automatic StoreId Injection**:
   ```typescript
   @Post()
   async createReward(
     @DashboardCurrentStore('storeId') storeId: string,
     @DashboardCurrentStore('sessionId') sessionId: string,
     @Body() dto: CreateRewardDto,
   ) {
     // Force the storeId from authentication, ignore any storeId in the DTO
     const safeDto = { ...dto, storeId };
     return this.catalogService.create(safeDto, sessionId);
   }
   ```
2. **Ownership Verification**:
   @Patch(':id')
   async updateReward(
     @Param('id', ParseUUIDPipe) id: string,
     @Body() dto: UpdateRewardDto,
     const existing = await this.catalogService.getDetail(id);
     if (existing.storeId && existing.storeId !== storeId) {
       throw new ForbiddenException('Cannot update rewards from another store');
     }
     return this.catalogService.update(id, dto);
### Module Registration
Updated `server/src/modules/dashboard/dashboard.module.ts`:
- Added `DashboardCatalogController` to imports
- Added `DashboardCatalogController` to controllers array
## Frontend Update Required
The dashboard frontend should now use:
```typescript
// OLD (will fail with 401)
POST /api/v1/rewards-catalog
// NEW (will succeed with dashboard authentication)
POST /api/v1/dashboard/catalog
```
Update the API client to use the new dashboard-specific endpoint.
## Verification Steps
1. ✅ **Authentication**: Dashboard user can authenticate and receive `gc_dashboard_access_token` cookie
2. ✅ **Authorization**: `DashboardAuthGuard` validates the dashboard JWT and loads store context
3. ✅ **Permissions**: `DashboardPermissionsGuard` allows access (no specific permission required yet)
4. ✅ **StoreId Derivation**: `@DashboardCurrentStore('storeId')` decorator extracts storeId from authenticated user
5. ✅ **Controller Execution**: `createReward` method executes with proper storeId
6. ✅ **Service Call**: `RewardCatalogService.create()` receives DTO with storeId set
7. ✅ **Database**: Reward is created and linked to the correct store
## Testing
### Manual Test
```bash
# 1. Login to dashboard
POST /api/v1/dashboard/auth/login
Body: { "accessCode": "STORE123" }
# 2. Create reward (with cookie from step 1)
Cookie: gc_dashboard_access_token=<token>
Body: {
  "name": "Free Burger",
  "description": "Redeem for a free burger",
  "cost": 100,
  "categoryId": "uuid-here",
  "status": "published"
}
### Expected Response
```json
{
  "id": "uuid",
  "storeId": "auto-injected-store-id",
  "status": "published",
  "createdAt": "2026-08-05T...",
  "updatedAt": "2026-08-05T..."
## Key Architectural Decisions
### Why Not Modify Existing Controller?
The `/api/v1/rewards-catalog` controller is designed for:
- **Customer-facing catalog browsing**
- **Customer reward redemption**
- **Admin reward management** (with customer-based admin permissions)
Creating a separate dashboard controller:
- ✅ Maintains clear separation between customer and dashboard authentication
- ✅ Follows existing architectural patterns (all dashboard routes under `/dashboard/*`)
- ✅ Allows different permission models (dashboard vs customer permissions)
- ✅ Enables store-scoped operations with automatic storeId injection
- ✅ Prevents accidental breaking of customer-facing endpoints
### Why Automatic StoreId Injection?
1. **Security**: Frontend cannot spoof storeId to create rewards for other stores
2. **Simplicity**: Frontend doesn't need to manage or send storeId
3. **Consistency**: All dashboard operations are automatically store-scoped
4. **Trust Boundary**: Backend derives identity from authenticated session, not request body
## Migration Notes
### For Frontend Developers
**Before**:
const response = await fetch('/api/v1/rewards-catalog', {
  method: 'POST',
  credentials: 'include', // sends gc_dashboard_access_token
  body: JSON.stringify(rewardData)
});
// Result: 401 Unauthorized
**After**:
const response = await fetch('/api/v1/dashboard/catalog', {
// Result: 200 OK with created reward
**Important**: Remove `storeId` from request body if present - it will be automatically injected by the backend.
## Related Files
### New Files
- `server/src/modules/dashboard/rewards/dashboard-catalog.controller.ts`
### Modified Files
- `server/src/modules/dashboard/dashboard.module.ts`
### Reference Files (Understanding)
- `server/src/common/guards/jwt-auth.guard.ts` (Customer authentication)
- `server/src/modules/dashboard-auth/guards/dashboard-auth.guard.ts` (Dashboard authentication)
- `server/src/modules/dashboard-auth/guards/dashboard-jwt.guard.ts` (Dashboard JWT validation)
- `server/src/modules/dashboard-auth/strategies/dashboard-jwt.strategy.ts` (Dashboard Passport strategy)
- `server/src/modules/auth/strategies/jwt.strategy.ts` (Customer Passport strategy)
- `server/src/modules/rewards/rewards.controller.ts` (Original customer-facing controller)
## Summary
✅ **Problem**: Dashboard users getting 401 when creating rewards  
✅ **Root Cause**: Using customer authentication endpoint with dashboard credentials  
✅ **Solution**: Created dedicated dashboard catalog controller with proper dashboard authentication  
✅ **Result**: Dashboard users can now create rewards using `/api/v1/dashboard/catalog`  
✅ **Security**: StoreId automatically injected, cross-store manipulation prevented  
✅ **Architecture**: Maintains clean separation between customer and dashboard systems  
The solution follows existing patterns, requires minimal code changes, and does not weaken security or duplicate business logic.