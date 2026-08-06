import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChallengeService } from '../services/challenge.service';
import { CHALLENGE_ERRORS, CHALLENGE_EVENTS } from '../constants';

const now = new Date('2026-08-05T10:00:00Z');

const baseChallenge = {
  id: 'ch-1',
  name: 'Daily Login',
  slug: 'daily-login',
  description: 'Login daily',
  shortDescription: null,
  image: null,
  icon: null,
  type: 'DAILY',
  status: 'DRAFT',
  priority: 0,
  isFeatured: false,
  maxParticipants: null,
  currentParticipants: 0,
  startsAt: new Date('2026-08-01'),
  endsAt: new Date('2026-08-31'),
  storeIds: [],
  brandIds: [],
  campaignRef: null,
  autoEnroll: false,
  repeatableAfterDays: null,
  publishedAt: null,
  createdBy: 'admin-1',
  updatedBy: 'admin-1',
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  rules: [
    {
      id: 'rule-1',
      challengeId: 'ch-1',
      ruleType: 'LOGIN',
      targetCount: 7,
      targetAmount: null,
      gameSlug: null,
      storeId: null,
      sortOrder: 0,
      description: null,
      metadata: null,
    },
  ],
  rewards: [
    {
      id: 'rew-1',
      challengeId: 'ch-1',
      rewardType: 'COINS',
      coinAmount: 100,
      rewardReference: null,
      quantity: 1,
      sortOrder: 0,
      description: null,
      metadata: null,
    },
  ],
};

