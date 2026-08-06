import { FoodType, MenuStatus, SpiceLevel } from '@prisma/client';

export interface MenuCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
  brandId: string | null;
  status: MenuStatus;
  itemCount?: number;
  children?: MenuCategoryResponse[];
}

export interface MenuItemImageResponse {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface MenuTagResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  colorHex: string | null;
  icon: string | null;
  sortOrder: number;
  status: MenuStatus;
  itemCount?: number;
}

/** Card-sized projection for listings. */
export interface MenuItemListItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  foodType: FoodType;
  spiceLevel: SpiceLevel | null;
  status: MenuStatus;
  isFeatured: boolean;
  isRecommended: boolean;
  isSeasonal: boolean;
  sortOrder: number;
  primaryImage: MenuItemImageResponse | null;
  category: { id: string; name: string; slug: string } | null;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface MenuItemDetail extends MenuItemListItem {
  description: string | null;
  brandId: string | null;
  preparationTime: number | null;
  servingSize: string | null;
  nutrition: MenuItemNutrition;
  searchKeywords: string[];
  images: MenuItemImageResponse[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemNutrition {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

// ─── Import engine ────────────────────────────────────────

export type ImportIssueSeverity = 'ERROR' | 'WARNING';

/**
 * One problem found in the source, addressed to whoever has to fix the JSON:
 * what went wrong, and exactly where.
 */
export interface ImportIssue {
  severity: ImportIssueSeverity;
  code: string;
  message: string;
  /** Dotted path into the source, e.g. `stores[0].categories[2].items[5]`. */
  path: string;
  /** The offending value, when quoting it helps. */
  value?: string | null;
}

/** A category as the importer intends to persist it. */
export interface NormalizedCategory {
  sourceId: string;
  name: string;
  slug: string;
  sortOrder: number;
  brandName: string | null;
  itemCount: number;
}

export interface NormalizedImage {
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

/** An item as the importer intends to persist it. Master fields only. */
export interface NormalizedItem {
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  foodType: FoodType;
  categorySlug: string;
  brandName: string | null;
  tagSlugs: string[];
  images: NormalizedImage[];
  searchKeywords: string[];
  sortOrder: number;
  /** Stores this dish appeared in. Provenance only — never persisted here. */
  sourceStoreCodes: string[];
}

export interface NormalizedTag {
  name: string;
  slug: string;
}

export interface NormalizedMenu {
  categories: NormalizedCategory[];
  items: NormalizedItem[];
  tags: NormalizedTag[];
}

export interface ImportCounts {
  storesScanned: number;
  categories: number;
  items: number;
  images: number;
  tags: number;
  duplicateItemRows: number;
  skipped: number;
}

/**
 * The outcome of a dry run: what would be written, what is wrong, and whether
 * the import may proceed.
 */
export interface ImportReport {
  dryRun: boolean;
  readyToImport: boolean;
  counts: ImportCounts;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  /** Present only when validation passed; this is what would be written. */
  normalized?: NormalizedMenu;
  durationMs: number;
}
