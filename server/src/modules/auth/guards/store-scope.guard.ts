import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { STORE_SCOPE_KEY } from '../../../common/constants';
import { JwtPayload } from '../interfaces';

@Injectable()
export class StoreScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireStoreScope = this.reflector.getAllAndOverride<boolean>(
      STORE_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireStoreScope) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const storeId = request.params.storeId ?? request.query.storeId;

    if (!storeId) {
      return true;
    }

    if (!user || !user.roles) {
      return false;
    }

    const hasGlobalRole = user.roles.some((r) => r.storeId === null);
    if (hasGlobalRole) {
      return true;
    }

    const hasStoreAccess = user.roles.some((r) => r.storeId === storeId);
    if (!hasStoreAccess) {
      throw new ForbiddenException(
        'You do not have access to this store',
      );
    }

    return true;
  }
}
