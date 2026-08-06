import { DashboardStoreScope } from './dashboard-auth.interface';

/**
 * Extension points for the future Permission Engine.
 *
 * Dashboard IAM answers "which store is this?"; it deliberately does not
 * answer "what may that store do?". These three contracts are the seam: the
 * Permission Engine module will bind its own implementations to the same
 * injection tokens, and every guard, token and context in this module will
 * pick them up without modification.
 */

export interface DashboardResolverSubject {
  storeId: string;
  brandId: string;
  slug: string;
}

export interface DashboardPermissionResolver {
  resolvePermissions(subject: DashboardResolverSubject): Promise<string[]>;
}

export interface DashboardRoleResolver {
  resolveRole(subject: DashboardResolverSubject): Promise<string>;
  resolvePermissionsProfile(subject: DashboardResolverSubject): Promise<string>;
}

export interface DashboardStoreScopeResolver {
  resolveScope(subject: DashboardResolverSubject): Promise<DashboardStoreScope>;
}
