import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, DayOfWeek } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreQueryDto,
  NearbyStoreQueryDto,
  SortOrder,
  StoreSortField,
} from '../dto';
import {
  StoreResponse,
  StoreDetailResponse,
  NearbyStoreResponse,
  NearbyStoreLocatorItem,
  NearbyStoreLocatorResponse,
} from '../interfaces';
import {
  STORE_ERRORS,
  EARTH_RADIUS_KM,
  DEFAULT_SEARCH_RADIUS_KM,
} from '../constants';
import { PaginatedResponse } from '../../../common/interfaces';
import { paginate } from '../../../common/pagination/paginator';

const STORE_SELECT = {
  id: true,
  brandId: true,
  name: true,
  slug: true,
  code: true,
  description: true,
  shortDescription: true,
  email: true,
  phone: true,
  alternatePhone: true,
  website: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  googleMapsLink: true,
  placeId: true,
  thumbnailImage: true,
  coverImage: true,
  logo: true,
  isActive: true,
  isFeatured: true,
  supportsDelivery: true,
  supportsTakeaway: true,
  supportsDineIn: true,
  averageRating: true,
  totalReviews: true,
  createdAt: true,
  updatedAt: true,
  brand: { select: { name: true, slug: true } },
} as const;

const STORE_DETAIL_INCLUDE = {
  brand: { select: { name: true, slug: true } },
  timings: { orderBy: { dayOfWeek: 'asc' as const } },
  facilities: { orderBy: { name: 'asc' as const } },
  gallery: { orderBy: { displayOrder: 'asc' as const } },
  announcements: {
    where: { endDate: { gte: new Date() } },
    orderBy: { priority: 'desc' as const },
  },
} as const;

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StoreCacheService,
  ) {}

  async create(dto: CreateStoreDto, userId: string): Promise<StoreDetailResponse> {
    await this.validateUniqueFields(dto);

    const slug = await this.generateUniqueSlug(dto.name, dto.city);

    const store = await this.prisma.store.create({
      data: {
        brandId: dto.brandId,
        name: dto.name,
        slug,
        code: dto.code,
        description: dto.description,
        shortDescription: dto.shortDescription,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.website,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'India',
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        googleMapsLink: dto.googleMapsLink,
        placeId: dto.placeId,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        supportsDelivery: dto.supportsDelivery ?? false,
        supportsTakeaway: dto.supportsTakeaway ?? false,
        supportsDineIn: dto.supportsDineIn ?? true,
        createdBy: userId,
      },
      include: STORE_DETAIL_INCLUDE,
    });

    await this.cache.invalidateAll();

    return this.mapToDetailResponse(store);
  }

  async findAll(query: StoreQueryDto): Promise<PaginatedResponse<StoreResponse>> {
    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        select: STORE_SELECT,
        orderBy,
        skip: query.cursor ? undefined : query.skip,
        take: query.take,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      }),
      this.prisma.store.count({ where }),
    ]);

    const mapped = items.map((s) => this.mapToResponse(s));
    return paginate(mapped, total, query.page, query.pageSize);
  }

  async findById(id: string): Promise<StoreDetailResponse> {
    const cached = await this.cache.getStoreDetail<StoreDetailResponse>(id);
    if (cached) return cached;

    const store = await this.prisma.store.findFirst({
      where: { id, deletedAt: null },
      include: STORE_DETAIL_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }

    const response = this.mapToDetailResponse(store);
    await this.cache.setStoreDetail(id, response);
    return response;
  }

  async findBySlug(slug: string): Promise<StoreDetailResponse> {
    const cached = await this.cache.getStoreBySlug<StoreDetailResponse>(slug);
    if (cached) return cached;

    const store = await this.prisma.store.findFirst({
      where: { slug, deletedAt: null },
      include: STORE_DETAIL_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }

    const response = this.mapToDetailResponse(store);
    await this.cache.setStoreBySlug(slug, response);
    return response;
  }

  async update(
    id: string,
    dto: UpdateStoreDto,
    userId: string,
  ): Promise<StoreDetailResponse> {
    const existing = await this.prisma.store.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }

    if (dto.email && dto.email !== existing.email) {
      await this.checkUnique('email', dto.email, id);
    }
    if (dto.phone && dto.phone !== existing.phone) {
      await this.checkUnique('phone', dto.phone, id);
    }
    if (dto.code && dto.code !== existing.code) {
      await this.checkUnique('code', dto.code, id);
    }

    const data: Prisma.StoreUpdateInput = {
      ...dto,
      updatedByUser: { connect: { id: userId } },
    };

    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.generateUniqueSlug(
        dto.name,
        dto.city ?? existing.city,
        id,
      );
    }

    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;

    const store = await this.prisma.store.update({
      where: { id },
      data,
      include: STORE_DETAIL_INCLUDE,
    });

    await this.cache.invalidateStore(id, existing.slug);
    if (store.slug !== existing.slug) {
      await this.cache.invalidateStore(id, store.slug);
    }

    return this.mapToDetailResponse(store);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id, deletedAt: null },
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }

    await this.prisma.store.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
      },
    });

    await this.cache.invalidateStore(id, store.slug);
  }

  async findFeatured(): Promise<StoreResponse[]> {
    const cached = await this.cache.getFeatured<StoreResponse[]>();
    if (cached) return cached;

    const stores = await this.prisma.store.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      select: STORE_SELECT,
      orderBy: { averageRating: 'desc' },
    });

    const mapped = stores.map((s) => this.mapToResponse(s));
    await this.cache.setFeatured(mapped);
    return mapped;
  }

  async findActive(): Promise<StoreResponse[]> {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, deletedAt: null },
      select: STORE_SELECT,
      orderBy: { name: 'asc' },
    });

    return stores.map((s) => this.mapToResponse(s));
  }

  async search(query: StoreQueryDto): Promise<PaginatedResponse<StoreResponse>> {
    const cacheKey = JSON.stringify(query);
    const cached = await this.cache.getSearch<PaginatedResponse<StoreResponse>>(cacheKey);
    if (cached) return cached;

    const result = await this.findAll(query);
    await this.cache.setSearch(cacheKey, result);
    return result;
  }

  async findNearby(query: NearbyStoreQueryDto): Promise<NearbyStoreLocatorResponse> {
    const startTime = Date.now();
    const radius = query.radius ?? DEFAULT_SEARCH_RADIUS_KM;
    const limit = query.limit ?? 5;

    const roundedLat = Math.round(query.latitude * 1000) / 1000;
    const roundedLng = Math.round(query.longitude * 1000) / 1000;
    const cacheKey = `${roundedLat}:${roundedLng}:${limit}${query.brandId ? `:${query.brandId}` : ''}`;

    const cached = await this.cache.getNearby<NearbyStoreLocatorResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Nearby cache HIT [${cacheKey}] in ${Date.now() - startTime}ms`);
      return cached;
    }

    this.logger.log(`Nearby cache MISS [${cacheKey}]`);
    const dbStart = Date.now();

    const brandFilter = query.brandId
      ? Prisma.sql`AND s.brand_id = ${query.brandId}::uuid`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        address_line1: string;
        address_line2: string | null;
        city: string;
        state: string;
        latitude: string;
        longitude: string;
        google_maps_link: string | null;
        cover_image: string | null;
        logo: string | null;
        is_featured: boolean;
        supports_delivery: boolean;
        supports_takeaway: boolean;
        supports_dine_in: boolean;
        average_rating: string;
        total_reviews: number;
        brand_name: string;
        brand_slug: string;
        distance: number;
      }>
    >`
      SELECT
        s.id, s.name, s.slug, s.phone,
        s.address_line1, s.address_line2, s.city, s.state,
        s.latitude::text, s.longitude::text,
        s.google_maps_link, s.cover_image, s.logo,
        s.is_featured, s.supports_delivery, s.supports_takeaway, s.supports_dine_in,
        s.average_rating::text, s.total_reviews,
        b.name AS brand_name, b.slug AS brand_slug,
        (
          ${EARTH_RADIUS_KM} * acos(
            LEAST(1.0, cos(radians(${query.latitude})) * cos(radians(s.latitude))
            * cos(radians(s.longitude) - radians(${query.longitude}))
            + sin(radians(${query.latitude})) * sin(radians(s.latitude)))
          )
        ) AS distance
      FROM stores s
      JOIN brands b ON b.id = s.brand_id
      WHERE s.deleted_at IS NULL
        AND s.is_active = true
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
        ${brandFilter}
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    this.logger.log(`Nearby DB query returned ${rows.length} rows in ${Date.now() - dbStart}ms`);

    const calcStart = Date.now();

    const storeIds = rows.map((r) => r.id);
    const openStatusMap = await this.batchIsOpenNow(storeIds);

    const items: NearbyStoreLocatorItem[] = rows.map((r) => {
      const lat = parseFloat(r.latitude);
      const lng = parseFloat(r.longitude);
      const dist = Math.round(r.distance * 100) / 100;
      const isOpen = openStatusMap.get(r.id) ?? false;

      const address = r.address_line2
        ? `${r.address_line1}, ${r.address_line2}`
        : r.address_line1;

      const googleMapsUrl = r.google_maps_link
        || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      return {
        id: r.id,
        brand: r.brand_name,
        brandSlug: r.brand_slug,
        name: r.name,
        slug: r.slug,
        distance: dist,
        isOpenNow: isOpen,
        supportsDelivery: r.supports_delivery,
        supportsTakeaway: r.supports_takeaway,
        supportsDineIn: r.supports_dine_in,
        phone: r.phone,
        address,
        city: r.city,
        state: r.state,
        coverImage: r.cover_image,
        logo: r.logo,
        averageRating: parseFloat(r.average_rating),
        totalReviews: r.total_reviews,
        isFeatured: r.is_featured,
        latitude: lat,
        longitude: lng,
        googleMapsUrl,
      };
    });

    this.rankNearbyStores(items);

    this.logger.log(`Nearby ranking + open-now computed in ${Date.now() - calcStart}ms`);

    const result: NearbyStoreLocatorResponse = {
      nearestStore: items[0] ?? null,
      nearbyStores: items.slice(1),
      userLocation: { latitude: query.latitude, longitude: query.longitude },
      total: items.length,
    };

    await this.cache.setNearby(cacheKey, result);

    this.logger.log(`Nearby response total: ${Date.now() - startTime}ms`);
    return result;
  }

  private async batchIsOpenNow(storeIds: string[]): Promise<Map<string, boolean>> {
    if (storeIds.length === 0) return new Map();

    const now = new Date();
    const dayNames: DayOfWeek[] = [
      DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const today = dayNames[now.getDay()];
    const todayStart = new Date(now.toISOString().split('T')[0]);
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const [holidays, timings] = await Promise.all([
      this.prisma.storeHoliday.findMany({
        where: {
          storeId: { in: storeIds },
          date: { gte: todayStart, lt: todayEnd },
          isClosed: true,
        },
        select: { storeId: true },
      }),
      this.prisma.storeTiming.findMany({
        where: {
          storeId: { in: storeIds },
          dayOfWeek: today,
        },
        select: { storeId: true, opensAt: true, closesAt: true, isClosed: true },
      }),
    ]);

    const holidayStoreIds = new Set(holidays.map((h) => h.storeId));
    const timingMap = new Map(timings.map((t) => [t.storeId, t]));

    const result = new Map<string, boolean>();
    for (const id of storeIds) {
      if (holidayStoreIds.has(id)) {
        result.set(id, false);
        continue;
      }
      const timing = timingMap.get(id);
      if (!timing || timing.isClosed) {
        result.set(id, false);
        continue;
      }
      result.set(id, currentTime >= timing.opensAt && currentTime <= timing.closesAt);
    }
    return result;
  }

  private rankNearbyStores(items: NearbyStoreLocatorItem[]): void {
    items.sort((a, b) => {
      const distDiff = a.distance - b.distance;
      if (Math.abs(distDiff) > 0.5) return distDiff;

      if (a.isOpenNow !== b.isOpenNow) return a.isOpenNow ? -1 : 1;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.averageRating !== b.averageRating) return b.averageRating - a.averageRating;
      return b.totalReviews - a.totalReviews;
    });
  }

  async isOpenNow(storeId: string): Promise<boolean> {
    const now = new Date();
    const dayNames: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const today = dayNames[now.getDay()];

    const holiday = await this.prisma.storeHoliday.findFirst({
      where: {
        storeId,
        date: {
          gte: new Date(now.toISOString().split('T')[0]),
          lt: new Date(
            new Date(now.toISOString().split('T')[0]).getTime() + 86400000,
          ),
        },
        isClosed: true,
      },
    });

    if (holiday) return false;

    const timing = await this.prisma.storeTiming.findUnique({
      where: { uq_store_timing_day: { storeId, dayOfWeek: today } },
    });

    if (!timing || timing.isClosed) return false;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= timing.opensAt && currentTime <= timing.closesAt;
  }

  private buildWhereClause(query: StoreQueryDto): Prisma.StoreWhereInput {
    const where: Prisma.StoreWhereInput = { deletedAt: null };

    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.state) where.state = { contains: query.state, mode: 'insensitive' };
    if (query.brandId) where.brandId = query.brandId;
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.supportsDelivery !== undefined) where.supportsDelivery = query.supportsDelivery;
    if (query.supportsTakeaway !== undefined) where.supportsTakeaway = query.supportsTakeaway;
    if (query.supportsDineIn !== undefined) where.supportsDineIn = query.supportsDineIn;

    if (query.facilities) {
      const facilityList = query.facilities.split(',').map((f) => f.trim());
      where.facilities = {
        some: { name: { in: facilityList } },
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { state: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { brand: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    query: StoreQueryDto,
  ): Prisma.StoreOrderByWithRelationInput {
    const field = query.sortBy ?? StoreSortField.CREATED_AT;
    const order = query.sortOrder ?? SortOrder.DESC;
    return { [field]: order };
  }

  private async validateUniqueFields(dto: CreateStoreDto): Promise<void> {
    if (dto.email) await this.checkUnique('email', dto.email);
    if (dto.phone) await this.checkUnique('phone', dto.phone);
    await this.checkUnique('code', dto.code);
  }

  private async checkUnique(
    field: 'email' | 'phone' | 'code',
    value: string,
    excludeId?: string,
  ): Promise<void> {
    const where: Prisma.StoreWhereInput = {
      [field]: value,
      deletedAt: null,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.prisma.store.findFirst({ where });
    if (existing) {
      const errorMap = {
        email: STORE_ERRORS.EMAIL_EXISTS,
        phone: STORE_ERRORS.PHONE_EXISTS,
        code: STORE_ERRORS.CODE_EXISTS,
      };
      throw new ConflictException(errorMap[field]);
    }
  }

  async generateUniqueSlug(
    name: string,
    city: string,
    excludeId?: string,
  ): Promise<string> {
    const base = `${name}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = base;
    let counter = 0;

    while (true) {
      const where: Prisma.StoreWhereInput = { slug };
      if (excludeId) {
        where.id = { not: excludeId };
      }

      const exists = await this.prisma.store.findFirst({
        where,
        select: { id: true },
      });

      if (!exists) return slug;

      counter++;
      slug = `${base}-${counter}`;
    }
  }

  private mapToResponse(store: any): StoreResponse {
    return {
      id: store.id,
      brandId: store.brandId,
      brandName: store.brand.name,
      brandSlug: store.brand.slug,
      name: store.name,
      slug: store.slug,
      code: store.code,
      description: store.description,
      shortDescription: store.shortDescription,
      email: store.email,
      phone: store.phone,
      alternatePhone: store.alternatePhone,
      website: store.website,
      addressLine1: store.addressLine1,
      addressLine2: store.addressLine2,
      city: store.city,
      state: store.state,
      country: store.country,
      postalCode: store.postalCode,
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
      googleMapsLink: store.googleMapsLink,
      placeId: store.placeId,
      thumbnailImage: store.thumbnailImage,
      coverImage: store.coverImage,
      logo: store.logo,
      isActive: store.isActive,
      isFeatured: store.isFeatured,
      supportsDelivery: store.supportsDelivery,
      supportsTakeaway: store.supportsTakeaway,
      supportsDineIn: store.supportsDineIn,
      averageRating: Number(store.averageRating),
      totalReviews: store.totalReviews,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }

  private mapToDetailResponse(store: any): StoreDetailResponse {
    const base = this.mapToResponse(store);
    return {
      ...base,
      timings: (store.timings ?? []).map((t: any) => ({
        id: t.id,
        dayOfWeek: t.dayOfWeek,
        opensAt: t.opensAt,
        closesAt: t.closesAt,
        isClosed: t.isClosed,
      })),
      facilities: (store.facilities ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        icon: f.icon,
      })),
      gallery: (store.gallery ?? []).map((g: any) => ({
        id: g.id,
        image: g.image,
        alt: g.alt,
        displayOrder: g.displayOrder,
        createdAt: g.createdAt,
      })),
      announcements: (store.announcements ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        startDate: a.startDate,
        endDate: a.endDate,
        priority: a.priority,
        isActive: new Date() >= a.startDate && new Date() <= a.endDate,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    };
  }
}
