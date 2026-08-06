import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditSeverity } from '@prisma/client';
import { ChallengeListener } from '../listeners/challenge.listener';
import { CHALLENGE_EVENTS } from '../constants';
import {
  ChallengeCreatedEvent,
  ChallengeUpdatedEvent,
  ChallengePublishedEvent,
  ChallengePausedEvent,
  ChallengeEndedEvent,
  ChallengeArchivedEvent,
  ChallengeRestoredEvent,
  ChallengeStartedEvent,
  ChallengeProgressedEvent,
  ChallengeCompletedEvent,
  ChallengeExpiredEvent,
  ChallengeRewardClaimedEvent,
} from '../events';

describe('ChallengeListener', () => {
  let listener: ChallengeListener;
  let audit: { record: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    listener = new ChallengeListener(audit as any);
  });

  it('records audit on challenge created', async () => {
    await listener.onCreated(
      new ChallengeCreatedEvent('ch-1', 'Daily Login', 'DAILY' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.CREATED,
        entityId: 'ch-1',
        action: 'CREATE',
        userId: 'admin-1',
      }),
    );
  });

  it('records audit on challenge updated', async () => {
    await listener.onUpdated(
      new ChallengeUpdatedEvent('ch-1', 'Daily Login', ['name'], { name: 'Old' }, { name: 'New' }, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.UPDATED,
        action: 'UPDATE',
        oldValue: { name: 'Old' },
        newValue: { name: 'New' },
      }),
    );
  });

  it('records audit on challenge published with WARNING severity', async () => {
    await listener.onPublished(
      new ChallengePublishedEvent('ch-1', 'Daily Login', 'DAILY' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.PUBLISHED,
        action: 'PUBLISH',
        severity: AuditSeverity.WARNING,
      }),
    );
  });

  it('records audit on challenge paused', async () => {
    await listener.onPaused(new ChallengePausedEvent('ch-1', 'Test', 'admin-1'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.PAUSED,
        action: 'PAUSE',
        severity: AuditSeverity.WARNING,
      }),
    );
  });

  it('records audit on challenge ended', async () => {
    await listener.onEnded(new ChallengeEndedEvent('ch-1', 'Test', 'admin-1'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: CHALLENGE_EVENTS.ENDED, action: 'END' }),
    );
  });

  it('records audit on challenge archived', async () => {
    await listener.onArchived(new ChallengeArchivedEvent('ch-1', 'Test', 'admin-1'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: CHALLENGE_EVENTS.ARCHIVED, action: 'ARCHIVE' }),
    );
  });

  it('records audit on challenge restored', async () => {
    await listener.onRestored(new ChallengeRestoredEvent('ch-1', 'Test', 'admin-1'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: CHALLENGE_EVENTS.RESTORED, action: 'RESTORE' }),
    );
  });

  it('records audit on challenge started by user', async () => {
    await listener.onStarted(new ChallengeStartedEvent('ch-1', 'user-1', 'Daily Login'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.STARTED,
        action: 'START',
        userId: 'user-1',
      }),
    );
  });

  it('records audit on progress with dedupeKey', async () => {
    const event = new ChallengeProgressedEvent('ch-1', 'user-1', 3, 5);
    await listener.onProgressed(event);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.PROGRESSED,
        action: 'PROGRESS',
        dedupeKey: expect.stringContaining('challenge-progress:user-1:ch-1:'),
      }),
    );
  });

  it('records audit on completion with HIGH severity', async () => {
    await listener.onCompleted(new ChallengeCompletedEvent('ch-1', 'user-1', 'Daily Login'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.COMPLETED,
        action: 'COMPLETE',
        severity: AuditSeverity.HIGH,
      }),
    );
  });

  it('records audit on expiry', async () => {
    await listener.onExpired(new ChallengeExpiredEvent('ch-1', 'user-1'));
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.EXPIRED,
        action: 'EXPIRE',
        userId: 'user-1',
      }),
    );
  });

  it('records audit on reward claimed with HIGH severity', async () => {
    await listener.onRewardClaimed(
      new ChallengeRewardClaimedEvent('ch-1', 'user-1', 'COINS' as any, 200, 'Daily Login'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CHALLENGE_EVENTS.REWARD_CLAIMED,
        action: 'REWARD_CLAIM',
        severity: AuditSeverity.HIGH,
        metadata: expect.objectContaining({ coinAmount: 200 }),
      }),
    );
  });
});