describe('ChallengeService', () => {
  let service: ChallengeService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let ruleRepo: Record<string, ReturnType<typeof vi.fn>>;
  let rewardRepo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[baseChallenge], 1]),
      findById: vi.fn().mockResolvedValue(baseChallenge),
      findByIdIncludingDeleted: vi.fn().mockResolvedValue({ ...baseChallenge, deletedAt: now }),
      findBySlug: vi.fn().mockResolvedValue(null),
      findDuplicateName: vi.fn().mockResolvedValue(null),
      findActive: vi.fn().mockResolvedValue([baseChallenge]),
      findUpcoming: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(baseChallenge),
      update: vi.fn().mockResolvedValue(baseChallenge),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(baseChallenge),
      recordHistory: vi.fn().mockResolvedValue(undefined),
      findHistory: vi.fn().mockResolvedValue([]),
      replaceMetadata: vi.fn().mockResolvedValue(undefined),
      findMetadata: vi.fn().mockResolvedValue([]),
      incrementParticipants: vi.fn().mockResolvedValue(undefined),
    };

    ruleRepo = {
      findByChallenge: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(baseChallenge.rules[0]),
      create: vi.fn().mockResolvedValue(baseChallenge.rules[0]),
      update: vi.fn().mockResolvedValue(baseChallenge.rules[0]),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    rewardRepo = {
      findByChallenge: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(baseChallenge.rewards[0]),
      create: vi.fn().mockResolvedValue(baseChallenge.rewards[0]),
      update: vi.fn().mockResolvedValue(baseChallenge.rewards[0]),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    cache = {
      getChallenge: vi.fn().mockResolvedValue(null),
      setChallenge: vi.fn().mockResolvedValue(undefined),
      invalidateChallenge: vi.fn().mockResolvedValue(undefined),
      invalidateAll: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new ChallengeService(
      repo as any,
      ruleRepo as any,
      rewardRepo as any,
      cache as any,
      events as unknown as EventEmitter2,
    );
  });

  // ─── findById ──────────────────────────────────

  it('returns cached challenge if available', async () => {
    cache.getChallenge.mockResolvedValueOnce(baseChallenge);
    const result = await service.findById('ch-1');
    expect(result.id).toBe('ch-1');
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('fetches from repo and caches when not cached', async () => {
    const result = await service.findById('ch-1');
    expect(result.id).toBe('ch-1');
    expect(cache.setChallenge).toHaveBeenCalledWith('ch-1', expect.objectContaining({ id: 'ch-1' }));
  });

  it('throws NotFoundException for missing challenge', async () => {
    repo.findById.mockResolvedValueOnce(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  // ─── create ────────────────────────────────────

  it('creates a challenge and emits event', async () => {
    const result = await service.create(
      {
        name: 'Daily Login',
        startsAt: '2026-08-01T00:00:00Z',
        endsAt: '2026-08-31T00:00:00Z',
      },
      'admin-1',
    );
    expect(result.id).toBe('ch-1');
    expect(repo.create).toHaveBeenCalled();
    expect(repo.recordHistory).toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.CREATED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  it('throws on duplicate slug', async () => {
    repo.findBySlug.mockResolvedValueOnce(baseChallenge);
    await expect(
      service.create(
        { name: 'Daily Login', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T00:00:00Z' },
        'admin-1',
      ),
    ).rejects.toThrow(CHALLENGE_ERRORS.DUPLICATE_SLUG);
  });

  it('throws on duplicate name', async () => {
    repo.findDuplicateName.mockResolvedValueOnce(baseChallenge);
    await expect(
      service.create(
        { name: 'Daily Login', startsAt: '2026-08-01T00:00:00Z', endsAt: '2026-08-31T00:00:00Z' },
        'admin-1',
      ),
    ).rejects.toThrow(CHALLENGE_ERRORS.DUPLICATE_NAME);
  });

  it('throws on invalid date range', async () => {
    await expect(
      service.create(
        { name: 'Bad Dates', startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-08-01T00:00:00Z' },
        'admin-1',
      ),
    ).rejects.toThrow(CHALLENGE_ERRORS.INVALID_DATE_RANGE);
  });

  // ─── update ────────────────────────────────────

  it('updates a challenge and emits event for changed fields', async () => {
    const updated = { ...baseChallenge, name: 'Updated Name' };
    repo.update.mockResolvedValueOnce(updated);
    const result = await service.update('ch-1', { name: 'Updated Name' }, 'admin-1');
    expect(result.name).toBe('Updated Name');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.UPDATED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  it('throws NotFoundException when updating missing challenge', async () => {
    repo.findById.mockResolvedValueOnce(null);
    await expect(service.update('missing', { name: 'X' }, null)).rejects.toThrow(NotFoundException);
  });

  // ─── archive ───────────────────────────────────

  it('archives a draft challenge', async () => {
    await service.archive('ch-1', 'admin-1');
    expect(repo.softDelete).toHaveBeenCalledWith('ch-1', 'admin-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.ARCHIVED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  it('throws when archiving active challenge', async () => {
    repo.findById.mockResolvedValueOnce({ ...baseChallenge, status: 'ACTIVE' });
    await expect(service.archive('ch-1', 'admin-1')).rejects.toThrow(
      CHALLENGE_ERRORS.CANNOT_ARCHIVE_ACTIVE,
    );
  });

  // ─── restore ───────────────────────────────────

  it('restores an archived challenge', async () => {
    const result = await service.restore('ch-1', 'admin-1');
    expect(result.id).toBe('ch-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.RESTORED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  // ─── publish ───────────────────────────────────

  it('publishes a draft challenge with rules and rewards', async () => {
    const published = { ...baseChallenge, status: 'PUBLISHED' };
    repo.update.mockResolvedValueOnce(published);
    const result = await service.publish('ch-1', 'admin-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.PUBLISHED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  it('throws when already published', async () => {
    repo.findById.mockResolvedValueOnce({ ...baseChallenge, status: 'PUBLISHED' });
    await expect(service.publish('ch-1', 'admin-1')).rejects.toThrow(
      CHALLENGE_ERRORS.ALREADY_PUBLISHED,
    );
  });

  it('throws when no rules', async () => {
    repo.findById.mockResolvedValueOnce({ ...baseChallenge, rules: [] });
    await expect(service.publish('ch-1', 'admin-1')).rejects.toThrow(
      CHALLENGE_ERRORS.CANNOT_PUBLISH_NO_RULES,
    );
  });

  it('throws when no rewards', async () => {
    repo.findById.mockResolvedValueOnce({ ...baseChallenge, rewards: [] });
    await expect(service.publish('ch-1', 'admin-1')).rejects.toThrow(
      CHALLENGE_ERRORS.CANNOT_PUBLISH_NO_REWARDS,
    );
  });

  // ─── pause & end ───────────────────────────────

  it('pauses a challenge', async () => {
    const paused = { ...baseChallenge, status: 'PAUSED' };
    repo.update.mockResolvedValueOnce(paused);
    await service.pause('ch-1', 'admin-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.PAUSED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  it('ends a challenge', async () => {
    const ended = { ...baseChallenge, status: 'ENDED' };
    repo.update.mockResolvedValueOnce(ended);
    await service.end('ch-1', 'admin-1');
    expect(events.emit).toHaveBeenCalledWith(
      CHALLENGE_EVENTS.ENDED,
      expect.objectContaining({ challengeId: 'ch-1' }),
    );
  });

  // ─── duplicate ─────────────────────────────────

  it('duplicates a challenge with rules and rewards', async () => {
    const dupResult = { ...baseChallenge, id: 'ch-2', name: 'Daily Login (copy)' };
    repo.create.mockResolvedValueOnce(dupResult);
    repo.findById
      .mockResolvedValueOnce(baseChallenge) // source lookup
      .mockResolvedValueOnce(dupResult); // final lookup

    const result = await service.duplicate('ch-1', {}, 'admin-1');
    expect(ruleRepo.create).toHaveBeenCalled();
    expect(rewardRepo.create).toHaveBeenCalled();
    expect(repo.recordHistory).toHaveBeenCalled();
  });

  // ─── Rules sub-CRUD ────────────────────────────

  it('creates a rule for a challenge', async () => {
    const result = await service.createRule(
      { challengeId: 'ch-1', ruleType: 'LOGIN' as any },
      'admin-1',
    );
    expect(ruleRepo.create).toHaveBeenCalled();
    expect(cache.invalidateChallenge).toHaveBeenCalledWith('ch-1');
  });

  it('throws when creating rule for missing challenge', async () => {
    repo.findById.mockResolvedValueOnce(null);
    await expect(
      service.createRule({ challengeId: 'missing', ruleType: 'LOGIN' as any }, null),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes a rule', async () => {
    await service.deleteRule('rule-1');
    expect(ruleRepo.delete).toHaveBeenCalledWith('rule-1');
  });

  // ─── Rewards sub-CRUD ──────────────────────────

  it('creates a reward for a challenge', async () => {
    const result = await service.createReward(
      { challengeId: 'ch-1', rewardType: 'COINS' as any, coinAmount: 50 },
      'admin-1',
    );
    expect(rewardRepo.create).toHaveBeenCalled();
  });

  it('deletes a reward', async () => {
    await service.deleteReward('rew-1');
    expect(rewardRepo.delete).toHaveBeenCalledWith('rew-1');
  });
});
