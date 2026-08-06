import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Decimal } from '@prisma/client/runtime/library';
import {
  ChallengeProgressStatus,
  ChallengeStatus,
} from '../enums';
import { ChallengeRepository } from '../repositories';
import { ChallengeProgressRepository } from '../repositories';
import { ChallengeCacheService } from '../cache';
import {
  CHALLENGE_ERRORS,
  CHALLENGE_EVENTS,
  CHALLENGE_DEFAULTS,
} from '../constants';
import {
  ChallengeStartedEvent,
  ChallengeProgressedEvent,
  ChallengeCompletedEvent,
  ChallengeExpiredEvent,
} from '../events';
import { RecordProgressDto, CustomerChallengeQueryDto } from '../dto';
import {
  ChallengeProgressResponse,
  CustomerChallengeView,
  PagedResult,
} from '../interfaces';

@Injectable()
export class ChallengeProgressService {
  private readonly logger = new Logger(ChallengeProgressService.name);

  constructor(
    private readonly challengeRepo: ChallengeRepository,
    private readonly progressRepo: ChallengeProgressRepository,
    private readonly cache: ChallengeCacheService,
    private readonly events: EventEmitter2,
  ) {}

  async getActiveChallenges(
    userId: string,
    query: CustomerChallengeQueryDto,
  ): Promise<CustomerChallengeView[]> {
    const cached = await this.cache.getCustomerChallenges<CustomerChallengeView[]>(userId);
    if (cached && query.activeOnly && !query.storeId) return cached;

    const now = new Date();
    const challenges = await this.challengeRepo.findActive(now);

    const filtered = challenges.filter((c) => {
      if (query.storeId && c.storeIds.length > 0 && !c.storeIds.includes(query.storeId!)) {
        return false;
      }
      return true;
    });

    const progressRecords = await this.progressRepo.findByUser(userId);
    const progressMap = new Map(progressRecords.map((p) => [p.challengeId, p]));

    const views: CustomerChallengeView[] = [];
    for (const challenge of filtered) {
      let progress = progressMap.get(challenge.id);

      if (!progress && challenge.autoEnroll) {
        const firstRule = challenge.rules[0];
        progress = await this.progressRepo.create({
          challenge: { connect: { id: challenge.id } },
          userId,
          status: ChallengeProgressStatus.NOT_STARTED,
          currentProgress: 0,
          currentAmount: 0,
          targetCount: firstRule?.targetCount ?? 1,
          targetAmount: firstRule?.targetAmount ?? null,
          expiresAt: challenge.endsAt,
        });

        await this.challengeRepo.incrementParticipants(challenge.id);

        this.events.emit(
          CHALLENGE_EVENTS.STARTED,
          new ChallengeStartedEvent(challenge.id, userId, challenge.name),
        );
      }

      const currentProgress = progress?.currentProgress ?? 0;
      const targetCount = progress?.targetCount ?? challenge.rules[0]?.targetCount ?? 1;

      views.push({
        challengeId: challenge.id,
        name: challenge.name,
        description: challenge.description,
        shortDescription: challenge.shortDescription,
        image: challenge.image,
        icon: challenge.icon,
        type: challenge.type,
        isFeatured: challenge.isFeatured,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        status: progress?.status ?? ChallengeProgressStatus.NOT_STARTED,
        currentProgress,
        targetCount,
        currentAmount: progress?.currentAmount ?? 0,
        targetAmount: progress?.targetAmount ?? null,
        completedAt: progress?.completedAt ?? null,
        rewardClaimedAt: progress?.rewardClaimedAt ?? null,
        rewards: challenge.rewards,
        percentComplete: targetCount > 0
          ? Math.min(100, Math.round((currentProgress / targetCount) * 100))
          : 0,
      });
    }

    if (query.activeOnly && !query.storeId) {
      await this.cache.setCustomerChallenges(userId, views);
    }

    return views;
  }

