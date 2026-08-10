import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  menuAdminApi,
  MenuItemQuery,
  MenuSearchQuery,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuStatus
} from '../lib/api/menuAdminApi';

export const menuAdminKeys = {
  all: ['admin-menu'] as const,
  items: () => [...menuAdminKeys.all, 'items'] as const,
  itemLists: () => [...menuAdminKeys.items(), 'list'] as const,
  itemList: (params: MenuItemQuery) => [...menuAdminKeys.itemLists(), params] as const,
  search: (params: MenuSearchQuery) => [...menuAdminKeys.items(), 'search', params] as const,
  item: (id: string) => [...menuAdminKeys.items(), id] as const,
  categories: (status?: MenuStatus) => [...menuAdminKeys.all, 'categories', status] as const,
};

export function useAdminMenuItems(params: MenuItemQuery) {
  return useQuery({
    queryKey: menuAdminKeys.itemList(params),
    queryFn: () => menuAdminApi.listMenuItems(params),
  });
}

export function useAdminMenuSearch(params: MenuSearchQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: menuAdminKeys.search(params),
    queryFn: () => menuAdminApi.searchMenuItems(params),
    enabled: options?.enabled !== false && params.q.length >= 2,
  });
}

export function useAdminMenuItem(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: menuAdminKeys.item(id),
    queryFn: () => menuAdminApi.getMenuItem(id),
    enabled: !!id && options?.enabled !== false,
  });
}

export function useAdminMenuCategories(status?: MenuStatus) {
  return useQuery({
    queryKey: menuAdminKeys.categories(status),
    queryFn: () => menuAdminApi.getCategories(status),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (dto: CreateMenuItemDto) => menuAdminApi.createMenuItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuAdminKeys.items() });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMenuItemDto }) => 
      menuAdminApi.updateMenuItem(id, dto),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: menuAdminKeys.items() });
      queryClient.invalidateQueries({ queryKey: menuAdminKeys.item(variables.id) });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => menuAdminApi.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuAdminKeys.items() });
    },
  });
}
