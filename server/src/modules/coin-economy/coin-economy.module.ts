import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuditModule } from '../audit/audit.module';
import {
  CoinEconomyController,
  CoinLimitsController,
  CoinMultipliersController,
  CoinRulesController,
} from './controllers';
import { CoinEconomyCacheService } from './cache';
import {
  CoinLimitRepository,
  CoinMultiplierRepository,
  CoinRuleRepository,
  CoinUsageRepository,
} from './repositories';
import {
  CoinCalculationService,
  CoinCooldownService,
  CoinEconomyService,
  CoinLimitService,
  CoinMultiplierService,
  CoinRuleProvisioningService,
  CoinRuleService,
} from './services';
import { CoinEconomyListener } from './listeners';

/**
 * The single source of truth for coin earning rules.
 *
 * Consumes the existing Wallet (for crediting) and Audit (for the trail)
 * modules rather than reimplementing either. Games and other callers depend on
 * CoinEconomyService instead of holding coin values of their own.
 */
@Module({
  imports: [AuthModule, WalletModule, AuditModule],
  controllers: [
    CoinRulesController,
    CoinLimitsController,
    CoinMultipliersController,
    CoinEconomyController,
  ],
  providers: [
    CoinRuleRepository,
    CoinLimitRepository,
    CoinMultiplierRepository,
    CoinUsageRepository,
    CoinEconomyCacheService,
    CoinRuleService,
    CoinLimitService,
    CoinMultiplierService,
    CoinCooldownService,
    CoinCalculationService,
    CoinEconomyService,
    CoinRuleProvisioningService,
    CoinEconomyListener,
  ],
  exports: [
    CoinEconomyService,
    CoinRuleService,
    CoinLimitService,
    CoinMultiplierService,
    CoinCalculationService,
  ],
})
export class CoinEconomyModule {}
