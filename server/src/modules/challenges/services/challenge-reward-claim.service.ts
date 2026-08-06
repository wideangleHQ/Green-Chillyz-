import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionSource } from '@prisma/client';
import {
  ChallengeProgressStatus,
  ChallengeRewardType,
} from '@prisma/client';
import { WalletService } from '../../wallet/services/wallet.service';
import { ChallengeRepository } from '../repositories';
import { ChallengeProgressRepository } from '../repositories';
import { ChallengeRewardRepository } from '../repositories';
import { ChallengeCacheService } from '../cache';
import {
  CHALLENGE_ERRORS,
  CHALLENGE_EVENTS,
  CHALLENGE_REWARD_WALLET_SOURCE,
  CHALLENGE_REFERENCE_TYPE,
} from '../constants';
import { ChallengeRewardClaimedEvent } from '../events';

@Injectable()
export class ChallengeRewardClaimService {
  private readonly logger = new Logger(ChallengeRewardClaimService.name);

  constructor(
    private readonly challengeRepo: ChallengeRepository,
    private readonly progressRepo: ChallengeProgressRepository,
    private readonly rewardRepo: ChallengeRewardRepository,
    private readonly wallet: WalletService,
    private readonly cache: ChallengeCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async claimReward(
    userId: string,
    challengeId: string,
  ): Promise<{ claimed: boolean; rewards: ClaimedRewardSummary[] }> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    const progress = await this.progressRepo.findByUserAndChallenge(userId, challengeId);
    if (!progress) throw new NotFoundException(CHALLENGE_ERRORS.PROGRESS_NOT_FOUND);

    if (progress.status === ChallengeProgressStatus.REWARD_CLAIMED) {
      throw new BadRequestException(CHALLENGE_ERRORS.ALREADY_CLAIMED);
    }

    if (progress.status !== ChallengeProgressStatus.COMPLETED) {
      throw new BadRequestException(CHALLENGE_ERRORS.NOT_COMPLETED);
    }

    const rewards = await this.rewardRepo.findByChallenge(challengeId);
    const claimed: ClaimedRewardSummary[] = [];

    for (const reward of rewards) {
      if (reward.rewardType === ChallengeRewardType.COINS && reward.coinAmount) {
        const source =
          CHALLENGE_REWARD_WALLET_SOURCE[reward.rewardType] ?? TransactionSource.SYSTEM_REWARD;

        await this.wallet.credit(
          {
            userId,
            amount: reward.coinAmount,
            source,
            description: `Challenge reward: ${challenge.name}`,
            referenceId: challengeId,
            referenceType: CHALLENGE_REFERENCE_TYPE,
            idempotencyKey: `challenge:${challengeId}:${userId}:${reward.id}`,
          },
          undefined,
          undefined,
          undefined,
        );

        claimed.push({
          rewardType: reward.rewardType,
          coinAmount: reward.coinAmount,
          rewardReference: null,
          description: reward.description,
        });
      } else {
        claimed.push({
          rewardType: reward.rewardType,
          coinAmount: reward.coinAmount,
          rewardReference: reward.rewardReference,
          description: reward.description,
        });
      }
    }

    await this.progressRepo.update(progress.id, {
      status: ChallengeProgressStatus.REWARD_CLAIMED,
      rewardClaimedAt: new Date(),
    });

    await this.cache.invalidateCustomer(userId);

    const firstReward = rewards[0];
    this.events.emit(
      CHALLENGE_EVENTS.REWARD_CLAIMED,
      new ChallengeRewardClaimedEvent(
        challengeId,
        userId,
        firstReward?.rewardType ?? ChallengeRewardType.COINS,
        firstReward?.coinAmount ?? null,
        challenge.name,
      ),
    );

    return { claimed: true, rewards: claimed };
  }
}

export interface ClaimedRewardSummary {
  rewardType: ChallengeRewardType;
  coinAmount: number | null;
  rewardReference: string | null;
  description: string | null;
}
