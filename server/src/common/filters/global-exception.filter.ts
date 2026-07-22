import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../constants';

interface ErrorResponseBody {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  requestId?: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = request.headers[REQUEST_ID_HEADER] as string;

    const { status, message, error, details } =
      this.extractErrorInfo(exception);

    const body: ErrorResponseBody = {
      success: false,
      message,
      error,
      statusCode: status,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
      details: status < 500 ? details : undefined,
    };

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} ${status} - ${message}`,
      );
    }

    response.status(status).json(body);
  }

  private extractErrorInfo(exception: unknown): {
    status: number;
    message: string;
    error: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        return {
          status,
          message: (resp.message as string) || exception.message,
          error: (resp.error as string) || HttpStatus[status] || 'Error',
          details: resp.details,
        };
      }

      return {
        status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message,
        error: HttpStatus[status] || 'Error',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
    };
  }
}
