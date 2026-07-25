import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreController } from './store.controller';
import { StoreService } from './services/store.service';

const storeId = '550e8400-e29b-41d4-a716-446655440000';

const mockUser = {
  sub: 'user-uuid',
  email: 'test@test.com',
  role: 'ADMIN',
  permissions: ['STORE_CREATE', 'STORE_UPDATE', 'STORE_DELETE'],
};

const mockStoreResponse = {
  id: storeId,
  brandId: '660e8400-e29b-41d4-a716-446655440000',
  brandName: 'Green Chillyz',
  name: 'Test Store',
  slug: 'test-store-bangalore',
  code: 'TST001',
  city: 'Bangalore',
  state: 'Karnataka',
  isActive: true,
};

describe('StoreController', () => {
  let controller: StoreController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findFeatured: vi.fn(),
      findActive: vi.fn(),
      search: vi.fn(),
      findNearby: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      isOpenNow: vi.fn(),
    };
    controller = new StoreController(service as unknown as StoreService);
  });

  describe('create', () => {
    it('should call service.create with dto and user sub', async () => {
      service.create.mockResolvedValue(mockStoreResponse);
      const dto = { name: 'Test Store', code: 'TST001' } as any;

      const result = await controller.create(dto, mockUser as any);

      expect(service.create).toHaveBeenCalledWith(dto, 'user-uuid');
      expect(result.name).toBe('Test Store');
    });
  });

  describe('findAll', () => {
    it('should delegate to service', async () => {
      const paginated = { items: [mockStoreResponse], meta: { totalItems: 1 } };
      service.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({ page: 1, pageSize: 10 } as any);

      expect(result.items).toHaveLength(1);
    });

    it('should pass filters', async () => {
      service.findAll.mockResolvedValue({ items: [], meta: {} });
      const query = { page: 1, pageSize: 10, city: 'Mumbai' } as any;

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findFeatured', () => {
    it('should return featured stores', async () => {
      service.findFeatured.mockResolvedValue([mockStoreResponse]);
      const result = await controller.findFeatured();
      expect(result).toHaveLength(1);
    });
  });

  describe('findActive', () => {
    it('should return active stores', async () => {
      service.findActive.mockResolvedValue([mockStoreResponse]);
      const result = await controller.findActive();
      expect(result).toHaveLength(1);
    });
  });

  describe('search', () => {
    it('should delegate to service', async () => {
      service.search.mockResolvedValue({ items: [], meta: {} });
      await controller.search({ search: 'pizza' } as any);
      expect(service.search).toHaveBeenCalledTimes(1);
    });
  });

  describe('findNearby', () => {
    it('should return nearby locator response', async () => {
      const locatorResponse = {
        nearestStore: { ...mockStoreResponse, distance: 2.5, isOpenNow: true },
        nearbyStores: [],
        userLocation: { latitude: 12.97, longitude: 77.59 },
        total: 1,
      };
      service.findNearby.mockResolvedValue(locatorResponse);

      const result = await controller.findNearby({ latitude: 12.97, longitude: 77.59 } as any);

      expect(result.nearestStore!.distance).toBe(2.5);
      expect(result.total).toBe(1);
    });
  });

  describe('findBySlug', () => {
    it('should return store by slug', async () => {
      service.findBySlug.mockResolvedValue(mockStoreResponse);
      const result = await controller.findBySlug('test-store-bangalore');
      expect(service.findBySlug).toHaveBeenCalledWith('test-store-bangalore');
      expect(result.slug).toBe('test-store-bangalore');
    });
  });

  describe('findById', () => {
    it('should return store by ID', async () => {
      service.findById.mockResolvedValue(mockStoreResponse);
      const result = await controller.findById(storeId);
      expect(result.id).toBe(storeId);
    });
  });

  describe('update', () => {
    it('should pass dto and userId to service', async () => {
      service.update.mockResolvedValue({ ...mockStoreResponse, description: 'Updated' });

      const result = await controller.update(storeId, { description: 'Updated' } as any, mockUser as any);

      expect(service.update).toHaveBeenCalledWith(storeId, { description: 'Updated' }, 'user-uuid');
      expect(result.description).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft delete and return message', async () => {
      service.softDelete.mockResolvedValue(undefined);

      const result = await controller.remove(storeId, mockUser as any);

      expect(service.softDelete).toHaveBeenCalledWith(storeId, 'user-uuid');
      expect(result.message).toBe('Store deleted successfully');
    });
  });

  describe('isOpenNow', () => {
    it('should return isOpen true', async () => {
      service.isOpenNow.mockResolvedValue(true);
      const result = await controller.isOpenNow(storeId);
      expect(result).toEqual({ isOpen: true });
    });

    it('should return isOpen false', async () => {
      service.isOpenNow.mockResolvedValue(false);
      const result = await controller.isOpenNow(storeId);
      expect(result).toEqual({ isOpen: false });
    });
  });
});
