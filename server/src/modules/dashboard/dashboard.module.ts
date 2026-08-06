import { Module } from '@nestjs/common';
import { DashboardAuthModule } from '../dashboard-auth/dashboard-auth.module';
import { GameModule } from '../game/game.module';
import { NotificationModule } from '../notification/notification.module';
import { RewardsModule } from '../rewards/rewards.module';
import { StoreModule } from '../store/store.module';
import { WalletModule } from '../wallet/wallet.module';
import { DashboardAnalyticsController } from './analytics/dashboard-analytics.controller';
import { DashboardAnalyticsService } from './analytics/dashboard-analytics.service';
import { DashboardPermissionsGuard } from './common/guards/dashboard-permissions.guard';
import { DashboardCacheListener } from './common/listeners/dashboard-cache.listener';
import { DashboardCustomerScopeService } from './common/services/dashboard-customer-scope.service';
import { DashboardOpsCacheService } from './common/services/dashboard-ops-cache.service';
import { DashboardCustomersController } from './customers/dashboard-customers.controller';
import { DashboardCustomersService } from './customers/dashboard-customers.service';
import { DashboardNotificationsController } from './notifications/dashboard-notifications.controller';
import { DashboardNotificationsService } from './notifications/dashboard-notifications.service';
import { DashboardRewardsController } from './rewards/dashboard-rewards.controller';
import { DashboardRewardsService } from './rewards/dashboard-rewards.service';
import { DashboardCatalogController } from './rewards/dashboard-catalog.controller';
import { DashboardStoresController } from './stores/dashboard-stores.controller';
import { DashboardStoresService } from './stores/dashboard-stores.service';
import { DashboardVouchersController } from './vouchers/dashboard-vouchers.controller';
import { DashboardVouchersService } from './vouchers/dashboard-vouchers.service';
import { DashboardWalletController } from './wallet/dashboard-wallet.controller';
import { DashboardWalletService } from './wallet/dashboard-wallet.service';

/**
 * Dashboard Operations API — the store-facing surface of the one shared
 * backend, mounted under `/api/v1/dashboard/...`.
 *
 * Pure orchestration: every business rule (balances, redemption, catalog
 * availability, notification state) is executed by the owning module's
 * exported service. This module contributes exactly three things — the store
 * scope on every read, dashboard-shaped projections, and store-scoped Redis
 * caching with event-driven invalidation. It writes nothing except through
 * those shared services, and it never touches customer authentication.
 */
@Module({
  imports: [
    DashboardAuthModule,
    WalletModule,
    RewardsModule,
    StoreModule,
    NotificationModule,
    GameModule,
  ],
  controllers: [
    DashboardCustomersController,
    DashboardWalletController,
    DashboardRewardsController,
    DashboardCatalogController,
    DashboardVouchersController,
    DashboardStoresController,
    DashboardNotificationsController,
    DashboardAnalyticsController,
  ],
  providers: [
    DashboardOpsCacheService,
    DashboardCustomerScopeService,
    DashboardPermissionsGuard,
    DashboardCacheListener,
    DashboardCustomersService,
    DashboardWalletService,
    DashboardRewardsService,
    DashboardVouchersService,
    DashboardStoresService,
    DashboardNotificationsService,
    DashboardAnalyticsService,
  ],
})
export class DashboardModule {}
