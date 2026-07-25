import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardController } from './reward.controller';
import {
  RewardEngineService,
  CampaignService,
  RewardCacheService,
} from './services';

@Module({
  imports: [AuthModule],
  controllers: [RewardController],
  providers: [RewardEngineService, CampaignService, RewardCacheService],
  exports: [RewardEngineService],
})
export class RewardModule {}
