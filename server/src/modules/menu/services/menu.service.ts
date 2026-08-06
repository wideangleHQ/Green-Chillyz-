import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FoodType, MenuStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MenuRepository } from '../repositories';
import { MenuCacheService } from '../cache';
import { MenuImportService } from './menu-import.service';
import {
  CreateMenuCategoryDto,
  CreateMenuItemDto,
  CreateMenuItemImageDto,
  CreateMenuTagDto,
  MenuItemQueryDto,
  MenuSearchDto,
  UpdateMenuCategoryDto,
  UpdateMenuItemDto,
  UpdateMenuTagDto,
} from '../dto';
import { MENU_DEFAULTS, MENU_ERRORS, MENU_EVENTS, MENU_SORT } from '../constants';
import { ImportReport, NormalizedMenu } from '../interfaces';
import {
  MenuArchivedEvent,
  MenuCreatedEvent,
  MenuImageAddedEvent,
  MenuImportedEvent,
  MenuTagAssignedEvent,
  MenuUpdatedEvent,
} from '../events';
import { buildSearchKeywords, generateSku, slugify, uniqueSlug, normalizeSearchQuery } from '../utils';

const PLACEHOLDER_IMAGE = '/assets/menu/placeholder.webp';
const PLACEHOLDER_THUMB = '/assets/menu/placeholder-thumb.webp';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: MenuRepository,
    private readonly cache: MenuCacheService,
    private readonly importService: MenuImportService,
    private readonly events: EventEmitter2,
  ) {}

  // ─── Import ──────────────────────────────────────────────

  async runImport(
    source: { filePath?: string; rawJson?: string },
    importedBy?: string,
  ): Promise<ImportReport> {
    const report = source.rawJson
      ? this.importService.analyzeJson(source.rawJson)
      : await this.importService.analyzeFile(
          source.filePath ?? require('path').join(process.cwd(), 'src', 'menu.json'),
        );

    if (!report.readyToImport || !report.normalized) {
      return report;
    }

    const normalized = report.normalized;
    await this.persistImport(normalized, importedBy);

    report.dryRun = false;

    this.events.emit(
      MENU_EVENTS.MENU_IMPORTED,
      new MenuImportedEvent('menu.json', report.counts, importedBy ?? null),
    );

    await this.cache.invalidateAll();

    this.logger.log(
      `Menu imported: ${report.counts.categories} categories, ${report.counts.items} items, ${report.counts.tags} tags`,
    );

    return report;
  }

  private async persistImport(normalized: NormalizedMenu, importedBy?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const categoryIdBySlug = new Map<string, string>();
      const tagIdBySlug = new Map<string, string>();

      // 1. Upsert tags
      for (const tag of normalized.tags) {
        const existing = await tx.menuTag.findUnique({ where: { slug: tag.slug } });
        if (existing) {
          tagIdBySlug.set(tag.slug, existing.id);
        } else {
          const created = await tx.menuTag.create({
            data: { name: tag.name, slug: tag.slug, status: 'ACTIVE' },
          });
          tagIdBySlug.set(tag.slug, created.id);
        }
      }

      // 2. Upsert categories
      for (const cat of normalized.categories) {
        const existing = await tx.menuCategory.findFirst({
          where: { slug: cat.slug, deletedAt: null },
        });
        if (existing) {
          categoryIdBySlug.set(cat.slug, existing.id);
        } else {
          const created = await tx.menuCategory.create({
            data: {
              name: cat.name,
              slug: cat.slug,
              sortOrder: cat.sortOrder,
              status: 'ACTIVE',
              createdBy: importedBy ?? null,
            },
          });
          categoryIdBySlug.set(cat.slug, created.id);
        }
      }

      // 3. Upsert items with images and tag relations
      for (const item of normalized.items) {
        const existingItem = await tx.menuItem.findUnique({ where: { sku: item.sku } });

        if (existingItem) {
          continue;
        }

        const categoryId = categoryIdBySlug.get(item.categorySlug) ?? null;

        const created = await tx.menuItem.create({
          data: {
            sku: item.sku,
            name: item.name,
            slug: item.slug,
            shortDescription: item.shortDescription,
            description: item.description,
            foodType: item.foodType,
            categoryId,
            sortOrder: item.sortOrder,
            searchKeywords: item.searchKeywords,
            status: 'ACTIVE',
            createdBy: importedBy ?? null,
          },
        });

        // Images — use placeholder if none provided
        if (item.images.length > 0) {
          await tx.menuItemImage.createMany({
            data: item.images.map((img) => ({
              menuItemId: created.id,
              url: img.url,
              thumbnailUrl: img.thumbnailUrl,
              altText: img.altText ?? item.name,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder,
            })),
          });
        } else {
          await tx.menuItemImage.create({
            data: {
              menuItemId: created.id,
              url: PLACEHOLDER_IMAGE,
              thumbnailUrl: PLACEHOLDER_THUMB,
              altText: item.name,
              isPrimary: true,
              displayOrder: 0,
            },
          });
        }

        // Tag relations
        for (const tagSlug of item.tagSlugs) {
          const tagId = tagIdBySlug.get(tagSlug);
          if (tagId) {
            await tx.menuItemTag.create({
              data: { menuItemId: created.id, tagId },
            });
          }
        }
      }
    }, { timeout: 120000 });
  }

  // ─── Categories ──────────────────────────────────────────

  async findCategories(status?: MenuStatus) {
    const cached = await this.cache.getCategories();
    if (cached && !status) return cached;

    const where: Prisma.MenuCategoryWhereInput = {};
    if (status) where.status = status;

    const categories = await this.repo.findCategories(where);
    if (!status) await this.cache.setCategories(categories);
    return categories;
  }

  async findCategoryByIdOrSlug(idOrSlug: string) {
    const cached = await this.cache.getCategory(idOrSlug);
    if (cached) return cached;

    const category = await this.repo.findCategoryByIdOrSlug(idOrSlug);
    if (!category) throw new NotFoundException(MENU_ERRORS.CATEGORY_NOT_FOUND);

    await this.cache.setCategory(idOrSlug, category);
    return category;
  }

  async createCategory(dto: CreateMenuCategoryDto, createdBy?: string) {
    const slug = dto.slug || slugify(dto.name);

    const existingSlug = await this.repo.findCategoryBySlug(slug);
    if (existingSlug) throw new ConflictException(MENU_ERRORS.CATEGORY_SLUG_EXISTS);

    const category = await this.repo.createCategory({
      name: dto.name,
      slug,
      description: dto.description,
      image: dto.image,
      icon: dto.icon,
      sortOrder: dto.sortOrder ?? 0,
      status: dto.status ?? 'DRAFT',
      createdBy,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
      ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
    });

    await this.cache.invalidateCategory(category.id, slug);
    return category;
  }

  async updateCategory(id: string, dto: UpdateMenuCategoryDto, updatedBy?: string) {
    const existing = await this.repo.findCategoryByIdOrSlug(id);
    if (!existing) throw new NotFoundException(MENU_ERRORS.CATEGORY_NOT_FOUND);

    const category = await this.repo.updateCategory(existing.id, {
      ...dto,
      updatedBy,
    });

    await this.cache.invalidateCategory(existing.id, existing.slug);
    return category;
  }

  async deleteCategory(id: string, deletedBy?: string) {
    const existing = await this.repo.findCategoryByIdOrSlug(id);
    if (!existing) throw new NotFoundException(MENU_ERRORS.CATEGORY_NOT_FOUND);

    const count = await this.repo.countItemsInCategory(existing.id);
    if (count > 0) throw new BadRequestException(MENU_ERRORS.CATEGORY_HAS_ITEMS);

    await this.repo.softDeleteCategory(existing.id, deletedBy);
    await this.cache.invalidateCategory(existing.id, existing.slug);
  }

  // ─── Items ───────────────────────────────────────────────

  async findItems(query: MenuItemQueryDto) {
    const cacheKey = this.cache.buildListKey('menu:items:', query as unknown as Record<string, unknown>);
    const cached = await this.cache.getItems(cacheKey);
    if (cached) return cached;

    const where: Prisma.MenuItemWhereInput = {};
    if (query.status) where.status = query.status;
    else where.status = { not: 'ARCHIVED' };
    if (query.foodType) where.foodType = query.foodType;
    if (query.brandId) where.brandId = query.brandId;
    if (query.featuredOnly) where.isFeatured = true;
    if (query.category) {
      const cat = await this.repo.findCategoryBySlug(query.category);
      if (cat) where.categoryId = cat.id;
    }
    if (query.tag) {
      where.tags = { some: { tag: { slug: query.tag } } };
    }

    const orderBy = this.resolveSort(query.sort);
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? MENU_DEFAULTS.PAGE_SIZE, MENU_DEFAULTS.MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.repo.findItems(where, orderBy, skip, pageSize);

    const result = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    await this.cache.setItems(cacheKey, result);
    return result;
  }

  async findItemByIdOrSlug(idOrSlug: string) {
    const cached = await this.cache.getItem(idOrSlug);
    if (cached) return cached;

    const item = await this.repo.findItemByIdOrSlug(idOrSlug);
    if (!item) throw new NotFoundException(MENU_ERRORS.ITEM_NOT_FOUND);

    await this.cache.setItem(idOrSlug, item);
    return item;
  }

  async findFeatured() {
    const cached = await this.cache.getFeatured();
    if (cached) return cached;

    const items = await this.repo.findFeatured(MENU_DEFAULTS.FEATURED_LIMIT);
    await this.cache.setFeatured(items);
    return items;
  }

  async createItem(dto: CreateMenuItemDto, createdBy?: string) {
    if (dto.slug) {
      const existingSlug = await this.repo.findItemBySlug(dto.slug);
      if (existingSlug) throw new ConflictException(MENU_ERRORS.ITEM_SLUG_EXISTS);
    }

    const slug = dto.slug || slugify(dto.name);
    const finalSlug = (await this.repo.findItemBySlug(slug))
      ? slugify(`${dto.name}-${Date.now()}`)
      : slug;

    let sku = dto.sku;
    if (sku) {
      const existingSku = await this.repo.findItemBySku(sku);
      if (existingSku) throw new ConflictException(MENU_ERRORS.SKU_EXISTS);
    } else {
      const categoryName = dto.categoryId
        ? (await this.repo.findCategoryByIdOrSlug(dto.categoryId))?.name ?? 'ITEM'
        : 'ITEM';
      const existingSkus = new Set<string>();
      sku = generateSku('GC', categoryName, existingSkus);
    }

    const categoryName = dto.categoryId
      ? (await this.repo.findCategoryByIdOrSlug(dto.categoryId))?.name
      : undefined;

    const searchKeywords = buildSearchKeywords({
      name: dto.name,
      categoryName: categoryName ?? undefined,
      tagNames: [],
      shortDescription: dto.shortDescription,
    });
    if (dto.searchKeywords) searchKeywords.push(...dto.searchKeywords);

    const item = await this.repo.createItem({
      sku,
      name: dto.name,
      slug: finalSlug,
      shortDescription: dto.shortDescription,
      description: dto.description,
      foodType: dto.foodType,
      spiceLevel: dto.spiceLevel,
      preparationTime: dto.preparationTime,
      servingSize: dto.servingSize,
      calories: dto.calories,
      protein: dto.protein,
      fat: dto.fat,
      carbs: dto.carbs,
      status: dto.status ?? 'DRAFT',
      isFeatured: dto.isFeatured ?? false,
      isRecommended: dto.isRecommended ?? false,
      isSeasonal: dto.isSeasonal ?? false,
      sortOrder: dto.sortOrder ?? 0,
      searchKeywords,
      metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      createdBy: createdBy ?? null,
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
      ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
    });

    // Create placeholder image
    await this.repo.createImage({
      menuItem: { connect: { id: item.id } },
      url: PLACEHOLDER_IMAGE,
      thumbnailUrl: PLACEHOLDER_THUMB,
      altText: dto.name,
      isPrimary: true,
      displayOrder: 0,
    });

    // Assign tags
    if (dto.tagIds?.length) {
      for (const tagId of dto.tagIds) {
        try {
          await this.repo.assignTag(item.id, tagId, createdBy);
        } catch {
          // tag might not exist — skip silently
        }
      }
    }

    this.events.emit(
      MENU_EVENTS.MENU_CREATED,
      new MenuCreatedEvent(item.id, sku, dto.name, finalSlug, dto.foodType, dto.categoryId ?? null, createdBy ?? null),
    );

    await this.cache.invalidateItem(item.id, finalSlug);
    return this.repo.findItemByIdOrSlug(item.id);
  }

  async updateItem(id: string, dto: UpdateMenuItemDto, updatedBy?: string) {
    const existing = await this.repo.findItemByIdOrSlug(id);
    if (!existing) throw new NotFoundException(MENU_ERRORS.ITEM_NOT_FOUND);

    const changedFields: string[] = Object.keys(dto);

    const categoryName = dto.categoryId
      ? (await this.repo.findCategoryByIdOrSlug(dto.categoryId))?.name
      : existing.category?.name;

    const tagNames = existing.tags?.map((t: any) => t.tag?.name ?? t.tag?.slug) ?? [];

    const searchKeywords = buildSearchKeywords({
      name: dto.name ?? existing.name,
      categoryName: categoryName ?? undefined,
      tagNames,
      shortDescription: dto.shortDescription ?? existing.shortDescription,
    });
    if (dto.searchKeywords) searchKeywords.push(...dto.searchKeywords);

    const updateData: Prisma.MenuItemUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.foodType && { foodType: dto.foodType }),
      ...(dto.spiceLevel !== undefined && { spiceLevel: dto.spiceLevel }),
      ...(dto.preparationTime !== undefined && { preparationTime: dto.preparationTime }),
      ...(dto.servingSize !== undefined && { servingSize: dto.servingSize }),
      ...(dto.calories !== undefined && { calories: dto.calories }),
      ...(dto.protein !== undefined && { protein: dto.protein }),
      ...(dto.fat !== undefined && { fat: dto.fat }),
      ...(dto.carbs !== undefined && { carbs: dto.carbs }),
      ...(dto.status && { status: dto.status }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      ...(dto.isRecommended !== undefined && { isRecommended: dto.isRecommended }),
      ...(dto.isSeasonal !== undefined && { isSeasonal: dto.isSeasonal }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.metadata !== undefined && { metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull }),
      searchKeywords,
      updatedBy: updatedBy ?? null,
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
      ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
    };

    const item = await this.repo.updateItem(existing.id, updateData);

    // Sync tags if provided
    if (dto.tagIds) {
      const currentTagIds = await this.repo.findAssignedTagIds(existing.id);
      const toRemove = currentTagIds.filter((t) => !dto.tagIds!.includes(t));
      const toAdd = dto.tagIds.filter((t) => !currentTagIds.includes(t));
      for (const tagId of toRemove) await this.repo.removeTag(existing.id, tagId);
      for (const tagId of toAdd) {
        try {
          await this.repo.assignTag(existing.id, tagId, updatedBy);
        } catch {
          // skip
        }
      }
    }

    this.events.emit(
      MENU_EVENTS.MENU_UPDATED,
      new MenuUpdatedEvent(
        existing.id,
        existing.sku,
        changedFields,
        existing.status,
        dto.status ?? existing.status,
        updatedBy ?? null,
      ),
    );

    await this.cache.invalidateItem(existing.id, existing.slug);
    return this.repo.findItemByIdOrSlug(existing.id);
  }

  async archiveItem(id: string, archivedBy?: string) {
    const existing = await this.repo.findItemByIdOrSlug(id);
    if (!existing) throw new NotFoundException(MENU_ERRORS.ITEM_NOT_FOUND);

    await this.repo.softDeleteItem(existing.id, archivedBy);

    this.events.emit(
      MENU_EVENTS.MENU_ARCHIVED,
      new MenuArchivedEvent(existing.id, existing.sku, archivedBy ?? null),
    );

    await this.cache.invalidateItem(existing.id, existing.slug);
  }

  // ─── Search ──────────────────────────────────────────────

  async search(dto: MenuSearchDto) {
    const cacheKey = this.cache.buildSearchKey(dto.q, dto as unknown as Record<string, unknown>);
    const cached = await this.cache.getSearch(cacheKey);
    if (cached) return cached;

    const tokens = normalizeSearchQuery(dto.q);
    if (tokens.length === 0) return { items: [], total: 0, page: 1, pageSize: MENU_DEFAULTS.PAGE_SIZE, totalPages: 0 };

    const where: Prisma.MenuItemWhereInput = {};
    if (dto.foodType) where.foodType = dto.foodType;
    if (dto.category) {
      const cat = await this.repo.findCategoryBySlug(dto.category);
      if (cat) where.categoryId = cat.id;
    }

    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? MENU_DEFAULTS.PAGE_SIZE, MENU_DEFAULTS.MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.repo.searchItems(tokens, where, skip, pageSize);

    const result = { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    await this.cache.setSearch(cacheKey, result);
    return result;
  }

  // ─── Images ──────────────────────────────────────────────

  async addImage(menuItemId: string, dto: CreateMenuItemImageDto) {
    const item = await this.repo.findItemByIdOrSlug(menuItemId);
    if (!item) throw new NotFoundException(MENU_ERRORS.ITEM_NOT_FOUND);

    if (dto.isPrimary) {
      await this.repo.clearPrimaryImages(item.id);
    }

    const image = await this.repo.createImage({
      menuItem: { connect: { id: item.id } },
      url: dto.url,
      thumbnailUrl: dto.thumbnailUrl,
      altText: dto.altText ?? item.name,
      isPrimary: dto.isPrimary ?? false,
      displayOrder: dto.displayOrder ?? 0,
    });

    this.events.emit(
      MENU_EVENTS.IMAGE_ADDED,
      new MenuImageAddedEvent(item.id, image.id, dto.url, dto.isPrimary ?? false),
    );

    await this.cache.invalidateItem(item.id, item.slug);
    return image;
  }

  async replaceImage(imageId: string, dto: CreateMenuItemImageDto) {
    const images = await this.prisma.menuItemImage.findMany({
      where: { id: imageId },
      select: { id: true, menuItemId: true },
    });
    if (images.length === 0) throw new NotFoundException(MENU_ERRORS.IMAGE_NOT_FOUND);

    const menuItemId = images[0].menuItemId;

    if (dto.isPrimary) {
      await this.repo.clearPrimaryImages(menuItemId, imageId);
    }

    const updated = await this.prisma.menuItemImage.update({
      where: { id: imageId },
      data: {
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        altText: dto.altText,
        isPrimary: dto.isPrimary ?? false,
        displayOrder: dto.displayOrder ?? 0,
      },
    });

    await this.cache.invalidateItem(menuItemId);
    return updated;
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.menuItemImage.findUnique({
      where: { id: imageId },
      select: { id: true, menuItemId: true },
    });
    if (!image) throw new NotFoundException(MENU_ERRORS.IMAGE_NOT_FOUND);

    await this.repo.deleteImage(imageId);
    await this.cache.invalidateItem(image.menuItemId);
  }

  // ─── Tags ────────────────────────────────────────────────

  async findTags(status?: MenuStatus) {
    if (!status) {
      const cached = await this.cache.getTags();
      if (cached) return cached;
    }

    const where: Prisma.MenuTagWhereInput = {};
    if (status) where.status = status;

    const tags = await this.repo.findTags(where);
    if (!status) await this.cache.setTags(tags);
    return tags;
  }

  async createTag(dto: CreateMenuTagDto) {
    const slug = dto.slug || slugify(dto.name);

    const existing = await this.repo.findTagBySlug(slug);
    if (existing) throw new ConflictException(MENU_ERRORS.TAG_SLUG_EXISTS);

    const tag = await this.repo.createTag({
      name: dto.name,
      slug,
      description: dto.description,
      colorHex: dto.colorHex,
      icon: dto.icon,
      sortOrder: dto.sortOrder ?? 0,
      status: dto.status ?? 'ACTIVE',
    });

    await this.cache.invalidateTags();
    return tag;
  }

  async updateTag(id: string, dto: UpdateMenuTagDto) {
    const existing = await this.repo.findTags({ id });
    if (existing.length === 0) throw new NotFoundException(MENU_ERRORS.TAG_NOT_FOUND);

    const tag = await this.repo.updateTag(id, dto);
    await this.cache.invalidateTags();
    return tag;
  }

  async deleteTag(id: string) {
    const existing = await this.repo.findTags({ id });
    if (existing.length === 0) throw new NotFoundException(MENU_ERRORS.TAG_NOT_FOUND);

    await this.repo.softDeleteTag(id);
    await this.cache.invalidateTags();
  }

  // ─── Helpers ─────────────────────────────────────────────

  private resolveSort(sort?: string): Prisma.MenuItemOrderByWithRelationInput[] {
    switch (sort) {
      case MENU_SORT.NAME_ASC:
        return [{ name: 'asc' }];
      case MENU_SORT.NAME_DESC:
        return [{ name: 'desc' }];
      case MENU_SORT.NEWEST:
        return [{ createdAt: 'desc' }];
      default:
        return [{ sortOrder: 'asc' }, { name: 'asc' }];
    }
  }
}
