import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DashboardPermissionsGuard } from './dashboard-permissions.guard';

function buildContext(permissions?: string[]): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: permissions ? { permissions } : undefined,
      }),
    }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('DashboardPermissionsGuard', () => {
  let guard: DashboardPermissionsGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    guard = new DashboardPermissionsGuard(reflector as unknown as Reflector);
  });

  it('should pass an undecorated route', () => {
    expect(guard.canActivate(buildContext(['ANY']))).toBe(true);
  });

  it('should pass when the decorator lists no permissions', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(guard.canActivate(buildContext([]))).toBe(true);
  });

  it('should pass when the principal holds every required permission', () => {
    reflector.getAllAndOverride.mockReturnValue(['CUSTOMERS_READ']);

    expect(
      guard.canActivate(buildContext(['CUSTOMERS_READ', 'WALLET_READ'])),
    ).toBe(true);
  });

  it('should reject when a required permission is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['WALLET_ADJUST']);

    expect(() => guard.canActivate(buildContext(['CUSTOMERS_READ']))).toThrow(
      ForbiddenException,
    );
  });

  it('should reject a request with no principal when permissions are required', () => {
    reflector.getAllAndOverride.mockReturnValue(['CUSTOMERS_READ']);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('should name the missing permissions in the error', () => {
    reflector.getAllAndOverride.mockReturnValue(['A', 'B']);

    expect(() => guard.canActivate(buildContext(['A']))).toThrow(/B/);
  });
});
