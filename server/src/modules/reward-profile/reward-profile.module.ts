import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardProfileController } from './controllers';
import { RewardProfileCacheService } from './cache';
import { RewardProfileRepository } from './repositories';
import { RewardProfileService } from './services';
import { RewardProfileListener } from './listeners';

@Module({
  imports: [AuthModule],
  controllers: [RewardProfileController],
  providers: [
    RewardProfileRepository,
    RewardProfileCacheService,
    RewardProfileService,
    RewardProfileListener,
  ],
  exports: [RewardProfileService, RewardProfileRepository],
})
export class RewardProfileModule {}
