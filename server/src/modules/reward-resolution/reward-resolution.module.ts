import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardModule } from '../reward/reward.module';
import { RewardOverridesModule } from '../reward-overrides/reward-overrides.module';
import { RewardAssignmentModule } from '../reward-assignment/reward-assignment.module';
import { RewardProfileModule } from '../reward-profile/reward-profile.module';
import { RewardRulesModule } from '../reward-rules/reward-rules.module';
import { CoinEconomyModule } from '../coin-economy/coin-economy.module';
import { WalletModule } from '../wallet/wallet.module';
import { RewardResolutionController } from './controllers';
import { RewardResolutionService } from './services';
import { RewardResolutionListener } from './services/reward-resolution.listener';
import { RewardResolutionCacheService } from './cache';

@Module({
  imports: [
    AuthModule,
    RewardModule,
    RewardOverridesModule,
    RewardAssignmentModule,
    RewardProfileModule,
    RewardRulesModule,
    CoinEconomyModule,
    WalletModule,
  ],
  controllers: [RewardResolutionController],
  providers: [
    RewardResolutionService,
    RewardResolutionListener,
    RewardResolutionCacheService,
  ],
  exports: [RewardResolutionService],
})
export class RewardResolutionModule {}
