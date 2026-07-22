import { PaginatedResponse, PaginationMeta } from '../interfaces';

export function paginate<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / pageSize);
  const meta: PaginationMeta = {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return { items, meta };
}
