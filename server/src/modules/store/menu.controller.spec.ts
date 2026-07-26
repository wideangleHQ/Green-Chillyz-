import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MenuController } from './menu.controller';

describe('MenuController', () => {
  let controller: MenuController;
  let menuService: any;

  const storeId = 'store-uuid-12345678';

  beforeEach(() => {
    menuService = {
      getStoreMenu: vi.fn(),
      getFeaturedDishes: vi.fn(),
    };

    controller = new MenuController(menuService as any);
  });

  it('should delegate getMenu to menuService.getStoreMenu', async () => {
    const query = { search: 'Noodles' };
    const mockDishes = [{ id: 'dish-1', name: 'Noodles' }];
    menuService.getStoreMenu.mockResolvedValue(mockDishes);

    const result = await controller.getMenu(storeId, query);
    expect(menuService.getStoreMenu).toHaveBeenCalledWith(storeId, query);
    expect(result).toBe(mockDishes);
  });

  it('should delegate getFeatured to menuService.getFeaturedDishes', async () => {
    const mockFeatured = [{ id: 'dish-2', name: 'Premium Dish' }];
    menuService.getFeaturedDishes.mockResolvedValue(mockFeatured);

    const result = await controller.getFeatured(storeId);
    expect(menuService.getFeaturedDishes).toHaveBeenCalledWith(storeId);
    expect(result).toBe(mockFeatured);
  });
});
