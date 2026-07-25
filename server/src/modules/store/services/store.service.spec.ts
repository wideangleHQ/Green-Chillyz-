import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import { DayOfWeek } from '@prisma/client';

describe('StoreService', () => {
  let service: StoreService;
  let prisma: any;
  let cache: any;

  const storeId = 'store-uuid';
  const userId = 'user-uuid';
  const brandId = 'brand-uuid';

  const mockStoreData = {
    id: storeId,
    brandId,
    name: 'Test Store',
    slug: 'test-store-bangalore',
    code: 'TST001',
    description: 'A test store',
    shortDescription: 'Test',
    email: 'test@store.com',
    phone: '+911234567890',
    alternatePhone: null,
    website: null,
    addressLine1: '123 Test St',
    addressLine2: null,
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
    googleMapsLink: null,
    placeId: null,
    thumbnailImage: null,
    coverImage: null,
    logo: null,
    isActive: true,
    isFeatured: false,
    supportsDelivery: true,
    supportsTakeaway: false,
    supportsDineIn: true,
    averageRating: 0,
    totalReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: userId,
    brand: { name: 'Test Brand', slug: 'test-brand' },
    timings: [],
    facilities: [],
    gallery: [],
    announcements: [],
  };

  beforeEach(() => {
    prisma = {
      store: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      storeTiming: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      storeHoliday: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
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

  describe('create', () => {
    it('should create a store with generated slug', async () => {
      prisma.store.findFirst.mockResolvedValue(null);
      prisma.store.create.mockResolvedValue(mockStoreData);

      const dto = {
        brandId,
        name: 'Test Store',
        code: 'TST001',
        addressLine1: '123 Test St',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
        email: 'test@store.com',
        phone: '+911234567890',
        supportsDelivery: true,
        supportsDineIn: true,
      };

      const result = await service.create(dto, userId);

      expect(result.id).toBe(storeId);
      expect(result.name).toBe('Test Store');
      expect(result.brandName).toBe('Test Brand');
      expect(cache.invalidateAll).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      prisma.store.findFirst.mockResolvedValueOnce({ id: 'other' });

      await expect(
        service.create(
          {
            brandId,
            name: 'Store',
            code: 'S01',
            email: 'dup@store.com',
            addressLine1: 'addr',
            city: 'City',
            state: 'State',
            postalCode: '000001',
            latitude: 0,
            longitude: 0,
          },
          userId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return cached store when available', async () => {
      const cached = { id: storeId, name: 'Cached' };
      cache.getStoreDetail.mockResolvedValue(cached);

      const result = await service.findById(storeId);

      expect(result).toEqual(cached);
      expect(prisma.store.findFirst).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when not cached', async () => {
      prisma.store.findFirst.mockResolvedValue(mockStoreData);

      const result = await service.findById(storeId);

      expect(result.id).toBe(storeId);
      expect(cache.setStoreDetail).toHaveBeenCalledWith(storeId, expect.any(Object));
    });

    it('should throw NotFoundException when store not found', async () => {
      prisma.store.findFirst.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return cached store by slug', async () => {
      const cached = { slug: 'test-slug' };
      cache.getStoreBySlug.mockResolvedValue(cached);

      const result = await service.findBySlug('test-slug');
      expect(result).toEqual(cached);
    });

    it('should throw NotFoundException for missing slug', async () => {
      prisma.store.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('no-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      prisma.$transaction.mockResolvedValue([[mockStoreData], 1]);

      const result = await service.findAll({ page: 1, pageSize: 10 } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should apply city filter', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, pageSize: 10, city: 'Mumbai' } as any);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update store and invalidate cache', async () => {
      prisma.store.findFirst.mockResolvedValue(mockStoreData);
      prisma.store.update.mockResolvedValue({
        ...mockStoreData,
        description: 'Updated desc',
      });

      const result = await service.update(
        storeId,
        { description: 'Updated desc' },
        userId,
      );

      expect(result.description).toBe('Updated desc');
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId, mockStoreData.slug);
    });

    it('should throw NotFoundException when store not found', async () => {
      prisma.store.findFirst.mockResolvedValue(null);
      await expect(
        service.update('missing', { description: 'x' }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should regenerate slug when name changes', async () => {
      prisma.store.findFirst
        .mockResolvedValueOnce(mockStoreData)
        .mockResolvedValue(null);

      prisma.store.update.mockResolvedValue({
        ...mockStoreData,
        name: 'New Name',
        slug: 'new-name-bangalore',
      });

      const result = await service.update(
        storeId,
        { name: 'New Name' },
        userId,
      );

      expect(prisma.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: expect.any(String) }),
        }),
      );
    });

    it('should check unique email when email changes', async () => {
      prisma.store.findFirst
        .mockResolvedValueOnce(mockStoreData)
        .mockResolvedValueOnce({ id: 'other-store' });

      await expect(
        service.update(storeId, { email: 'taken@store.com' }, userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt and deactivate', async () => {
      prisma.store.findFirst.mockResolvedValue(mockStoreData);
      prisma.store.update.mockResolvedValue({});

      await service.softDelete(storeId, userId);

      expect(prisma.store.update).toHaveBeenCalledWith({
        where: { id: storeId },
        data: {
          deletedAt: expect.any(Date),
          deletedBy: userId,
          isActive: false,
        },
      });
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId, mockStoreData.slug);
    });

    it('should throw NotFoundException when store not found', async () => {
      prisma.store.findFirst.mockResolvedValue(null);
      await expect(service.softDelete('missing', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findFeatured', () => {
    it('should return cached featured stores', async () => {
      const featured = [{ id: '1' }];
      cache.getFeatured.mockResolvedValue(featured);

      const result = await service.findFeatured();
      expect(result).toEqual(featured);
      expect(prisma.store.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache when not cached', async () => {
      prisma.store.findMany.mockResolvedValue([mockStoreData]);

      const result = await service.findFeatured();
      expect(result).toHaveLength(1);
      expect(cache.setFeatured).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('should return all active stores', async () => {
      prisma.store.findMany.mockResolvedValue([mockStoreData]);

      const result = await service.findActive();
      expect(result).toHaveLength(1);
      expect(prisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, deletedAt: null },
        }),
      );
    });
  });

  describe('search', () => {
    it('should return cached search results', async () => {
      const cached = { items: [], meta: {} };
      cache.getSearch.mockResolvedValue(cached);

      const result = await service.search({ page: 1, pageSize: 10 } as any);
      expect(result).toEqual(cached);
    });

    it('should delegate to findAll when not cached', async () => {
      prisma.$transaction.mockResolvedValue([[mockStoreData], 1]);

      const result = await service.search({ page: 1, pageSize: 10 } as any);
      expect(result.items).toHaveLength(1);
      expect(cache.setSearch).toHaveBeenCalled();
    });
  });

  describe('findNearby', () => {
    it('should return cached nearby results', async () => {
      const cached = {
        nearestStore: { id: '1', distance: 2.5 },
        nearbyStores: [],
        userLocation: { latitude: 12.97, longitude: 77.59 },
        total: 1,
      };
      cache.getNearby.mockResolvedValue(cached);

      const result = await service.findNearby({
        latitude: 12.97,
        longitude: 77.59,
      });

      expect(result).toEqual(cached);
    });

    it('should execute raw SQL query when not cached', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          id: storeId,
          name: 'Test Store',
          slug: 'test-store',
          phone: null,
          address_line1: 'Addr',
          address_line2: null,
          city: 'Bangalore',
          state: 'Karnataka',
          latitude: '12.9716',
          longitude: '77.5946',
          google_maps_link: null,
          cover_image: null,
          logo: null,
          is_featured: false,
          supports_delivery: true,
          supports_takeaway: false,
          supports_dine_in: true,
          average_rating: '4.5',
          total_reviews: 10,
          brand_name: 'Test Brand',
          brand_slug: 'test-brand',
          distance: 2.567,
        },
      ]);

      const result = await service.findNearby({
        latitude: 12.97,
        longitude: 77.59,
        radius: 10,
        limit: 5,
      });

      expect(result.total).toBe(1);
      expect(result.nearestStore).not.toBeNull();
      expect(result.nearestStore!.distance).toBe(2.57);
      expect(result.nearestStore!.latitude).toBe(12.9716);
      expect(result.nearestStore!.isOpenNow).toBe(false);
      expect(result.nearestStore!.googleMapsUrl).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946',
      );
      expect(result.userLocation).toEqual({ latitude: 12.97, longitude: 77.59 });
      expect(cache.setNearby).toHaveBeenCalled();
    });

    it('should use existing Google Maps link when available', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          id: storeId,
          name: 'Test Store',
          slug: 'test-store',
          phone: '+911234567890',
          address_line1: 'Addr',
          address_line2: null,
          city: 'Bangalore',
          state: 'Karnataka',
          latitude: '12.9716',
          longitude: '77.5946',
          google_maps_link: 'https://www.google.com/maps/place/?q=place_id:ChIJ123',
          cover_image: null,
          logo: null,
          is_featured: true,
          supports_delivery: true,
          supports_takeaway: true,
          supports_dine_in: true,
          average_rating: '4.8',
          total_reviews: 50,
          brand_name: 'GreenChillyz',
          brand_slug: 'greenchillyz',
          distance: 1.23,
        },
      ]);

      const result = await service.findNearby({
        latitude: 12.97,
        longitude: 77.59,
      });

      expect(result.nearestStore!.googleMapsUrl).toBe(
        'https://www.google.com/maps/place/?q=place_id:ChIJ123',
      );
    });

    it('should return empty when no stores found', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.findNearby({
        latitude: 0,
        longitude: 0,
      });

      expect(result.nearestStore).toBeNull();
      expect(result.nearbyStores).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should default limit to 5', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.findNearby({
        latitude: 12.97,
        longitude: 77.59,
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should round cache key coordinates to 3 decimal places', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      await service.findNearby({
        latitude: 12.97164,
        longitude: 77.59462,
      });

      expect(cache.getNearby).toHaveBeenCalledWith('12.972:77.595:5');
    });
  });

  describe('isOpenNow', () => {
    it('should return false when on holiday', async () => {
      prisma.storeHoliday.findFirst.mockResolvedValue({ id: 'h-1', isClosed: true });

      const result = await service.isOpenNow(storeId);
      expect(result).toBe(false);
    });

    it('should return false when no timing exists for today', async () => {
      prisma.storeHoliday.findFirst.mockResolvedValue(null);
      prisma.storeTiming.findUnique.mockResolvedValue(null);

      const result = await service.isOpenNow(storeId);
      expect(result).toBe(false);
    });

    it('should return false when store is closed today', async () => {
      prisma.storeHoliday.findFirst.mockResolvedValue(null);
      prisma.storeTiming.findUnique.mockResolvedValue({
        isClosed: true,
        opensAt: '09:00',
        closesAt: '21:00',
      });

      const result = await service.isOpenNow(storeId);
      expect(result).toBe(false);
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate slug from name and city', async () => {
      prisma.store.findFirst.mockResolvedValue(null);

      const slug = await service.generateUniqueSlug('Green Chillyz', 'Bangalore');
      expect(slug).toBe('green-chillyz-bangalore');
    });

    it('should append counter for duplicate slugs', async () => {
      prisma.store.findFirst
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      const slug = await service.generateUniqueSlug('Test Store', 'Delhi');
      expect(slug).toBe('test-store-delhi-1');
    });

    it('should handle special characters in name', async () => {
      prisma.store.findFirst.mockResolvedValue(null);

      const slug = await service.generateUniqueSlug("O'Brien's & Sons!", 'New York');
      expect(slug).toBe('o-brien-s-sons-new-york');
    });
  });
});
