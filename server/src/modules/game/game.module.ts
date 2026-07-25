import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardModule } from '../reward/reward.module';
import { WalletModule } from '../wallet/wallet.module';
import { GameController } from './game.controller';
import { GameRegistry } from './registry/game.registry';
import { GameCacheService } from './services/game-cache.service';
import { EligibilityService } from './services/eligibility.service';
import { CooldownService } from './services/cooldown.service';
import { AntiFraudService } from './services/anti-fraud.service';
import { GameAnalyticsService } from './services/game-analytics.service';
import { GameConfigurationService } from './services/game-configuration.service';
import { GameSessionService } from './services/game-session.service';
import { SpinWheelService } from './services/spin-wheel.service';

@Module({
  imports: [AuthModule, RewardModule, WalletModule],
  controllers: [GameController],
  providers: [
    GameRegistry,
    GameCacheService,
    EligibilityService,
    CooldownService,
    AntiFraudService,
    GameAnalyticsService,
    GameConfigurationService,
    GameSessionService,
    SpinWheelService,
  ],
  exports: [
    GameRegistry,
    GameConfigurationService,
    GameSessionService,
    EligibilityService,
    CooldownService,
    AntiFraudService,
    GameAnalyticsService,
  ],
})
export class GameModule {}
