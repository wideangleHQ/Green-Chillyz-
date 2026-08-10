import { api, PaginatedResponse } from './client';
import { Dish, MenuCategory } from '@/types/menu';

export type MenuStatus = 'DRAFT' | 'ACTIVE';
export type FoodType = 'VEG' | 'NON_VEG';
export type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';

export interface MenuItemQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  foodType?: FoodType;
  status?: MenuStatus;
  brandId?: string;
  featuredOnly?: boolean;
  sort?: string;
}

export interface MenuSearchQuery {
  q: string;
  page?: number;
  pageSize?: number;
  foodType?: FoodType;
  category?: string;
}

export interface CreateMenuItemDto {
  name: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  foodType: FoodType;
  spiceLevel?: SpiceLevel;
  preparationTime?: number;
  servingSize?: string;
  calories?: number;
  price: number;
  discountedPrice?: number;
  status?: MenuStatus;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isSeasonal?: boolean;
  sortOrder?: number;
  searchKeywords?: string[];
  tagIds?: string[];
}

export type UpdateMenuItemDto = Partial<CreateMenuItemDto>;

export const menuAdminApi = {
  async listMenuItems(params?: MenuItemQuery): Promise<PaginatedResponse<Dish>> {
    const { data } = await api.get<PaginatedResponse<Dish>>('/dashboard/menu/items', { params });
    return data;
  },

  async searchMenuItems(params: MenuSearchQuery): Promise<PaginatedResponse<Dish>> {
    const { data } = await api.get<PaginatedResponse<Dish>>('/dashboard/menu/items/search', { params });
    return data;
  },

  async getMenuItem(id: string): Promise<Dish> {
    const { data } = await api.get<Dish>(`/dashboard/menu/items/${id}`);
    return data;
  },

  async createMenuItem(dto: CreateMenuItemDto): Promise<Dish> {
    const { data } = await api.post<Dish>('/dashboard/menu/items', dto);
    return data;
  },

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<Dish> {
    const { data } = await api.patch<Dish>(`/dashboard/menu/items/${id}`, dto);
    return data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await api.delete(`/dashboard/menu/items/${id}`);
  },

  async getCategories(status?: MenuStatus): Promise<MenuCategory[]> {
    const { data } = await api.get<MenuCategory[]>('/dashboard/menu/categories', { params: { status } });
    return data;
  }
};
