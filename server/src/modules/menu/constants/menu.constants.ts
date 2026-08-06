export const MENU_ERRORS = {
  CATEGORY_NOT_FOUND: 'Menu category not found',
  CATEGORY_SLUG_EXISTS: 'A category with this slug already exists',
  CATEGORY_HAS_ITEMS: 'Category still has menu items and cannot be removed',
  CATEGORY_CYCLE: 'A category cannot be its own ancestor',
  ITEM_NOT_FOUND: 'Menu item not found',
  ITEM_SLUG_EXISTS: 'A menu item with this slug already exists',
  SKU_EXISTS: 'A menu item with this SKU already exists',
  SKU_IMMUTABLE: 'SKU cannot be changed after creation',
  SKU_INVALID: 'SKU must look like GC-BIR-001',
  IMAGE_NOT_FOUND: 'Menu item image not found',
  IMAGE_URL_INVALID: 'Image URL must be an absolute http(s) URL',
  TAG_NOT_FOUND: 'Menu tag not found',
  TAG_SLUG_EXISTS: 'A tag with this slug already exists',
  TAG_ALREADY_ASSIGNED: 'Tag is already assigned to this item',
  BRAND_NOT_FOUND: 'Brand not found',
} as const;

export const MENU_IMPORT_ERRORS = {
  MALFORMED_JSON: 'Menu source is not valid JSON',
  EMPTY_SOURCE: 'Menu source contains no stores',
  MISSING_FIELD: 'Required field is missing',
  DUPLICATE_SKU: 'Duplicate SKU with conflicting item data',
  DUPLICATE_SLUG: 'Two different items resolve to the same slug',
  DUPLICATE_CATEGORY: 'Two different categories resolve to the same slug',
  INVALID_FOOD_TYPE: 'Unrecognised food type',
  INVALID_IMAGE_URL: 'Image URL is not an absolute http(s) URL',
  BROKEN_RELATIONSHIP: 'Item references a category that does not exist',
  INVALID_TAG: 'Tag name is empty or unusable',
  NO_PRIMARY_IMAGE: 'Item has images but none marked primary',
} as const;

export const MENU_PERMISSIONS = {
  CATEGORY_MANAGE: 'MENU_CATEGORY_MANAGE',
  ITEM_CREATE: 'MENU_ITEM_CREATE',
  ITEM_UPDATE: 'MENU_ITEM_UPDATE',
  ITEM_DELETE: 'MENU_ITEM_DELETE',
  ITEM_VIEW_ADMIN: 'MENU_ITEM_VIEW_ADMIN',
  TAG_MANAGE: 'MENU_TAG_MANAGE',
  IMAGE_MANAGE: 'MENU_IMAGE_MANAGE',
  IMPORT_RUN: 'MENU_IMPORT_RUN',
} as const;

/**
 * Redis key space. Declared now so the cache service and its invalidation
 * rules are settled before the first write path exists.
 */
export const MENU_CACHE = {
  PREFIX: 'menu:',
  CATEGORIES: 'menu:categories',
  CATEGORY_TREE: 'menu:categories:tree',
  CATEGORY: 'menu:category:',
  ITEM: 'menu:item:',
  ITEMS: 'menu:items:',
  TAGS: 'menu:tags',
  FEATURED: 'menu:featured',
  POPULAR: 'menu:popular',
  SEARCH: 'menu:search:',

  TTL_CATEGORIES: 600,
  TTL_CATEGORY: 300,
  TTL_ITEM: 300,
  TTL_ITEMS: 180,
  TTL_TAGS: 600,
  TTL_FEATURED: 300,
  TTL_POPULAR: 600,
  TTL_SEARCH: 120,
} as const;

export const MENU_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  FEATURED_LIMIT: 12,
  POPULAR_LIMIT: 12,
  RELATED_LIMIT: 8,
  SEARCH_MIN_LENGTH: 2,
  MAX_IMAGES_PER_ITEM: 10,
} as const;

/**
 * Domain events. Declared and typed now; nothing publishes them until the
 * write paths are migrated and switched on.
 */
export const MENU_EVENTS = {
  MENU_IMPORTED: 'menu.imported',
  MENU_VALIDATED: 'menu.validated',
  MENU_CREATED: 'menu.created',
  MENU_UPDATED: 'menu.updated',
  MENU_ARCHIVED: 'menu.archived',
  IMAGE_ADDED: 'menu.image.added',
  TAG_ASSIGNED: 'menu.tag.assigned',
} as const;

/** `GC-BIR-001`: brand prefix, category mnemonic, zero-padded sequence. */
export const SKU_PATTERN = /^[A-Z]{2,4}-[A-Z0-9]{2,6}-\d{3,5}$/;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MENU_SORT = {
  SORT_ORDER: 'sortOrder',
  NAME_ASC: 'nameAsc',
  NAME_DESC: 'nameDesc',
  NEWEST: 'newest',
} as const;
