import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class ValidationException extends BaseException {
  constructor(details: Record<string, string[]>) {
    super('Validation failed', HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}
