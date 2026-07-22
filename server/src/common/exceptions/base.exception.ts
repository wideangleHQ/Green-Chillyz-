import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly errorCode?: string,
    public readonly details?: unknown,
  ) {
    super(
      {
        message,
        error: HttpStatus[status],
        errorCode,
        details,
      },
      status,
    );
  }
}
