import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DashboardStoreCredential } from '../interfaces';

/**
 * Every read and write this module makes against the `stores` table.
 *
 * Dashboard IAM extends the Store aggregate rather than duplicating it — there
 * is exactly one store table, and store CRUD stays in the store module.
 */
@Injectable()
export class DashboardStoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Single indexed lookup on the blind index. Selects only the credential
   * columns so a login never drags the full store row across the wire.
   */
  async findCredentialByLookup(
    lookup: string,
  ): Promise<DashboardStoreCredential | null> {
    return this.prisma.store.findUnique({
      where: { dashboardCodeLookup: lookup },
      select: {
        id: true,
        slug: true,
        brandId: true,
        isActive: true,
        deletedAt: true,
        dashboardCodeHash: true,
        dashboardAccessEnabled: true,
        dashboardFailedAttempts: true,
        dashboardLockedUntil: true,
      },
    });
  }

  async findContextById(storeId: string) {
    return this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        city: true,
        state: true,
        isActive: true,
        brandId: true,
        dashboardAccessEnabled: true,
        brand: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /** Cheap guard-path check: is this store still allowed on the dashboard? */
  async findAccessStateById(storeId: string) {
    return this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
        dashboardAccessEnabled: true,
      },
    });
  }

  async recordSuccessfulLogin(storeId: string, ipAddress: string): Promise<void> {
    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        dashboardLastLoginAt: new Date(),
        dashboardLastLoginIp: ipAddress,
        dashboardFailedAttempts: 0,
        dashboardLockedUntil: null,
      },
    });
  }

  /**
   * Atomic increment — two simultaneous wrong codes must count as two, which a
   * read-modify-write would lose.
   */
  async incrementFailedAttempts(
    storeId: string,
  ): Promise<{ dashboardFailedAttempts: number }> {
    return this.prisma.store.update({
      where: { id: storeId },
      data: { dashboardFailedAttempts: { increment: 1 } },
      select: { dashboardFailedAttempts: true },
    });
  }

  async applyLock(storeId: string, lockedUntil: Date): Promise<void> {
    await this.prisma.store.update({
      where: { id: storeId },
      data: { dashboardLockedUntil: lockedUntil },
    });
  }

  async clearLock(storeId: string): Promise<void> {
    await this.prisma.store.update({
      where: { id: storeId },
      data: { dashboardFailedAttempts: 0, dashboardLockedUntil: null },
    });
  }

  async setAccessCode(
    storeId: string,
    codeHash: string,
    codeLookup: string,
    codeEncrypted?: string | null,
  ): Promise<void> {
    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        dashboardCodeHash: codeHash,
        dashboardCodeLookup: codeLookup,
        // Rotation replaces the recoverable copy; a stale ciphertext would
        // decrypt to a code that no longer authenticates.
        ...(codeEncrypted !== undefined && {
          dashboardCodeEncrypted: codeEncrypted,
        }),
        dashboardLastRotatedAt: new Date(),
        dashboardFailedAttempts: 0,
        dashboardLockedUntil: null,
      },
    });
  }

  /**
   * Stores still holding a seeded plaintext code with no derived hash.
   *
   * The `dashboardCodeHash: null` predicate is what makes the bootstrap
   * idempotent and O(pending) rather than O(stores): once a store is
   * initialized it stops matching and is never read again.
   */
  async findUninitializedCodes(
    take: number,
    skip: number,
  ): Promise<
    Array<{
      id: string;
      slug: string;
      dashboardCode: string | null;
      dashboardCodeEncrypted: string | null;
    }>
  > {
    return this.prisma.store.findMany({
      where: {
        deletedAt: null,
        dashboardCode: { not: null },
        dashboardCodeHash: null,
      },
      select: {
        id: true,
        slug: true,
        dashboardCode: true,
        dashboardCodeEncrypted: true,
      },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
  }

  async countUninitializedCodes(): Promise<number> {
    return this.prisma.store.count({
      where: {
        deletedAt: null,
        dashboardCode: { not: null },
        dashboardCodeHash: null,
      },
    });
  }

  /**
   * Writes the derived credential for a store that had none.
   *
   * Guarded by `dashboardCodeHash: null` so two workers racing the same store
   * cannot both apply — the second matches nothing and reports zero rows.
   */
  async initializeAccessCode(
    storeId: string,
    codeHash: string,
    codeLookup: string,
    codeEncrypted: string | null,
  ): Promise<boolean> {
    const result = await this.prisma.store.updateMany({
      where: { id: storeId, dashboardCodeHash: null },
      data: {
        dashboardCodeHash: codeHash,
        dashboardCodeLookup: codeLookup,
        ...(codeEncrypted !== null && {
          dashboardCodeEncrypted: codeEncrypted,
        }),
      },
    });

    return result.count > 0;
  }

  /**
   * Stores holding a plaintext code and a hash but no ciphertext — the shape
   * left behind when they were initialized before an encryption key existed.
   */
  async findInitializedWithoutCiphertext(
    take: number,
  ): Promise<Array<{ id: string; dashboardCode: string | null }>> {
    return this.prisma.store.findMany({
      where: {
        deletedAt: null,
        dashboardCode: { not: null },
        dashboardCodeHash: { not: null },
        dashboardCodeEncrypted: null,
      },
      select: { id: true, dashboardCode: true },
      take,
    });
  }

  /** Backfills only the ciphertext, for stores initialized before a key existed. */
  async setEncryptedCode(
    storeId: string,
    codeEncrypted: string,
  ): Promise<void> {
    await this.prisma.store.update({
      where: { id: storeId },
      data: { dashboardCodeEncrypted: codeEncrypted },
    });
  }

  /** Recovery path only. Never reached from an authentication route. */
  async findRecoverableCode(storeId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    code: string;
    dashboardCodeEncrypted: string | null;
  } | null> {
    return this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        dashboardCodeEncrypted: true,
      },
    });
  }
}
