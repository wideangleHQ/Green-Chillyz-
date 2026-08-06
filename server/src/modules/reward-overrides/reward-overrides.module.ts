import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardRulesModule } from '../reward-rules/reward-rules.module';
import { RewardAssignmentModule } from '../reward-assignment/reward-assignment.module';
import { RewardOverridesController } from './controllers';
import { RewardOverridesCacheService } from './cache';
import { RewardOverridesRepository } from './repositories';
import { RewardOverridesService } from './services';
import { RewardOverridesListener } from './listeners';

@Module({
  imports: [AuthModule, RewardRulesModule, RewardAssignmentModule],
  controllers: [RewardOverridesController],
  providers: [
    RewardOverridesRepository,
    RewardOverridesCacheService,
    RewardOverridesService,
    RewardOverridesListener,
  ],
  exports: [RewardOverridesService, RewardOverridesRepository],
})
export class RewardOverridesModule {}
