import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BusinessException extends BaseException {
  constructor(message: string, errorCode?: string, details?: unknown) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode, details);
  }
}
