import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreService } from './store.service';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import type { NearbyStoreLocatorItem } from '../interfaces';

describe('Nearby Store Locator', () => {
  let service: StoreService;
  let prisma: any;
  let cache: any;

  const makeRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'store-1',
    name: 'Store One',
    slug: 'store-one',
    phone: '+911234567890',
    address_line1: '123 Main St',
    address_line2: null,
    city: 'Bhubaneswar',
    state: 'Odisha',
    latitude: '20.2961',
    longitude: '85.8245',
    google_maps_link: null,
    cover_image: null,
    logo: null,
    is_featured: false,
    supports_delivery: true,
    supports_takeaway: false,
    supports_dine_in: true,
    average_rating: '4.5',
    total_reviews: 100,
    brand_name: 'GreenChillyz',
    brand_slug: 'greenchillyz',
    distance: 1.5,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      store: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      storeTiming: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      storeHoliday: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    cache = {
      getStoreDetail: vi.fn().mockResolvedValue(null),
      setStoreDetail: vi.fn(),
      getStoreBySlug: vi.fn().mockResolvedValue(null),
      setStoreBySlug: vi.fn(),
      getList: vi.fn().mockResolvedValue(null),
      setList: vi.fn(),
      getFeatured: vi.fn().mockResolvedValue(null),
      setFeatured: vi.fn(),
      getNearby: vi.fn().mockResolvedValue(null),
      setNearby: vi.fn(),
      getSearch: vi.fn().mockResolvedValue(null),
      setSearch: vi.fn(),
      invalidateStore: vi.fn(),
      invalidateAll: vi.fn(),
    };
    service = new StoreService(
      prisma as unknown as PrismaService,
      cache as unknown as StoreCacheService,
    );
  });

  describe('distance calculation', () => {
    it('should round distance to 2 decimal places', async () => {
      prisma.$queryRaw.mockResolvedValue([makeRow({ distance: 3.456789 })]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.distance).toBe(3.46);
    });

    it('should handle zero distance', async () => {
      prisma.$queryRaw.mockResolvedValue([makeRow({ distance: 0 })]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.distance).toBe(0);
    });

    it('should handle very small distances (< 1km)', async () => {
      prisma.$queryRaw.mockResolvedValue([makeRow({ distance: 0.15 })]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.distance).toBe(0.15);
    });
  });

  describe('ranking', () => {
    it('should rank by distance primarily', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 'far', name: 'Far Store', distance: 5.0 }),
        makeRow({ id: 'close', name: 'Close Store', distance: 1.0 }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.id).toBe('close');
      expect(result.nearbyStores[0].id).toBe('far');
    });

    it('should prefer open stores when distances are close (within 0.5km)', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 'closed-near', distance: 1.0 }),
        makeRow({ id: 'open-near', distance: 1.3 }),
      ]);
      prisma.storeTiming.findMany.mockResolvedValue([
        {
          storeId: 'open-near',
          opensAt: '00:00',
          closesAt: '23:59',
          isClosed: false,
        },
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.id).toBe('open-near');
      expect(result.nearestStore!.isOpenNow).toBe(true);
    });

    it('should prefer featured stores when distance and open status are equal', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 'normal', distance: 1.0, is_featured: false }),
        makeRow({ id: 'featured', distance: 1.0, is_featured: true }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.id).toBe('featured');
    });

    it('should prefer higher rated stores as final tiebreaker', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 'low-rated', distance: 1.0, average_rating: '3.5', total_reviews: 100 }),
        makeRow({ id: 'high-rated', distance: 1.0, average_rating: '4.9', total_reviews: 200 }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.id).toBe('high-rated');
    });

    it('should not rerank when distance difference > 0.5km', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 'close', distance: 1.0, is_featured: false, average_rating: '3.0' }),
        makeRow({ id: 'far-but-better', distance: 2.0, is_featured: true, average_rating: '5.0' }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.id).toBe('close');
    });
  });

  describe('isOpenNow batch computation', () => {
    it('should mark stores on holiday as closed', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 'store-holiday' }),
      ]);
      prisma.storeHoliday.findMany.mockResolvedValue([
        { storeId: 'store-holiday' },
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.isOpenNow).toBe(false);
    });

    it('should mark stores without timings as closed', async () => {
      prisma.$queryRaw.mockResolvedValue([makeRow()]);
      prisma.storeTiming.findMany.mockResolvedValue([]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.isOpenNow).toBe(false);
    });

    it('should batch check multiple stores in parallel', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 's1', distance: 1.0 }),
        makeRow({ id: 's2', distance: 2.0 }),
        makeRow({ id: 's3', distance: 3.0 }),
      ]);

      await service.findNearby({ latitude: 20.3, longitude: 85.8 });

      expect(prisma.storeHoliday.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: { in: ['s1', 's2', 's3'] },
          }),
        }),
      );
      expect(prisma.storeTiming.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: { in: ['s1', 's2', 's3'] },
          }),
        }),
      );
    });
  });

  describe('Google Maps URL generation', () => {
    it('should reuse existing Google Maps link', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ google_maps_link: 'https://www.google.com/maps/place/?q=place_id:abc123' }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.googleMapsUrl).toBe(
        'https://www.google.com/maps/place/?q=place_id:abc123',
      );
    });

    it('should generate navigation URL when no Maps link exists', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({
          google_maps_link: null,
          latitude: '20.2961',
          longitude: '85.8245',
        }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.googleMapsUrl).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=20.2961,85.8245',
      );
    });
  });

  describe('address formatting', () => {
    it('should concatenate address lines when both present', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ address_line1: '123 Main St', address_line2: 'Suite 4B' }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.address).toBe('123 Main St, Suite 4B');
    });

    it('should use only addressLine1 when addressLine2 is null', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ address_line1: '456 Oak Ave', address_line2: null }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      expect(result.nearestStore!.address).toBe('456 Oak Ave');
    });
  });

  describe('response structure', () => {
    it('should return nearestStore as first item', async () => {
      prisma.$queryRaw.mockResolvedValue([
        makeRow({ id: 's1', distance: 1.0 }),
        makeRow({ id: 's2', distance: 2.0 }),
        makeRow({ id: 's3', distance: 3.0 }),
      ]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });

      expect(result.nearestStore).not.toBeNull();
      expect(result.nearbyStores).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should include userLocation from query params', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.findNearby({
        latitude: 20.2961,
        longitude: 85.8245,
      });

      expect(result.userLocation).toEqual({
        latitude: 20.2961,
        longitude: 85.8245,
      });
    });

    it('should return null nearestStore when no stores found', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.findNearby({ latitude: 0, longitude: 0 });

      expect(result.nearestStore).toBeNull();
      expect(result.nearbyStores).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should include all required fields in store items', async () => {
      prisma.$queryRaw.mockResolvedValue([makeRow()]);

      const result = await service.findNearby({ latitude: 20.3, longitude: 85.8 });
      const store = result.nearestStore!;

      expect(store).toHaveProperty('id');
      expect(store).toHaveProperty('brand');
      expect(store).toHaveProperty('brandSlug');
      expect(store).toHaveProperty('name');
      expect(store).toHaveProperty('slug');
      expect(store).toHaveProperty('distance');
      expect(store).toHaveProperty('isOpenNow');
      expect(store).toHaveProperty('supportsDelivery');
      expect(store).toHaveProperty('supportsTakeaway');
      expect(store).toHaveProperty('supportsDineIn');
      expect(store).toHaveProperty('phone');
      expect(store).toHaveProperty('address');
      expect(store).toHaveProperty('city');
      expect(store).toHaveProperty('state');
      expect(store).toHaveProperty('coverImage');
      expect(store).toHaveProperty('logo');
      expect(store).toHaveProperty('averageRating');
      expect(store).toHaveProperty('totalReviews');
      expect(store).toHaveProperty('isFeatured');
      expect(store).toHaveProperty('latitude');
      expect(store).toHaveProperty('longitude');
      expect(store).toHaveProperty('googleMapsUrl');
    });
  });

  describe('caching', () => {
    it('should return cached result on hit', async () => {
      const cachedResult = {
        nearestStore: { id: 'cached-store', distance: 1.0 },
        nearbyStores: [],
        userLocation: { latitude: 20.296, longitude: 85.825 },
        total: 1,
      };
      cache.getNearby.mockResolvedValue(cachedResult);

      const result = await service.findNearby({ latitude: 20.296, longitude: 85.825 });

      expect(result).toEqual(cachedResult);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should cache with rounded coordinate key', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.findNearby({ latitude: 20.29614, longitude: 85.82453 });

      expect(cache.getNearby).toHaveBeenCalledWith('20.296:85.825:5');
      expect(cache.setNearby).toHaveBeenCalledWith('20.296:85.825:5', expect.any(Object));
    });

    it('should include brandId in cache key when provided', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.findNearby({
        latitude: 20.296,
        longitude: 85.825,
        brandId: 'brand-uuid-123',
      });

      expect(cache.getNearby).toHaveBeenCalledWith('20.296:85.825:5:brand-uuid-123');
    });

    it('should cache result after DB query', async () => {
      prisma.$queryRaw.mockResolvedValue([makeRow()]);

      await service.findNearby({ latitude: 20.3, longitude: 85.8 });

      expect(cache.setNearby).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nearestStore: expect.any(Object),
          nearbyStores: expect.any(Array),
          userLocation: expect.any(Object),
          total: expect.any(Number),
        }),
      );
    });
  });

  describe('store filtering', () => {
    it('should default limit to 5', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.findNearby({ latitude: 20.3, longitude: 85.8 });

      expect(cache.getNearby).toHaveBeenCalledWith('20.3:85.8:5');
    });

    it('should respect custom limit', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.findNearby({ latitude: 20.3, longitude: 85.8, limit: 10 });

      expect(cache.getNearby).toHaveBeenCalledWith('20.3:85.8:10');
    });
  });
});
