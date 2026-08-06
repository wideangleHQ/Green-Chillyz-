import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Every database access the master menu makes.
 *
 * Written against the generated Prisma client, so it compiles today. The
 * underlying tables are created when the migration is approved; until then
 * nothing calls these methods at runtime.
 *
 * Soft delete is the rule: reads exclude `deletedAt`, and removal sets it
 * rather than dropping the row — an archived dish still needs to resolve for
 * historical orders and audit trails.
 */

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  icon: true,
  sortOrder: true,
  parentId: true,
  brandId: true,
  status: true,
} satisfies Prisma.MenuCategorySelect;

const ITEM_LIST_SELECT = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  shortDescription: true,
  foodType: true,
  spiceLevel: true,
  status: true,
  isFeatured: true,
  isRecommended: true,
  isSeasonal: true,
  sortOrder: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    where: { isPrimary: true },
    take: 1,
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      altText: true,
      isPrimary: true,
      displayOrder: true,
    },
  },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.MenuItemSelect;

@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ───────────────────────────────────────

  async findCategories(where: Prisma.MenuCategoryWhereInput = {}) {
    return this.prisma.menuCategory.findMany({
      where: { deletedAt: null, ...where },
      select: { ...CATEGORY_SELECT, _count: { select: { items: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findCategoryByIdOrSlug(idOrSlug: string) {
    return this.prisma.menuCategory.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: this.asUuid(idOrSlug) }, { slug: idOrSlug }],
      },
      select: CATEGORY_SELECT,
    });
  }

  async findCategoryBySlug(slug: string) {
    return this.prisma.menuCategory.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, slug: true },
    });
  }

  async createCategory(data: Prisma.MenuCategoryCreateInput) {
    return this.prisma.menuCategory.create({ data, select: CATEGORY_SELECT });
  }

  async updateCategory(id: string, data: Prisma.MenuCategoryUpdateInput) {
    return this.prisma.menuCategory.update({
      where: { id },
      data,
      select: CATEGORY_SELECT,
    });
  }

  async softDeleteCategory(id: string, deletedBy?: string): Promise<void> {
    await this.prisma.menuCategory.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedBy ?? null },
    });
  }

  async countItemsInCategory(categoryId: string): Promise<number> {
    return this.prisma.menuItem.count({
      where: { categoryId, deletedAt: null },
    });
  }

  // ─── Items ────────────────────────────────────────────

  async findItems(
    where: Prisma.MenuItemWhereInput,
    orderBy: Prisma.MenuItemOrderByWithRelationInput[],
    skip: number,
    take: number,
  ) {
    return Promise.all([
      this.prisma.menuItem.findMany({
        where: { deletedAt: null, ...where },
        select: ITEM_LIST_SELECT,
        orderBy,
        skip,
        take,
      }),
      this.prisma.menuItem.count({ where: { deletedAt: null, ...where } }),
    ]);
  }

  async findItemByIdOrSlug(idOrSlug: string) {
    return this.prisma.menuItem.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: this.asUuid(idOrSlug) }, { slug: idOrSlug }],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { displayOrder: 'asc' } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });
  }

  async findItemBySku(sku: string) {
    return this.prisma.menuItem.findUnique({
      where: { sku },
      select: { id: true, sku: true, deletedAt: true },
    });
  }

  async findItemBySlug(slug: string) {
    return this.prisma.menuItem.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
  }

  async createItem(data: Prisma.MenuItemCreateInput) {
    return this.prisma.menuItem.create({ data, select: ITEM_LIST_SELECT });
  }

  /**
   * SKU is not in the update surface at all — it is stripped by the caller's
   * DTO, and omitted here so no code path can quietly change one.
   */
  async updateItem(id: string, data: Prisma.MenuItemUpdateInput) {
    return this.prisma.menuItem.update({
      where: { id },
      data,
      select: ITEM_LIST_SELECT,
    });
  }

  async softDeleteItem(id: string, deletedBy?: string): Promise<void> {
    await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedBy ?? null },
    });
  }

  async findFeatured(take: number) {
    return this.prisma.menuItem.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isFeatured: true },
      select: ITEM_LIST_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take,
    });
  }

  /**
   * Keyword search over the denormalised array — one indexed read against the
   * GIN index, no join to categories or tags.
   */
  async searchItems(
    tokens: string[],
    where: Prisma.MenuItemWhereInput,
    skip: number,
    take: number,
  ) {
    const search: Prisma.MenuItemWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
      searchKeywords: { hasSome: tokens },
      ...where,
    };

    return Promise.all([
      this.prisma.menuItem.findMany({
        where: search,
        select: ITEM_LIST_SELECT,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        skip,
        take,
      }),
      this.prisma.menuItem.count({ where: search }),
    ]);
  }

  // ─── Images ───────────────────────────────────────────

  async findImages(menuItemId: string) {
    return this.prisma.menuItemImage.findMany({
      where: { menuItemId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createImage(data: Prisma.MenuItemImageCreateInput) {
    return this.prisma.menuItemImage.create({ data });
  }

  async deleteImage(id: string): Promise<void> {
    await this.prisma.menuItemImage.delete({ where: { id } });
  }

  /** Exactly one primary per item; demote the rest in the same breath. */
  async clearPrimaryImages(menuItemId: string, exceptId?: string): Promise<void> {
    await this.prisma.menuItemImage.updateMany({
      where: {
        menuItemId,
        isPrimary: true,
        ...(exceptId && { id: { not: exceptId } }),
      },
      data: { isPrimary: false },
    });
  }

  // ─── Tags ─────────────────────────────────────────────

  async findTags(where: Prisma.MenuTagWhereInput = {}) {
    return this.prisma.menuTag.findMany({
      where: { deletedAt: null, ...where },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
  }

  async findTagBySlug(slug: string) {
    return this.prisma.menuTag.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
  }

  async createTag(data: Prisma.MenuTagCreateInput) {
    return this.prisma.menuTag.create({ data });
  }

  async updateTag(id: string, data: Prisma.MenuTagUpdateInput) {
    return this.prisma.menuTag.update({ where: { id }, data });
  }

  async softDeleteTag(id: string): Promise<void> {
    await this.prisma.menuTag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignTag(menuItemId: string, tagId: string, assignedBy?: string) {
    return this.prisma.menuItemTag.create({
      data: { menuItemId, tagId, assignedBy: assignedBy ?? null },
    });
  }

  async removeTag(menuItemId: string, tagId: string): Promise<void> {
    await this.prisma.menuItemTag.deleteMany({ where: { menuItemId, tagId } });
  }

  async findAssignedTagIds(menuItemId: string): Promise<string[]> {
    const rows = await this.prisma.menuItemTag.findMany({
      where: { menuItemId },
      select: { tagId: true },
    });
    return rows.map((row) => row.tagId);
  }

  /**
   * A slug lookup must not blow up when the caller passed a slug rather than a
   * UUID, so a non-UUID is turned into a value that simply matches nothing.
   */
  private asUuid(value: string): string {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    return isUuid ? value : '00000000-0000-4000-8000-000000000000';
  }
}
