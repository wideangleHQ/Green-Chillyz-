import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class EntityNotFoundException extends BaseException {
  constructor(entity: string, identifier?: string | number) {
    const message = identifier
      ? `${entity} with identifier "${identifier}" not found`
      : `${entity} not found`;
    super(message, HttpStatus.NOT_FOUND, 'ENTITY_NOT_FOUND');
  }
}
