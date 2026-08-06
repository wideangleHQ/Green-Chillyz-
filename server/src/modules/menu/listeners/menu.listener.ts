import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/services/audit.service';
import { MENU_EVENTS } from '../constants';
import {
  MenuArchivedEvent,
  MenuCreatedEvent,
  MenuImageAddedEvent,
  MenuImportedEvent,
  MenuTagAssignedEvent,
  MenuUpdatedEvent,
} from '../events';

@Injectable()
export class MenuListener {
  private readonly logger = new Logger(MenuListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent(MENU_EVENTS.MENU_IMPORTED)
  async onImported(event: MenuImportedEvent) {
    await this.audit.record({
      eventType: MENU_EVENTS.MENU_IMPORTED,
      entityType: 'menu',
      action: 'IMPORT',
      userId: event.importedBy ?? undefined,
      metadata: {
        source: event.source,
        counts: event.counts,
      },
    });
    this.logger.log(`Menu imported from ${event.source}`);
  }

  @OnEvent(MENU_EVENTS.MENU_CREATED)
  async onCreated(event: MenuCreatedEvent) {
    await this.audit.record({
      eventType: MENU_EVENTS.MENU_CREATED,
      entityType: 'menuItem',
      entityId: event.menuItemId,
      action: 'CREATE',
      userId: event.createdBy ?? undefined,
      metadata: {
        sku: event.sku,
        name: event.name,
        slug: event.slug,
        foodType: event.foodType,
        categoryId: event.categoryId,
      },
    });
  }

  @OnEvent(MENU_EVENTS.MENU_UPDATED)
  async onUpdated(event: MenuUpdatedEvent) {
    await this.audit.record({
      eventType: MENU_EVENTS.MENU_UPDATED,
      entityType: 'menuItem',
      entityId: event.menuItemId,
      action: 'UPDATE',
      userId: event.updatedBy ?? undefined,
      metadata: {
        sku: event.sku,
        changedFields: event.changedFields,
        previousStatus: event.previousStatus,
        currentStatus: event.currentStatus,
      },
    });
  }

  @OnEvent(MENU_EVENTS.MENU_ARCHIVED)
  async onArchived(event: MenuArchivedEvent) {
    await this.audit.record({
      eventType: MENU_EVENTS.MENU_ARCHIVED,
      entityType: 'menuItem',
      entityId: event.menuItemId,
      action: 'ARCHIVE',
      userId: event.archivedBy ?? undefined,
      metadata: { sku: event.sku },
    });
  }

  @OnEvent(MENU_EVENTS.IMAGE_ADDED)
  async onImageAdded(event: MenuImageAddedEvent) {
    await this.audit.record({
      eventType: MENU_EVENTS.IMAGE_ADDED,
      entityType: 'menuItemImage',
      entityId: event.imageId,
      action: 'CREATE',
      metadata: {
        menuItemId: event.menuItemId,
        url: event.url,
        isPrimary: event.isPrimary,
      },
    });
  }

  @OnEvent(MENU_EVENTS.TAG_ASSIGNED)
  async onTagAssigned(event: MenuTagAssignedEvent) {
    await this.audit.record({
      eventType: MENU_EVENTS.TAG_ASSIGNED,
      entityType: 'menuItemTag',
      entityId: event.tagId,
      action: 'ASSIGN',
      userId: event.assignedBy ?? undefined,
      metadata: {
        menuItemId: event.menuItemId,
        tagSlug: event.tagSlug,
      },
    });
  }
}
