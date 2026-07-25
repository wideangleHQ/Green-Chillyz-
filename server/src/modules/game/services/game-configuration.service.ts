import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, Game } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { GameCacheService } from './game-cache.service';
import { CreateGameDto, UpdateGameDto, GameQueryDto } from '../dto/game.dto';
import { GAME_ERRORS } from '../constants/game.constants';
import { PaginatedResponse } from '../../../common/interfaces';
import { paginate } from '../../../common/pagination/paginator';

@Injectable()
export class GameConfigurationService {
  private readonly logger = new Logger(GameConfigurationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: GameCacheService,
  ) {}

  async create(dto: CreateGameDto): Promise<Game> {
    const existing = await this.prisma.game.findFirst({
      where: {
        OR: [{ slug: dto.slug }, { name: dto.name }],
      },
      select: { id: true, slug: true },
    });

    if (existing) {
      throw new ConflictException(
        existing.slug === dto.slug
          ? 'A game with this slug already exists'
          : 'A game with this name already exists',
      );
    }

    const game = await this.prisma.game.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isActive: dto.isActive ?? true,
        dailyLimit: dto.dailyLimit ?? 0,
        cooldown: dto.cooldown ?? 0,
        minLevel: dto.minLevel ?? 0,
        maxRewards: dto.maxRewards ? new Prisma.Decimal(dto.maxRewards) : null,
        rewardType: dto.rewardType ?? 'COINS',
        rewardConfig: dto.rewardConfig ? (dto.rewardConfig as Prisma.InputJsonValue) : Prisma.JsonNull,
        storeEligibility: dto.storeEligibility ?? [],
        campaignEligibility: dto.campaignEligibility ?? [],
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    await this.cache.setGameConfig(game.slug, game);
    this.logger.log(`Game created: ${game.slug}`);
    return game;
  }

  async update(idOrSlug: string, dto: UpdateGameDto): Promise<Game> {
    const game = await this.findByIdOrSlug(idOrSlug);

    const updated = await this.prisma.game.update({
      where: { id: game.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.dailyLimit !== undefined && { dailyLimit: dto.dailyLimit }),
        ...(dto.cooldown !== undefined && { cooldown: dto.cooldown }),
        ...(dto.minLevel !== undefined && { minLevel: dto.minLevel }),
        ...(dto.maxRewards !== undefined && {
          maxRewards: dto.maxRewards !== null ? new Prisma.Decimal(dto.maxRewards) : null,
        }),
        ...(dto.rewardType !== undefined && { rewardType: dto.rewardType }),
        ...(dto.rewardConfig !== undefined && {
          rewardConfig: dto.rewardConfig as Prisma.InputJsonValue,
        }),
        ...(dto.storeEligibility !== undefined && { storeEligibility: dto.storeEligibility }),
        ...(dto.campaignEligibility !== undefined && { campaignEligibility: dto.campaignEligibility }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as Prisma.InputJsonValue }),
      },
    });

    await this.cache.invalidateGameConfig(game.slug);
    await this.cache.setGameConfig(updated.slug, updated);
    this.logger.log(`Game updated: ${updated.slug}`);
    return updated;
  }

  async findAll(query: GameQueryDto): Promise<PaginatedResponse<Game>> {
    const where: Prisma.GameWhereInput = {};
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.game.count({ where }),
    ]);

    return paginate(games, total, query.page, query.pageSize);
  }

  async findByIdOrSlug(idOrSlug: string): Promise<Game> {
    const isUuid = idOrSlug.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    if (!isUuid) {
      const cached = await this.cache.getGameConfig(idOrSlug);
      if (cached) return cached;
    }

    const game = await this.prisma.game.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!game) {
      throw new NotFoundException(GAME_ERRORS.GAME_NOT_FOUND);
    }

    if (!isUuid) {
      await this.cache.setGameConfig(game.slug, game);
    }

    return game;
  }

  async delete(idOrSlug: string): Promise<void> {
    const game = await this.findByIdOrSlug(idOrSlug);
    await this.prisma.game.delete({ where: { id: game.id } });
    await this.cache.invalidateGameConfig(game.slug);
    this.logger.log(`Game deleted: ${game.slug}`);
  }
}
