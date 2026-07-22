import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../interfaces';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (this.isAlreadyFormatted(data)) {
          return data as unknown as ApiResponse<T>;
        }

        return {
          success: true,
          message: 'Operation successful',
          data,
          meta: null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private isAlreadyFormatted(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;
    return 'success' in data && 'timestamp' in data;
  }
}
