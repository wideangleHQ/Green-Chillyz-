import { Injectable } from '@nestjs/common';
import {
  DASHBOARD_DEFAULT_PERMISSIONS_PROFILE,
  DASHBOARD_DEFAULT_ROLE,
} from '../constants';
import {
  DashboardPermissionResolver,
  DashboardResolverSubject,
  DashboardRoleResolver,
  DashboardStoreScope,
  DashboardStoreScopeResolver,
} from '../interfaces';

/**
 * Default bindings for the permission foundation.
 *
 * Dashboard IAM proves *which store* is calling and stops there. These
 * resolvers give every authenticated store the same flat profile so the token,
 * the guards and the login context all already carry role, scope and
 * permission fields — the Permission Engine module fills them in by rebinding
 * the injection tokens, and nothing downstream changes shape.
 */

@Injectable()
export class DefaultDashboardPermissionResolver
  implements DashboardPermissionResolver
{
  /**
   * Empty by design. An empty list is honest ("no permission engine yet") and
   * fails closed: a future permission check finds nothing to grant rather than
   * inheriting a wildcard nobody meant to give.
   */
  async resolvePermissions(
    _subject: DashboardResolverSubject,
  ): Promise<string[]> {
    return [];
  }
}

@Injectable()
export class DefaultDashboardRoleResolver implements DashboardRoleResolver {
  async resolveRole(_subject: DashboardResolverSubject): Promise<string> {
    return DASHBOARD_DEFAULT_ROLE;
  }

  async resolvePermissionsProfile(
    _subject: DashboardResolverSubject,
  ): Promise<string> {
    return DASHBOARD_DEFAULT_PERMISSIONS_PROFILE;
  }
}

@Injectable()
export class DefaultDashboardStoreScopeResolver
  implements DashboardStoreScopeResolver
{
  /** One store, one scope — the only shape possible without an IAM hierarchy. */
  async resolveScope(
    subject: DashboardResolverSubject,
  ): Promise<DashboardStoreScope> {
    return {
      storeId: subject.storeId,
      brandId: subject.brandId,
      scopeType: 'STORE',
    };
  }
}
