import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChallengeProgressService } from '../services/challenge-progress.service';
import { CHALLENGE_ERRORS, CHALLENGE_EVENTS } from '../constants';

const now = new Date('2026-08-05T10:00:00Z');

const activeChallenge = {
  id: 'ch-1',
  name: 'Weekly Purchase',
  description: 'Buy 5 items',
  shortDescription: null,
  image: null,
  icon: null,
  type: 'WEEKLY',
  status: 'ACTIVE',
  priority: 0,
  isFeatured: false,
  maxParticipants: null,
  currentParticipants: 2,
  startsAt: new Date('2026-08-01'),
  endsAt: new Date('2026-08-31'),
  storeIds: [],
  brandIds: [],
  campaignRef: null,
  autoEnroll: false,
  repeatableAfterDays: null,
  publishedAt: now,
  createdBy: null,
  updatedBy: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  rules: [
    { id: 'r1', challengeId: 'ch-1', ruleType: 'PURCHASE', targetCount: 5, targetAmount: null, gameSlug: null, storeId: null, sortOrder: 0, description: null, metadata: null },
  ],
  rewards: [
    { id: 'rw1', challengeId: 'ch-1', rewardType: 'COINS', coinAmount: 200, rewardReference: null, quantity: 1, sortOrder: 0, description: null, metadata: null },
  ],
};

const existingProgress = {
  id: 'prog-1',
  challengeId: 'ch-1',
  userId: 'user-1',
  status: 'IN_PROGRESS',
  currentProgress: 3,
  currentAmount: 0,
  targetCount: 5,
  targetAmount: null,
  completedAt: null,
  rewardClaimedAt: null,
  expiresAt: new Date('2026-08-31'),
  metadata: null,
  createdAt: now,
  updatedAt: now,
};

