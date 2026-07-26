import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { RewardsController } from './rewards.controller';
import {
  RewardsCacheService,
  RewardCatalogService,
  RewardEligibilityService,
  RewardRedemptionService,
  VoucherService,
  RewardAnalyticsService,
} from './services';

/**
 * Rewards Catalog & Redemption — how customers SPEND earned coins.
 * Distinct from RewardModule (the Reward Engine), which decides how coins
 * are EARNED. Balance movement is delegated entirely to WalletService.
 */
@Module({
  imports: [AuthModule, WalletModule],
  controllers: [RewardsController],
  providers: [
    RewardsCacheService,
    RewardCatalogService,
    RewardEligibilityService,
    RewardRedemptionService,
    VoucherService,
    RewardAnalyticsService,
  ],
  exports: [RewardCatalogService, RewardRedemptionService, VoucherService],
})
export class RewardsModule {}
