import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChallengeRewardClaimService } from '../services/challenge-reward-claim.service';
import { CHALLENGE_ERRORS, CHALLENGE_EVENTS } from '../constants';

const now = new Date('2026-08-05T10:00:00Z');

const challenge = {
  id: 'ch-1',
  name: 'Weekly Purchase',
  rules: [],
  rewards: [
    { id: 'rw1', rewardType: 'COINS', coinAmount: 200, rewardReference: null, quantity: 1, sortOrder: 0, description: '200 coins', metadata: null },
  ],
};

const completedProgress = {
  id: 'prog-1',
  challengeId: 'ch-1',
  userId: 'user-1',
  status: 'COMPLETED',
  currentProgress: 5,
  currentAmount: 0,
  targetCount: 5,
  targetAmount: null,
  completedAt: now,
  rewardClaimedAt: null,
  expiresAt: new Date('2026-08-31'),
};

describe('ChallengeRewardClaimService', () => {
  let service: ChallengeRewardClaimService;
  let challengeRepo: Record<string, ReturnType<typeof vi.fn>>;
  let progressRepo: Record<string, ReturnType<typeof vi.fn>>;
  let rewardRepo: Record<string, ReturnType<typeof vi.fn>>;
  let wallet: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    challengeRepo = {
      findById: vi.fn().mockResolvedValue(challenge),
    };

    progressRepo = {
      findByUserAndChallenge: vi.fn().mockResolvedValue(completedProgress),
      update: vi.fn().mockResolvedValue({ ...completedProgress, status: 'REWARD_CLAIMED', rewardClaimedAt: now }),
    };

    rewardRepo = {
      findByChallenge: vi.fn().mockResolvedValue(challenge.rewards),
    };

    wallet = {
      credit: vi.fn().mockResolvedValue({ success: true, transactionId: 'tx-1' }),
    };

    cache = {
      invalidateCustomer: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new ChallengeRewardClaimService(
      challengeRepo as any,
      progressRepo as any,
      rewardRepo as any,
      wallet as any,
      cache as any,
      events as unknown as EventEmitter2,
    );
  });

  it('claims COINS reward and credits wallet', async () => {
    const result = await service.claimReward('user-1', 'ch-1');
    expect(result.claimed).toBe(true);
    expect(result.rewards).toHaveLength(1);
    expect(result.rewards[0].rewardType).toBe('COINS');
    expect(result.rewards[0].coinAmount).toBe(200);

    expect(wallet.credit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        amount: 200,
        description: 'Challenge reward: Weekly Purchase',
        referenceId: 'ch-1',
        referenceType: 'challenge',
        idempotencyKey: 'challenge:ch-1:user-1:rw1',
      }),
      null,
      null,
      null,
    );
  });

  it('updates progress to REWARD_CLAIMED', async () => {
    await service.claimReward('user-1', 'ch-1');
    expect(progressRepo.update).toHaveBeenCalledWith(
      'prog-1',
      expect.objectContaining({ status: 'REWARD_CLAIMED' }),
    );
  });

  it('emits reward claimed event', async () => {
    await service.claimReward('user-1', 'ch-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.REWARD_CLAIMED,
      expect.objectContaining({
        challengeId: 'ch-1',
        userId: 'user-1',
        rewardType: 'COINS',
        coinAmount: 200,
      }),
    );
  });

  it('invalidates customer cache', async () => {
    await service.claimReward('user-1', 'ch-1');
    expect(cache.invalidateCustomer).toHaveBeenCalledWith('user-1');
  });

  it('throws when challenge not found', async () => {
    challengeRepo.findById.mockResolvedValueOnce(null);
    await expect(service.claimReward('user-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('throws when progress not found', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce(null);
    await expect(service.claimReward('user-1', 'ch-1')).rejects.toThrow(
      CHALLENGE_ERRORS.PROGRESS_NOT_FOUND,
    );
  });

  it('throws when already claimed', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce({
      ...completedProgress,
      status: 'REWARD_CLAIMED',
    });
    await expect(service.claimReward('user-1', 'ch-1')).rejects.toThrow(
      CHALLENGE_ERRORS.ALREADY_CLAIMED,
    );
  });

  it('throws when not completed', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce({
      ...completedProgress,
      status: 'IN_PROGRESS',
    });
    await expect(service.claimReward('user-1', 'ch-1')).rejects.toThrow(
      CHALLENGE_ERRORS.NOT_COMPLETED,
    );
  });

  it('handles non-COINS reward without wallet credit', async () => {
    rewardRepo.findByChallenge.mockResolvedValueOnce([
      { id: 'rw2', rewardType: 'VOUCHER', coinAmount: null, rewardReference: 'voucher-abc', quantity: 1, sortOrder: 0, description: 'Free item', metadata: null },
    ]);

    const result = await service.claimReward('user-1', 'ch-1');
    expect(wallet.credit).not.toHaveBeenCalled();
    expect(result.rewards[0].rewardType).toBe('VOUCHER');
    expect(result.rewards[0].rewardReference).toBe('voucher-abc');
  });

  it('handles multiple rewards', async () => {
    rewardRepo.findByChallenge.mockResolvedValueOnce([
      ...challenge.rewards,
      { id: 'rw2', rewardType: 'VOUCHER', coinAmount: null, rewardReference: 'voucher-xyz', quantity: 1, sortOrder: 1, description: null, metadata: null },
    ]);

    const result = await service.claimReward('user-1', 'ch-1');
    expect(result.rewards).toHaveLength(2);
    expect(wallet.credit).toHaveBeenCalledTimes(1);
  });
});