describe('ChallengeProgressService', () => {
  let service: ChallengeProgressService;
  let challengeRepo: Record<string, ReturnType<typeof vi.fn>>;
  let progressRepo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    challengeRepo = {
      findById: vi.fn().mockResolvedValue(activeChallenge),
      findActive: vi.fn().mockResolvedValue([activeChallenge]),
      findUpcoming: vi.fn().mockResolvedValue([]),
      incrementParticipants: vi.fn().mockResolvedValue(undefined),
    };

    progressRepo = {
      findByUserAndChallenge: vi.fn().mockResolvedValue(existingProgress),
      findByUser: vi.fn().mockResolvedValue([existingProgress]),
      findByChallenge: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data) => ({
        id: 'prog-new',
        challengeId: 'ch-1',
        userId: 'user-1',
        status: data.status ?? 'NOT_STARTED',
        currentProgress: data.currentProgress ?? 0,
        currentAmount: data.currentAmount ?? 0,
        targetCount: data.targetCount ?? 5,
        targetAmount: data.targetAmount ?? null,
        completedAt: null,
        rewardClaimedAt: null,
        expiresAt: data.expiresAt ?? new Date('2026-08-31'),
        metadata: null,
        createdAt: now,
        updatedAt: now,
      })),
      update: vi.fn().mockImplementation((id, data) => ({
        ...existingProgress,
        id,
        ...data,
      })),
      findCompletedHistory: vi.fn().mockResolvedValue([[], 0]),
      findExpired: vi.fn().mockResolvedValue([]),
    };

    cache = {
      getCustomerChallenges: vi.fn().mockResolvedValue(null),
      setCustomerChallenges: vi.fn().mockResolvedValue(undefined),
      getProgress: vi.fn().mockResolvedValue(null),
      setProgress: vi.fn().mockResolvedValue(undefined),
      invalidateCustomer: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new ChallengeProgressService(
      challengeRepo as any,
      progressRepo as any,
      cache as any,
      events as unknown as EventEmitter2,
    );
  });

  // ─── recordProgress ────────────────────────────

  it('increments progress for existing record', async () => {
    const result = await service.recordProgress('user-1', {
      challengeId: 'ch-1',
      incrementBy: 1,
    });
    expect(progressRepo.update).toHaveBeenCalledWith(
      'prog-1',
      expect.objectContaining({ currentProgress: 4 }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.PROGRESSED,
      expect.objectContaining({ currentProgress: 4, targetCount: 5 }),
    );
  });

  it('creates progress record when none exists', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce(null);
    progressRepo.update.mockResolvedValueOnce({
      ...existingProgress,
      id: 'prog-new',
      currentProgress: 1,
      status: 'IN_PROGRESS',
    });

    await service.recordProgress('user-1', { challengeId: 'ch-1' });
    expect(progressRepo.create).toHaveBeenCalled();
    expect(challengeRepo.incrementParticipants).toHaveBeenCalledWith('ch-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.STARTED,
      expect.objectContaining({ challengeId: 'ch-1', userId: 'user-1' }),
    );
  });

  it('marks challenge as completed when target reached', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce({
      ...existingProgress,
      currentProgress: 4,
    });

    await service.recordProgress('user-1', { challengeId: 'ch-1', incrementBy: 1 });
    expect(progressRepo.update).toHaveBeenCalledWith(
      'prog-1',
      expect.objectContaining({ status: 'COMPLETED' }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.COMPLETED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  it('throws when challenge not found', async () => {
    challengeRepo.findById.mockResolvedValueOnce(null);
    await expect(
      service.recordProgress('user-1', { challengeId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when challenge not active', async () => {
    challengeRepo.findById.mockResolvedValueOnce({ ...activeChallenge, status: 'DRAFT' });
    await expect(
      service.recordProgress('user-1', { challengeId: 'ch-1' }),
    ).rejects.toThrow(CHALLENGE_ERRORS.CHALLENGE_NOT_ACTIVE);
  });

  it('throws when challenge expired by date', async () => {
    challengeRepo.findById.mockResolvedValueOnce({
      ...activeChallenge,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-01-31'),
    });
    await expect(
      service.recordProgress('user-1', { challengeId: 'ch-1' }),
    ).rejects.toThrow(CHALLENGE_ERRORS.CHALLENGE_EXPIRED);
  });

  it('throws when already completed', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce({
      ...existingProgress,
      status: 'COMPLETED',
    });
    await expect(
      service.recordProgress('user-1', { challengeId: 'ch-1' }),
    ).rejects.toThrow(CHALLENGE_ERRORS.ALREADY_COMPLETED);
  });

  it('throws when max participants reached and user is new', async () => {
    challengeRepo.findById.mockResolvedValueOnce({
      ...activeChallenge,
      maxParticipants: 2,
      currentParticipants: 2,
    });
    progressRepo.findByUserAndChallenge
      .mockResolvedValueOnce(null) // first check in max participants block
      .mockResolvedValueOnce(null); // second check before create
    await expect(
      service.recordProgress('user-1', { challengeId: 'ch-1' }),
    ).rejects.toThrow(CHALLENGE_ERRORS.MAX_PARTICIPANTS_REACHED);
  });

  // ─── getProgress ──────────────────────────────

  it('returns cached progress', async () => {
    cache.getProgress.mockResolvedValueOnce(existingProgress);
    const result = await service.getProgress('user-1', 'ch-1');
    expect(result).toEqual(existingProgress);
    expect(progressRepo.findByUserAndChallenge).not.toHaveBeenCalled();
  });

  it('fetches and caches progress from repo', async () => {
    const result = await service.getProgress('user-1', 'ch-1');
    expect(cache.setProgress).toHaveBeenCalledWith('user-1', 'ch-1', existingProgress);
  });

  it('throws when progress not found', async () => {
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce(null);
    await expect(service.getProgress('user-1', 'ch-1')).rejects.toThrow(NotFoundException);
  });

  // ─── getHistory ────────────────────────────────

  it('returns paginated history', async () => {
    progressRepo.findCompletedHistory.mockResolvedValueOnce([[existingProgress], 1]);
    const result = await service.getHistory('user-1', 1, 20);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  // ─── getUpcomingChallenges ────────────────────

  it('returns upcoming challenges with zero progress', async () => {
    challengeRepo.findUpcoming.mockResolvedValueOnce([activeChallenge]);
    const result = await service.getUpcomingChallenges('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].percentComplete).toBe(0);
    expect(result[0].status).toBe('NOT_STARTED');
  });

  // ─── getActiveChallenges ──────────────────────

  it('returns active challenges with progress', async () => {
    const result = await service.getActiveChallenges('user-1', { activeOnly: true });
    expect(result).toHaveLength(1);
    expect(result[0].currentProgress).toBe(3);
    expect(result[0].targetCount).toBe(5);
    expect(result[0].percentComplete).toBe(60);
  });

  it('auto-enrolls when challenge has autoEnroll', async () => {
    challengeRepo.findActive.mockResolvedValueOnce([{ ...activeChallenge, autoEnroll: true }]);
    progressRepo.findByUser.mockResolvedValueOnce([]);
    progressRepo.findByUserAndChallenge.mockResolvedValueOnce(null);

    const result = await service.getActiveChallenges('user-1', { activeOnly: true });
    expect(progressRepo.create).toHaveBeenCalled();
    expect(challengeRepo.incrementParticipants).toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.STARTED,
      expect.objectContaining({ userId: 'user-1' }),
    );
  });

  // ─── expireStale ──────────────────────────────

  it('expires stale progress records', async () => {
    progressRepo.findExpired.mockResolvedValueOnce([existingProgress]);
    const count = await service.expireStale();
    expect(count).toBe(1);
    expect(progressRepo.update).toHaveBeenCalledWith(
      'prog-1',
      expect.objectContaining({ status: 'EXPIRED' }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.EXPIRED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });
});