  async recordProgress(
    userId: string,
    dto: RecordProgressDto,
  ): Promise<ChallengeProgressResponse> {
    const challenge = await this.challengeRepo.findById(dto.challengeId);
    if (!challenge) throw new NotFoundException(CHALLENGE_ERRORS.NOT_FOUND);

    if (
      challenge.status !== ChallengeStatus.ACTIVE &&
      challenge.status !== ChallengeStatus.PUBLISHED
    ) {
      throw new BadRequestException(CHALLENGE_ERRORS.CHALLENGE_NOT_ACTIVE);
    }

    const now = new Date();
    if (now < challenge.startsAt || now > challenge.endsAt) {
      throw new BadRequestException(CHALLENGE_ERRORS.CHALLENGE_EXPIRED);
    }

    if (
      challenge.maxParticipants !== null &&
      challenge.currentParticipants >= challenge.maxParticipants
    ) {
      let progress = await this.progressRepo.findByUserAndChallenge(userId, dto.challengeId);
      if (!progress) {
        throw new BadRequestException(CHALLENGE_ERRORS.MAX_PARTICIPANTS_REACHED);
      }
    }

    let progress = await this.progressRepo.findByUserAndChallenge(userId, dto.challengeId);

    if (!progress) {
      const firstRule = challenge.rules[0];
      progress = await this.progressRepo.create({
        challenge: { connect: { id: dto.challengeId } },
        userId,
        status: ChallengeProgressStatus.IN_PROGRESS,
        currentProgress: 0,
        currentAmount: 0,
        targetCount: firstRule?.targetCount ?? 1,
        targetAmount: firstRule?.targetAmount ?? null,
        expiresAt: challenge.endsAt,
      });

      await this.challengeRepo.incrementParticipants(dto.challengeId);

      this.events.emit(
        CHALLENGE_EVENTS.STARTED,
        new ChallengeStartedEvent(dto.challengeId, userId, challenge.name),
      );
    }

    if (progress.status === ChallengeProgressStatus.COMPLETED ||
        progress.status === ChallengeProgressStatus.REWARD_CLAIMED) {
      throw new BadRequestException(CHALLENGE_ERRORS.ALREADY_COMPLETED);
    }

    if (progress.expiresAt && now > progress.expiresAt) {
      await this.progressRepo.update(progress.id, {
        status: ChallengeProgressStatus.EXPIRED,
      });
      throw new BadRequestException(CHALLENGE_ERRORS.CHALLENGE_EXPIRED);
    }

    const incrementBy = dto.incrementBy ?? 1;
    const newProgress = progress.currentProgress + incrementBy;
    const newAmount = new Decimal(progress.currentAmount).add(dto.amount ?? 0);

    const isComplete = newProgress >= progress.targetCount;

    const updated = await this.progressRepo.update(progress.id, {
      currentProgress: newProgress,
      currentAmount: newAmount,
      status: isComplete
        ? ChallengeProgressStatus.COMPLETED
        : ChallengeProgressStatus.IN_PROGRESS,
      completedAt: isComplete ? now : undefined,
    });

    await this.cache.invalidateCustomer(userId);

    this.events.emit(
      CHALLENGE_EVENTS.PROGRESSED,
      new ChallengeProgressedEvent(
        dto.challengeId,
        userId,
        newProgress,
        progress.targetCount,
      ),
    );

    if (isComplete) {
      this.events.emit(
        CHALLENGE_EVENTS.COMPLETED,
        new ChallengeCompletedEvent(dto.challengeId, userId, challenge.name),
      );
    }

    return updated as ChallengeProgressResponse;
  }

  async getProgress(
    userId: string,
    challengeId: string,
  ): Promise<ChallengeProgressResponse> {
    const cached = await this.cache.getProgress<ChallengeProgressResponse>(userId, challengeId);
    if (cached) return cached;

    const progress = await this.progressRepo.findByUserAndChallenge(userId, challengeId);
    if (!progress) throw new NotFoundException(CHALLENGE_ERRORS.PROGRESS_NOT_FOUND);

    await this.cache.setProgress(userId, challengeId, progress);
    return progress as ChallengeProgressResponse;
  }

  async getHistory(
    userId: string,
    page: number = 1,
    pageSize: number = CHALLENGE_DEFAULTS.PAGE_SIZE,
  ): Promise<PagedResult<ChallengeProgressResponse>> {
    const safePageSize = Math.min(pageSize, CHALLENGE_DEFAULTS.MAX_PAGE_SIZE);
    const skip = (page - 1) * safePageSize;

    const [items, total] = await this.progressRepo.findCompletedHistory(
      userId,
      skip,
      safePageSize,
    );

    return {
      items: items as ChallengeProgressResponse[],
      total,
      page,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  async getUpcomingChallenges(userId: string): Promise<CustomerChallengeView[]> {
    const now = new Date();
    const challenges = await this.challengeRepo.findUpcoming(now);

    return challenges.map((c) => ({
      challengeId: c.id,
      name: c.name,
      description: c.description,
      shortDescription: c.shortDescription,
      image: c.image,
      icon: c.icon,
      type: c.type,
      isFeatured: c.isFeatured,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      status: ChallengeProgressStatus.NOT_STARTED,
      currentProgress: 0,
      targetCount: c.rules[0]?.targetCount ?? 1,
      currentAmount: 0,
      targetAmount: c.rules[0]?.targetAmount ?? null,
      completedAt: null,
      rewardClaimedAt: null,
      rewards: c.rewards,
      percentComplete: 0,
    }));
  }

  async expireStale(): Promise<number> {
    const now = new Date();
    const expired = await this.progressRepo.findExpired(now);

    let count = 0;
    for (const p of expired) {
      await this.progressRepo.update(p.id, {
        status: ChallengeProgressStatus.EXPIRED,
      });

      this.events.emit(
        CHALLENGE_EVENTS.EXPIRED,
        new ChallengeExpiredEvent(p.challengeId, p.userId),
      );

      await this.cache.invalidateCustomer(p.userId);
      count++;
    }

    return count;
  }
}
