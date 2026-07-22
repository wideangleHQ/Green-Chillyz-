export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta: ApiMeta | null;
  timestamp: string;
}

export type ApiMeta = Record<string, unknown>;

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  requestId?: string;
  timestamp: string;
  path: string;
  details?: unknown;
}
