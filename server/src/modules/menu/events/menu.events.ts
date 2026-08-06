import { FoodType, MenuStatus } from '@prisma/client';
import { ImportCounts } from '../interfaces';

/**
 * Master Menu domain events.
 *
 * Declared and typed now so audit, notification and cache listeners can be
 * written against them; nothing publishes until the write paths are migrated
 * and switched on. Following the ecosystem convention, the menu module will
 * publish and never subscribe.
 */

export class MenuValidatedEvent {
  constructor(
    public readonly source: string,
    public readonly readyToImport: boolean,
    public readonly counts: ImportCounts,
    public readonly errorCount: number,
    public readonly warningCount: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MenuImportedEvent {
  constructor(
    public readonly source: string,
    public readonly counts: ImportCounts,
    public readonly importedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MenuCreatedEvent {
  constructor(
    public readonly menuItemId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly foodType: FoodType,
    public readonly categoryId: string | null,
    public readonly createdBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MenuUpdatedEvent {
  constructor(
    public readonly menuItemId: string,
    public readonly sku: string,
    public readonly changedFields: string[],
    public readonly previousStatus: MenuStatus,
    public readonly currentStatus: MenuStatus,
    public readonly updatedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MenuArchivedEvent {
  constructor(
    public readonly menuItemId: string,
    public readonly sku: string,
    public readonly archivedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MenuImageAddedEvent {
  constructor(
    public readonly menuItemId: string,
    public readonly imageId: string,
    public readonly url: string,
    public readonly isPrimary: boolean,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MenuTagAssignedEvent {
  constructor(
    public readonly menuItemId: string,
    public readonly tagId: string,
    public readonly tagSlug: string,
    public readonly assignedBy: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
