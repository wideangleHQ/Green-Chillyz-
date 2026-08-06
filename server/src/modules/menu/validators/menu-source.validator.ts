import { FoodType } from '@prisma/client';
import { ImportIssue } from '../interfaces';
import { MENU_IMPORT_ERRORS } from '../constants';

/**
 * Shape of the source menu document, as authored.
 *
 * Store-scoped fields (`price`, `available`, `todaySpecial`) are declared here
 * because the file carries them — but the master engine reads none of them.
 * They belong to the Store Menu layer and are dropped during normalization.
 */
export interface RawMenuSource {
  version?: string;
  generatedAt?: string;
  stores?: RawStoreBlock[];
}

export interface RawStoreBlock {
  store?: {
    id?: string;
    code?: string;
    name?: string;
    brand?: string;
    city?: string;
  };
  categories?: RawCategory[];
}

export interface RawCategory {
  id?: string;
  name?: string;
  displayOrder?: number;
  items?: RawItem[];
}

export interface RawItem {
  id?: string;
  sku?: string;
  name?: string;
  description?: string;
  foodType?: string;
  displayOrder?: number;
  tags?: string[];
  images?: RawImage[];

  // Store-scoped; present in the file, never imported into the master menu.
  price?: number;
  available?: boolean;
  featured?: boolean;
  todaySpecial?: boolean;
}

export interface RawImage {
  url?: string;
  thumbnail?: string;
  isPrimary?: boolean;
  altText?: string;
}

export function issue(
  severity: ImportIssue['severity'],
  code: string,
  message: string,
  path: string,
  value?: string | null,
): ImportIssue {
  return { severity, code, message, path, value: value ?? null };
}

/**
 * Confirms the document is structurally usable before anything reads it
 * field by field. Returns structural errors only — content is validated later,
 * so a caller gets "this file is the wrong shape" separately from "row 400 is
 * missing a name".
 */
export function validateSourceShape(source: unknown): ImportIssue[] {
  const errors: ImportIssue[] = [];

  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    errors.push(
      issue(
        'ERROR',
        'MALFORMED_JSON',
        MENU_IMPORT_ERRORS.MALFORMED_JSON,
        '$',
      ),
    );
    return errors;
  }

  const doc = source as RawMenuSource;

  if (!Array.isArray(doc.stores)) {
    errors.push(
      issue(
        'ERROR',
        'MALFORMED_JSON',
        'Expected a "stores" array at the document root',
        '$.stores',
      ),
    );
    return errors;
  }

  if (doc.stores.length === 0) {
    errors.push(
      issue('ERROR', 'EMPTY_SOURCE', MENU_IMPORT_ERRORS.EMPTY_SOURCE, '$.stores'),
    );
    return errors;
  }

  doc.stores.forEach((block, storeIndex) => {
    const path = `$.stores[${storeIndex}]`;

    if (!block || typeof block !== 'object') {
      errors.push(
        issue('ERROR', 'MALFORMED_JSON', 'Store entry is not an object', path),
      );
      return;
    }

    if (!Array.isArray(block.categories)) {
      errors.push(
        issue(
          'ERROR',
          'MALFORMED_JSON',
          'Store entry has no "categories" array',
          `${path}.categories`,
        ),
      );
      return;
    }

    block.categories.forEach((category, categoryIndex) => {
      const categoryPath = `${path}.categories[${categoryIndex}]`;

      if (!category || typeof category !== 'object') {
        errors.push(
          issue(
            'ERROR',
            'MALFORMED_JSON',
            'Category entry is not an object',
            categoryPath,
          ),
        );
        return;
      }

      if (category.items !== undefined && !Array.isArray(category.items)) {
        errors.push(
          issue(
            'ERROR',
            'MALFORMED_JSON',
            'Category "items" is not an array',
            `${categoryPath}.items`,
          ),
        );
      }
    });
  });

  return errors;
}

/** Maps a source food type onto the enum, tolerating case and separators. */
export function parseFoodType(value: unknown): FoodType | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'VEG':
    case 'VEGETARIAN':
      return FoodType.VEG;
    case 'NON_VEG':
    case 'NONVEG':
    case 'NON_VEGETARIAN':
      return FoodType.NON_VEG;
    case 'EGG':
    case 'EGGETARIAN':
      return FoodType.EGG;
    default:
      return null;
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
