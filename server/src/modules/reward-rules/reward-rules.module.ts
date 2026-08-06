import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardProfileModule } from '../reward-profile/reward-profile.module';
import { RewardRulesController } from './controllers';
import { RewardRulesCacheService } from './cache';
import { RewardRulesRepository } from './repositories';
import { RewardRulesService } from './services';
import { RewardRulesListener } from './listeners';

@Module({
  imports: [AuthModule, RewardProfileModule],
  controllers: [RewardRulesController],
  providers: [
    RewardRulesRepository,
    RewardRulesCacheService,
    RewardRulesService,
    RewardRulesListener,
  ],
  exports: [RewardRulesService, RewardRulesRepository],
})
export class RewardRulesModule {}
