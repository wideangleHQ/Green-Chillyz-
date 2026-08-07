import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Reward, RewardStatus, AuditActorType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination/paginator';
import { PaginatedResponse } from '../../../common/interfaces';
import { RewardsCacheService } from './rewards-cache.service';
import {
  CreateRewardDto,
  UpdateRewardDto,
  RewardQueryDto,
  AdminRewardQueryDto,
  CreateRewardCategoryDto,
  UpdateRewardCategoryDto,
} from '../dto';
import {
  RewardListItem,
  RewardDetail,
  RewardCategoryResponse,
} from '../interfaces';
import { REWARDS_ERRORS, REWARDS_DEFAULTS, REWARDS_SORT } from '../constants';
import { AUDIT_EVENTS, AUDIT_ENTITY_TYPES } from '../../audit/constants';
import { EntityMutationAuditEvent } from '../../audit/events';

const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  image: true,
  coinCost: true,
  rewardType: true,
  availability: true,
  status: true,
  isFeatured: true,
  priority: true,
  stock: true,
  validUntil: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true } },
} satisfies Prisma.RewardSelect;

type RewardListRow = Prisma.RewardGetPayload<{ select: typeof LIST_SELECT }>;

@Injectable()
export class RewardCatalogService {
  private readonly logger = new Logger(RewardCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RewardsCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Customer-facing catalog ──────────────────────────

  async listCatalog(query: RewardQueryDto): Promise<PaginatedResponse<RewardListItem>> {
    const cacheKey = this.cache.buildCatalogKey({ ...query, page: query.page, pageSize: query.pageSize });
    const cached = await this.cache.getCatalog<PaginatedResponse<RewardListItem>>(cacheKey);
    if (cached) return cached;

    const where = await this.buildCatalogWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        select: LIST_SELECT,
        orderBy: this.buildOrderBy(query.sort),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.reward.count({ where }),
    ]);

    const result = paginate(
      rows.map((r) => this.toListItem(r)),
      total,
      query.page,
      query.pageSize,
    );

