import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from './menu.service';
import { PrismaService } from '../../../database/prisma.service';

describe('MenuService', () => {
  let service: MenuService;
  let prisma: any;

  const storeId = 'store-uuid-12345678';
  const mockStore = {
    id: storeId,
    name: 'Green Chillyz Baramunda',
    brand: {
      name: 'Green Chillyz',
    },
  };

  beforeEach(() => {
    prisma = {
      store: {
        findUnique: vi.fn(),
      },
    };

    service = new MenuService(prisma as any);
  });

  it('should throw NotFoundException if store does not exist', async () => {
    prisma.store.findUnique.mockResolvedValue(null);

    await expect(service.getStoreMenu(storeId, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return all menu items for an outlet matching its brand', async () => {
    prisma.store.findUnique.mockResolvedValue(mockStore);

    const result = await service.getStoreMenu(storeId, {});
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    // All items should have generated stable IDs starting with the storeId segment
    expect(result[0].id).toContain(storeId.substring(0, 8));
  });

  it('should filter dishes by search query', async () => {
    prisma.store.findUnique.mockResolvedValue(mockStore);

    const result = await service.getStoreMenu(storeId, { search: 'Paneer' });
    expect(result.every((d) => d.name.includes('Paneer') || d.description.includes('Paneer'))).toBe(true);
  });

  it('should filter dishes by veg/nonVeg flag', async () => {
    prisma.store.findUnique.mockResolvedValue(mockStore);

    const vegResult = await service.getStoreMenu(storeId, { veg: true });
    expect(vegResult.every((d) => d.isVeg === true)).toBe(true);

    const nonVegResult = await service.getStoreMenu(storeId, { nonVeg: true });
    expect(nonVegResult.every((d) => d.isVeg === false)).toBe(true);
  });

  it('should return featured dishes', async () => {
    prisma.store.findUnique.mockResolvedValue(mockStore);

    const result = await service.getFeaturedDishes(storeId);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((d) => d.isBestseller || d.isChefRecommended)).toBe(true);
  });
});
