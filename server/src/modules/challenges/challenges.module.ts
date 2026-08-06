import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuditModule } from '../audit/audit.module';
import {
  ChallengesController,
  ChallengeCustomerController,
} from './controllers';
import { ChallengeCacheService } from './cache';
import {
  ChallengeRepository,
  ChallengeRuleRepository,
  ChallengeRewardRepository,
  ChallengeProgressRepository,
} from './repositories';
import {
  ChallengeService,
  ChallengeProgressService,
  ChallengeRewardClaimService,
} from './services';
import { ChallengeListener } from './listeners';

@Module({
  imports: [AuthModule, WalletModule, AuditModule],
  controllers: [ChallengesController, ChallengeCustomerController],
  providers: [
    ChallengeRepository,
    ChallengeRuleRepository,
    ChallengeRewardRepository,
    ChallengeProgressRepository,
    ChallengeCacheService,
    ChallengeService,
    ChallengeProgressService,
    ChallengeRewardClaimService,
    ChallengeListener,
  ],
  exports: [ChallengeService, ChallengeProgressService, ChallengeRewardClaimService],
})
export class ChallengesModule {}