    await this.cache.setCatalog(cacheKey, result);
    return result;
  }

  async getFeatured(): Promise<RewardListItem[]> {
    const cached = await this.cache.getFeatured<RewardListItem[]>();
    if (cached) return cached;

    const rows = await this.prisma.reward.findMany({
      where: { ...this.publishedWhere(), isFeatured: true },
      select: LIST_SELECT,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: REWARDS_DEFAULTS.FEATURED_LIMIT,
    });

    const items = rows.map((r) => this.toListItem(r));
    await this.cache.setFeatured(items);
    return items;
  }

  async getPopular(): Promise<RewardListItem[]> {
    const cached = await this.cache.getPopular<RewardListItem[]>();
    if (cached) return cached;

    const rows = await this.prisma.reward.findMany({
      where: this.publishedWhere(),
      select: LIST_SELECT,
      orderBy: [{ totalRedemptions: 'desc' }, { priority: 'desc' }],
      take: REWARDS_DEFAULTS.POPULAR_LIMIT,
    });

    const items = rows.map((r) => this.toListItem(r));
    await this.cache.setPopular(items);
    return items;
  }

  async getRelated(rewardId: string, categoryId: string | null): Promise<RewardListItem[]> {
    const rows = await this.prisma.reward.findMany({
      where: {
        ...this.publishedWhere(),
        id: { not: rewardId },
        ...(categoryId && { categoryId }),
      },
      select: LIST_SELECT,
      orderBy: [{ priority: 'desc' }, { totalRedemptions: 'desc' }],
      take: REWARDS_DEFAULTS.RELATED_LIMIT,
    });
    return rows.map((r) => this.toListItem(r));
  }

  async getFeaturedForStore(storeId: string): Promise<RewardListItem[]> {
    const rows = await this.prisma.reward.findMany({
      where: { ...this.publishedWhereForStore(storeId), isFeatured: true },
      select: LIST_SELECT,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: REWARDS_DEFAULTS.FEATURED_LIMIT,
    });
    return rows.map((r) => this.toListItem(r));
  }

  async getPopularForStore(storeId: string): Promise<RewardListItem[]> {
    const rows = await this.prisma.reward.findMany({
      where: this.publishedWhereForStore(storeId),
      select: LIST_SELECT,
      orderBy: [{ totalRedemptions: 'desc' }, { priority: 'desc' }],
      take: REWARDS_DEFAULTS.POPULAR_LIMIT,
    });
    return rows.map((r) => this.toListItem(r));
  }

  async getRelatedForStore(
    rewardId: string,
    categoryId: string | null,
    storeId: string,
  ): Promise<RewardListItem[]> {
    const rows = await this.prisma.reward.findMany({
      where: {
        ...this.publishedWhereForStore(storeId),
        id: { not: rewardId },
        ...(categoryId && { categoryId }),
      },
      select: LIST_SELECT,
      orderBy: [{ priority: 'desc' }, { totalRedemptions: 'desc' }],
      take: REWARDS_DEFAULTS.RELATED_LIMIT,
    });
    return rows.map((r) => this.toListItem(r));
  }

  async getDetail(idOrSlug: string): Promise<RewardDetail> {
    const cached = await this.cache.getDetail<RewardDetail>(idOrSlug);
    if (cached) return cached;

    const reward = await this.findRawByIdOrSlug(idOrSlug, {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true } },
      storeLinks: {
        where: { isActive: true },
        select: { store: { select: { id: true, name: true, city: true } } },
      },
    });

    if (!reward) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    const detail = this.toDetail(reward);
    await this.cache.setDetail(idOrSlug, detail);
    return detail;
  }

  async getDetailForStore(
    idOrSlug: string,
    storeId: string,
  ): Promise<RewardDetail> {
    const reward = await this.findRawByIdOrSlug(idOrSlug, {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true } },
      storeLinks: {
        where: { isActive: true },
        select: { store: { select: { id: true, name: true, city: true } } },
      },
    });

    if (!reward || !this.isPublishedForStore(reward, storeId)) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    return this.toDetail(reward);
  }

  /** Raw entity for the redemption path — never cached, always fresh. */
  async findRewardForRedemption(idOrSlug: string): Promise<Reward> {
    const reward = await this.findRawByIdOrSlug(idOrSlug);
    if (!reward) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }
    return reward as Reward;
  }

  // ─── Categories ───────────────────────────────────────

  async listCategories(): Promise<RewardCategoryResponse[]> {
    const cached = await this.cache.getCategories<RewardCategoryResponse[]>();
    if (cached) return cached;

    const categories = await this.prisma.rewardCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { rewards: { where: { status: RewardStatus.PUBLISHED } } } },
      },
    });

    const items = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      sortOrder: c.sortOrder,
      rewardCount: c._count.rewards,
    }));

    await this.cache.setCategories(items);
    return items;
  }

  async createCategory(dto: CreateRewardCategoryDto): Promise<RewardCategoryResponse> {
    const existing = await this.prisma.rewardCategory.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(REWARDS_ERRORS.CATEGORY_SLUG_EXISTS);
    }

    const category = await this.prisma.rewardCategory.create({ data: dto });
    await this.cache.invalidateCategories();

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder,
    };
  }

  async updateCategory(
    id: string,
    dto: UpdateRewardCategoryDto,
  ): Promise<RewardCategoryResponse> {
    await this.ensureCategoryExists(id);

    const category = await this.prisma.rewardCategory.update({
      where: { id },
      data: dto,
    });
    await this.cache.invalidateCategories();

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder,
    };
  }

  // ─── Admin reward management ──────────────────────────

  async listAdmin(query: AdminRewardQueryDto): Promise<PaginatedResponse<RewardListItem>> {
    const where: Prisma.RewardWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.brandId && { brandId: query.brandId }),
      ...(query.rewardType && { rewardType: query.rewardType }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.storeId && {
        storeLinks: { some: { storeId: query.storeId, isActive: true } },
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        select: LIST_SELECT,
        orderBy: this.buildOrderBy(query.sort),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.reward.count({ where }),
    ]);

    return paginate(rows.map((r) => this.toListItem(r)), total, query.page, query.pageSize);
  }

  async create(dto: CreateRewardDto, createdBy: string): Promise<RewardDetail> {
    const existing = await this.prisma.reward.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(REWARDS_ERRORS.SLUG_EXISTS);
    }

    this.assertValidWindow(dto.validFrom, dto.validUntil);

    const { storeIds, metadata, validFrom, validUntil, ...rest } = dto;

    const reward = await this.prisma.reward.create({
      data: {
        ...rest,
        createdBy,
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        ...(storeIds?.length && {
          storeLinks: { create: storeIds.map((storeId) => ({ storeId })) },
        }),
      },
      select: { id: true, slug: true },
    });

    await this.cache.invalidateListings();
    this.logger.log(`Reward created: ${reward.slug} by ${createdBy}`);

    this.emitMutationAudit(
      AUDIT_EVENTS.REWARD_CREATED, reward.id, 'CREATE', createdBy, null,
      { title: dto.title, slug: dto.slug, coinCost: dto.coinCost },
    );

    return this.getDetail(reward.id);
  }

  async createForStore(
    dto: CreateRewardDto,
    storeId: string,
    createdBy: string,
  ): Promise<RewardDetail> {
    return this.create({ ...dto, storeIds: [storeId] }, createdBy);
  }

  async update(id: string, dto: UpdateRewardDto): Promise<RewardDetail> {
    const existing = await this.prisma.reward.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    this.assertValidWindow(dto.validFrom, dto.validUntil);

    const { storeIds, metadata, validFrom, validUntil, ...rest } = dto;

    await this.prisma.reward.update({
      where: { id },
      data: {
        ...rest,
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(metadata !== undefined && {
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        }),
        ...(storeIds && {
          storeLinks: {
            deleteMany: {},
            create: storeIds.map((storeId) => ({ storeId })),
          },
        }),
      },
    });

    await this.cache.invalidateReward(id, existing.slug);
    this.logger.log(`Reward updated: ${existing.slug}`);

    this.emitMutationAudit(
      AUDIT_EVENTS.REWARD_UPDATED, id, 'UPDATE', null, null,
      { ...rest, slug: existing.slug },
    );

    return this.getDetail(id);
  }

  async updateForStore(
    id: string,
    dto: UpdateRewardDto,
    storeId: string,
  ): Promise<RewardDetail> {
    if (!(await this.isAvailableAtStore(id, storeId))) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    const { storeIds: _storeIds, ...safeDto } = dto;
    return this.update(id, safeDto);
  }

  async isAvailableAtStore(rewardId: string, storeId: string): Promise<boolean> {
    const link = await this.prisma.rewardStoreAvailability.findFirst({
      where: { rewardId, storeId, isActive: true },
      select: { id: true },
    });
    return !!link;
  }

  async updateStatus(id: string, status: RewardStatus): Promise<RewardDetail> {
    const existing = await this.prisma.reward.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    await this.prisma.reward.update({ where: { id }, data: { status } });
    await this.cache.invalidateReward(id, existing.slug);
    this.logger.log(`Reward ${existing.slug} status -> ${status}`);

    return this.getDetail(id);
  }

  async adjustStock(id: string, stock: number): Promise<RewardDetail> {
    const existing = await this.prisma.reward.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    await this.prisma.reward.update({ where: { id }, data: { stock } });
    await this.cache.invalidateReward(id, existing.slug);

    return this.getDetail(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.reward.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      throw new NotFoundException(REWARDS_ERRORS.REWARD_NOT_FOUND);
    }

    // Redemptions reference rewards with Restrict, so archive instead of
    // destroying history once a reward has been redeemed.
    const redemptionCount = await this.prisma.rewardRedemption.count({
      where: { rewardId: id },
    });

    if (redemptionCount > 0) {
      await this.prisma.reward.update({
        where: { id },
        data: { status: RewardStatus.ARCHIVED },
      });
    } else {
      await this.prisma.reward.delete({ where: { id } });
    }

    await this.cache.invalidateReward(id, existing.slug);

    this.emitMutationAudit(
      AUDIT_EVENTS.REWARD_DELETED, id, 'DELETE', null,
      { slug: existing.slug, archived: redemptionCount > 0 }, null,
    );
  }

  /** Reward changes are business-significant; the audit module records them. */
  private emitMutationAudit(
    eventType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    actorUserId: string | null,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
  ): void {
    this.eventEmitter.emit(
      eventType,
      new EntityMutationAuditEvent(
        eventType,
        AUDIT_ENTITY_TYPES.REWARD,
        entityId,
        action,
        actorUserId,
        AuditActorType.CORPORATE_ADMIN,
        oldValue,
        newValue,
      ),
    );
  }

  // ─── Helpers ──────────────────────────────────────────

  private publishedWhere(): Prisma.RewardWhereInput {
    const now = new Date();
    return {
      status: RewardStatus.PUBLISHED,
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      ],
    };
  }

  private publishedWhereForStore(storeId: string): Prisma.RewardWhereInput {
    return {
      ...this.publishedWhere(),
      storeLinks: { some: { storeId, isActive: true } },
    };
  }

  private async buildCatalogWhere(query: RewardQueryDto): Promise<Prisma.RewardWhereInput> {
    const where: Prisma.RewardWhereInput = { ...this.publishedWhere() };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.brandId) where.brandId = query.brandId;
    if (query.rewardType) where.rewardType = query.rewardType;
    if (query.featuredOnly) where.isFeatured = true;
    if (query.maxCoinCost !== undefined) {
      where.coinCost = { lte: query.maxCoinCost };
    }
    if (query.storeId) {
      where.storeLinks = { some: { storeId: query.storeId, isActive: true } };
    } else {
      where.id = { equals: '__store_required__' };
    }

    return where;
  }

  private isPublishedForStore(row: Record<string, any>, storeId: string): boolean {
    const now = Date.now();
    const validFrom = row.validFrom ? new Date(row.validFrom).getTime() : null;
    const validUntil = row.validUntil ? new Date(row.validUntil).getTime() : null;

    return (
      row.status === RewardStatus.PUBLISHED &&
      (validFrom === null || validFrom <= now) &&
      (validUntil === null || validUntil >= now) &&
      (row.storeLinks ?? []).some(
        (link: { store?: { id?: string } }) => link.store?.id === storeId,
      )
    );
  }

  private buildOrderBy(sort?: string): Prisma.RewardOrderByWithRelationInput[] {
    switch (sort) {
      case REWARDS_SORT.COIN_COST_ASC:
        return [{ coinCost: 'asc' }, { priority: 'desc' }];
      case REWARDS_SORT.COIN_COST_DESC:
        return [{ coinCost: 'desc' }, { priority: 'desc' }];
      case REWARDS_SORT.NEWEST:
        return [{ createdAt: 'desc' }];
      case REWARDS_SORT.POPULAR:
        return [{ totalRedemptions: 'desc' }, { priority: 'desc' }];
      default:
        return [{ isFeatured: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }];
    }
  }

  private async findRawByIdOrSlug(
    idOrSlug: string,
    include?: Prisma.RewardInclude,
  ): Promise<Record<string, unknown> | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    return this.prisma.reward.findUnique({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      ...(include && { include }),
    }) as Promise<Record<string, unknown> | null>;
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    const category = await this.prisma.rewardCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException(REWARDS_ERRORS.CATEGORY_NOT_FOUND);
    }
  }

  private assertValidWindow(validFrom?: string, validUntil?: string): void {
    if (validFrom && validUntil && new Date(validUntil) <= new Date(validFrom)) {
      throw new BadRequestException(REWARDS_ERRORS.INVALID_DATE_RANGE);
    }
  }

  private toListItem(row: RewardListRow): RewardListItem {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.shortDescription,
      image: row.image,
      coinCost: row.coinCost,
      rewardType: row.rewardType,
      availability: row.availability,
      status: row.status,
      isFeatured: row.isFeatured,
      priority: row.priority,
      remainingStock: row.stock,
      category: row.category,
      brand: row.brand,
      validUntil: row.validUntil,
    };
  }

  private toDetail(row: Record<string, any>): RewardDetail {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.shortDescription,
      description: row.description,
      image: row.image,
      bannerImage: row.bannerImage,
      coinCost: row.coinCost,
      cashAmount: row.cashAmount !== null ? Number(row.cashAmount) : null,
      rewardType: row.rewardType,
      availability: row.availability,
      status: row.status,
      isFeatured: row.isFeatured,
      priority: row.priority,
      remainingStock: row.stock,
      category: row.category ?? null,
      brand: row.brand ?? null,
      terms: row.terms,
      userLimit: row.userLimit,
      dailyLimit: row.dailyLimit,
      minimumLoyaltyTier: row.minimumLoyaltyTier,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      voucherValidDays: row.voucherValidDays,
      totalRedemptions: row.totalRedemptions,
      stores: (row.storeLinks ?? []).map((l: { store: { id: string; name: string; city: string | null } }) => l.store),
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  }
}
