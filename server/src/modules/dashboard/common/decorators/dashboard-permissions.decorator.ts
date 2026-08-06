import { SetMetadata } from '@nestjs/common';
import { DASHBOARD_PERMISSIONS_KEY } from '../constants';

/** Declares the dashboard permissions a route will require once the Permission Engine binds a real resolver. */
export const DashboardPermissions = (...permissions: string[]) =>
  SetMetadata(DASHBOARD_PERMISSIONS_KEY, permissions);
