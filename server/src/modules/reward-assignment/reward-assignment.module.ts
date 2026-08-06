import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardProfileModule } from '../reward-profile/reward-profile.module';
import { RewardAssignmentController } from './controllers';
import { RewardAssignmentCacheService } from './cache';
import { RewardAssignmentRepository } from './repositories';
import { RewardAssignmentService } from './services';
import { RewardAssignmentListener } from './listeners';

@Module({
  imports: [AuthModule, RewardProfileModule],
  controllers: [RewardAssignmentController],
  providers: [
    RewardAssignmentRepository,
    RewardAssignmentCacheService,
    RewardAssignmentService,
    RewardAssignmentListener,
  ],
  exports: [RewardAssignmentService, RewardAssignmentRepository],
})
export class RewardAssignmentModule {}
