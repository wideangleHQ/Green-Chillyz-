import { ApiResponse, PaginatedResponse, PaginationMeta } from '../interfaces';

export class ApiResponseBuilder {
  static success<T>(data: T, message = 'Operation successful'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: null,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    items: T[],
    totalItems: number,
    page: number,
    pageSize: number,
    message = 'Operation successful',
  ): ApiResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(totalItems / pageSize);
    const meta: PaginationMeta = {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      success: true,
      message,
      data: { items, meta },
      meta: meta as unknown as import('../interfaces').ApiMeta,
      timestamp: new Date().toISOString(),
    };
  }

  static deleted(message = 'Resource deleted successfully'): ApiResponse<null> {
    return {
      success: true,
      message,
      data: null,
      meta: null,
      timestamp: new Date().toISOString(),
    };
  }
}
