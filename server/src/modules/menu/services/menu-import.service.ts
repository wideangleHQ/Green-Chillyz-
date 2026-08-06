import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import {
  ImportCounts,
  ImportIssue,
  ImportReport,
  NormalizedCategory,
  NormalizedImage,
  NormalizedItem,
  NormalizedMenu,
  NormalizedTag,
} from '../interfaces';
import {
  RawItem,
  RawMenuSource,
  isNonEmptyString,
  issue,
  parseFoodType,
  validateSourceShape,
} from '../validators';
import { checkImageUrl } from '../validators';
import { MENU_IMPORT_ERRORS } from '../constants';
import {
  buildSearchKeywords,
  generateSku,
  isValidSku,
  normalizeSku,
  slugify,
  uniqueSlug,
} from '../utils';

/**
 * Turns the authored menu document into exactly what the master catalogue
 * would store — without writing a row.
 *
 * The source is store-scoped: the same dish appears once per store, carrying
 * that store's price and availability. The master menu is not. So the engine
 * collapses those repetitions by SKU and drops every store-scoped field;
 * price, availability and today's special belong to the Store Menu layer and
 * are deliberately discarded here rather than smuggled into metadata.
 *
 * Nothing in this service touches the database. `dryRun` is not a flag that
 * skips writes — there is no write path at all yet.
 */
@Injectable()
export class MenuImportService {
  private readonly logger = new Logger(MenuImportService.name);

  /** Reads and analyses a JSON file. */
  async analyzeFile(filePath: string): Promise<ImportReport> {
    const started = Date.now();

    let raw: string;
    try {
      raw = await readFile(filePath, 'utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.failedReport(
        [issue('ERROR', 'SOURCE_UNREADABLE', `Cannot read ${filePath}: ${message}`, '$')],
        started,
      );
    }

    return this.analyzeJson(raw, started);
  }

  /** Parses and analyses a JSON string. */
  analyzeJson(rawJson: string, startedAt = Date.now()): ImportReport {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.failedReport(
        [
          issue(
            'ERROR',
            'MALFORMED_JSON',
            `${MENU_IMPORT_ERRORS.MALFORMED_JSON}: ${message}`,
            '$',
          ),
        ],
        startedAt,
      );
    }

    return this.analyze(parsed, startedAt);
  }

  /**
   * The pipeline: shape → normalize → relationships → report.
   *
   * A structural failure short-circuits, because every later stage assumes it
   * can walk the document; content problems accumulate so one run surfaces
   * every fixable issue rather than the first.
   */
  analyze(source: unknown, startedAt = Date.now()): ImportReport {
    const shapeErrors = validateSourceShape(source);
    if (shapeErrors.length > 0) {
      return this.failedReport(shapeErrors, startedAt);
    }

    const doc = source as RawMenuSource;
    const errors: ImportIssue[] = [];
    const warnings: ImportIssue[] = [];

    const categoriesBySlug = new Map<string, NormalizedCategory>();
    const itemsBySku = new Map<string, NormalizedItem>();
    const tagsBySlug = new Map<string, NormalizedTag>();

    const categorySlugsTaken = new Set<string>();
    const itemSlugsTaken = new Set<string>();
    const skusTaken = new Set<string>();
    // Guards the case where two different dishes normalise to one slug.
    const slugOwner = new Map<string, string>();

    const counts: ImportCounts = {
      storesScanned: 0,
      categories: 0,
      items: 0,
      images: 0,
      tags: 0,
      duplicateItemRows: 0,
      skipped: 0,
    };

    for (const [storeIndex, block] of (doc.stores ?? []).entries()) {
      counts.storesScanned += 1;
      const storePath = `$.stores[${storeIndex}]`;
      const brandName = block.store?.brand ?? null;
      const storeCode = block.store?.code ?? `store-${storeIndex}`;

      for (const [categoryIndex, category] of (block.categories ?? []).entries()) {
        const categoryPath = `${storePath}.categories[${categoryIndex}]`;

        if (!isNonEmptyString(category.name)) {
          errors.push(
            issue(
              'ERROR',
              'MISSING_FIELD',
              `${MENU_IMPORT_ERRORS.MISSING_FIELD}: category name`,
              `${categoryPath}.name`,
            ),
          );
          counts.skipped += 1;
          continue;
        }

        const categorySlug = this.resolveCategorySlug(
          category.name,
          categoriesBySlug,
          categorySlugsTaken,
        );

        let normalizedCategory = categoriesBySlug.get(categorySlug);
        if (!normalizedCategory) {
          normalizedCategory = {
            sourceId: category.id ?? categorySlug,
            name: category.name.trim(),
            slug: categorySlug,
            sortOrder: category.displayOrder ?? 0,
            brandName,
            itemCount: 0,
          };
          categoriesBySlug.set(categorySlug, normalizedCategory);
        }

        for (const [itemIndex, item] of (category.items ?? []).entries()) {
          const itemPath = `${categoryPath}.items[${itemIndex}]`;

          const outcome = this.normalizeItem({
            item,
            itemPath,
            categorySlug,
            categoryName: normalizedCategory.name,
            brandName,
            storeCode,
            itemsBySku,
            tagsBySlug,
            itemSlugsTaken,
            skusTaken,
            slugOwner,
            errors,
            warnings,
            counts,
          });

          if (outcome === 'SKIPPED') counts.skipped += 1;
          // Only a first sighting grows the category; the same dish repeated
          // across stores must not inflate the count.
          if (outcome === 'ADDED') normalizedCategory.itemCount += 1;
        }
      }
    }

    // Relationship pass: every item must point at a category the run produced.
    for (const item of itemsBySku.values()) {
      if (!categoriesBySlug.has(item.categorySlug)) {
        errors.push(
          issue(
            'ERROR',
            'BROKEN_RELATIONSHIP',
            `${MENU_IMPORT_ERRORS.BROKEN_RELATIONSHIP}: "${item.categorySlug}"`,
            `item:${item.sku}`,
            item.categorySlug,
          ),
        );
      }
    }

    for (const category of categoriesBySlug.values()) {
      if (category.itemCount === 0) {
        warnings.push(
          issue(
            'WARNING',
            'EMPTY_CATEGORY',
            `Category "${category.name}" has no items`,
            `category:${category.slug}`,
          ),
        );
      }
    }

    counts.categories = categoriesBySlug.size;
    counts.items = itemsBySku.size;
    counts.tags = tagsBySlug.size;
    counts.images = [...itemsBySku.values()].reduce(
      (total, item) => total + item.images.length,
      0,
    );

    const readyToImport = errors.length === 0;
    const normalized: NormalizedMenu = {
      categories: [...categoriesBySlug.values()].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
      items: [...itemsBySku.values()].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
      tags: [...tagsBySlug.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };

    this.logger.log(
      `Menu dry run: ${counts.items} item(s), ${counts.categories} category(ies), ${counts.tags} tag(s), ${errors.length} error(s), ${warnings.length} warning(s)`,
    );

    return {
      dryRun: true,
      readyToImport,
      counts,
      errors,
      warnings,
      // Withheld on failure: a half-valid catalogue must not look importable.
      normalized: readyToImport ? normalized : undefined,
      durationMs: Date.now() - startedAt,
    };
  }

  private normalizeItem(ctx: {
    item: RawItem;
    itemPath: string;
    categorySlug: string;
    categoryName: string;
    brandName: string | null;
    storeCode: string;
    itemsBySku: Map<string, NormalizedItem>;
    tagsBySlug: Map<string, NormalizedTag>;
    itemSlugsTaken: Set<string>;
    skusTaken: Set<string>;
    slugOwner: Map<string, string>;
    errors: ImportIssue[];
    warnings: ImportIssue[];
    counts: ImportCounts;
  }): 'ADDED' | 'MERGED' | 'SKIPPED' {
    const { item, itemPath, errors, warnings, counts } = ctx;

    if (!isNonEmptyString(item.name)) {
      errors.push(
        issue(
          'ERROR',
          'MISSING_FIELD',
          `${MENU_IMPORT_ERRORS.MISSING_FIELD}: item name`,
          `${itemPath}.name`,
        ),
      );
      return 'SKIPPED';
    }

    const name = item.name.trim();

    const foodType = parseFoodType(item.foodType);
    if (!foodType) {
      errors.push(
        issue(
          'ERROR',
          'INVALID_FOOD_TYPE',
          `${MENU_IMPORT_ERRORS.INVALID_FOOD_TYPE}: "${String(item.foodType)}"`,
          `${itemPath}.foodType`,
          String(item.foodType ?? ''),
        ),
      );
      return 'SKIPPED';
    }

    // A SKU present in the source is authoritative and never regenerated.
    let sku: string;
    if (isNonEmptyString(item.sku)) {
      sku = normalizeSku(item.sku);
      if (!isValidSku(sku)) {
        warnings.push(
          issue(
            'WARNING',
            'SKU_FORMAT',
            `SKU "${sku}" does not match the GC-BIR-001 convention; keeping it as authored`,
            `${itemPath}.sku`,
            sku,
          ),
        );
      }
      ctx.skusTaken.add(sku);
    } else {
      sku = generateSku(
        ctx.brandName ?? 'GC',
        ctx.categoryName,
        ctx.skusTaken,
      );
      warnings.push(
        issue(
          'WARNING',
          'SKU_GENERATED',
          `Item "${name}" had no SKU; generated ${sku}`,
          `${itemPath}.sku`,
          sku,
        ),
      );
    }

    const existing = ctx.itemsBySku.get(sku);
    if (existing) {
      // The same dish, seen again in another store. Expected — merge its
      // provenance and tags rather than reporting a duplicate.
      counts.duplicateItemRows += 1;

      if (existing.name !== name) {
        warnings.push(
          issue(
            'WARNING',
            'SKU_NAME_CONFLICT',
            `SKU ${sku} appears as both "${existing.name}" and "${name}"; keeping the first`,
            `${itemPath}.name`,
            name,
          ),
        );
      }

      if (existing.categorySlug !== ctx.categorySlug) {
        warnings.push(
          issue(
            'WARNING',
            'SKU_CATEGORY_CONFLICT',
            `SKU ${sku} appears in both "${existing.categorySlug}" and "${ctx.categorySlug}"; keeping the first`,
            `${itemPath}`,
            ctx.categorySlug,
          ),
        );
      }

      if (!existing.sourceStoreCodes.includes(ctx.storeCode)) {
        existing.sourceStoreCodes.push(ctx.storeCode);
      }

      for (const tagSlug of this.collectTags(item, ctx.tagsBySlug, itemPath, errors)) {
        if (!existing.tagSlugs.includes(tagSlug)) existing.tagSlugs.push(tagSlug);
      }

      return 'MERGED';
    }

    const slug = uniqueSlug(name, ctx.itemSlugsTaken);
    const claimedBy = ctx.slugOwner.get(slug);
    if (claimedBy && claimedBy !== sku) {
      errors.push(
        issue(
          'ERROR',
          'DUPLICATE_SLUG',
          `${MENU_IMPORT_ERRORS.DUPLICATE_SLUG}: "${slug}" wanted by ${claimedBy} and ${sku}`,
          `${itemPath}.name`,
          slug,
        ),
      );
    }
    ctx.slugOwner.set(slug, sku);

    const tagSlugs = this.collectTags(item, ctx.tagsBySlug, itemPath, errors);
    const images = this.collectImages(item, itemPath, errors, warnings);

    const normalized: NormalizedItem = {
      sku,
      name,
      slug,
      description: isNonEmptyString(item.description) ? item.description.trim() : null,
      shortDescription: this.deriveShortDescription(item.description),
      foodType,
      categorySlug: ctx.categorySlug,
      brandName: ctx.brandName,
      tagSlugs,
      images,
      searchKeywords: buildSearchKeywords({
        name,
        categoryName: ctx.categoryName,
        tagNames: tagSlugs,
        shortDescription: this.deriveShortDescription(item.description),
      }),
      sortOrder: item.displayOrder ?? 0,
      sourceStoreCodes: [ctx.storeCode],
    };

    ctx.itemsBySku.set(sku, normalized);

    return 'ADDED';
  }

  private collectTags(
    item: RawItem,
    tagsBySlug: Map<string, NormalizedTag>,
    itemPath: string,
    errors: ImportIssue[],
  ): string[] {
    const slugs: string[] = [];

    for (const [tagIndex, rawTag] of (item.tags ?? []).entries()) {
      if (!isNonEmptyString(rawTag)) {
        errors.push(
          issue(
            'ERROR',
            'INVALID_TAG',
            MENU_IMPORT_ERRORS.INVALID_TAG,
            `${itemPath}.tags[${tagIndex}]`,
            String(rawTag ?? ''),
          ),
        );
        continue;
      }

      const name = rawTag.trim();
      const slug = slugify(name);

      if (slug.length === 0) {
        errors.push(
          issue(
            'ERROR',
            'INVALID_TAG',
            `${MENU_IMPORT_ERRORS.INVALID_TAG}: "${name}"`,
            `${itemPath}.tags[${tagIndex}]`,
            name,
          ),
        );
        continue;
      }

      if (!tagsBySlug.has(slug)) {
        tagsBySlug.set(slug, { name, slug });
      }
      if (!slugs.includes(slug)) slugs.push(slug);
    }

    return slugs;
  }

  private collectImages(
    item: RawItem,
    itemPath: string,
    errors: ImportIssue[],
    warnings: ImportIssue[],
  ): NormalizedImage[] {
    const images: NormalizedImage[] = [];

    for (const [imageIndex, rawImage] of (item.images ?? []).entries()) {
      const imagePath = `${itemPath}.images[${imageIndex}]`;
      const check = checkImageUrl(rawImage?.url);

      if (!check.valid) {
        errors.push(
          issue(
            'ERROR',
            'INVALID_IMAGE_URL',
            `${MENU_IMPORT_ERRORS.INVALID_IMAGE_URL}: ${check.reason}`,
            `${imagePath}.url`,
            typeof rawImage?.url === 'string' ? rawImage.url : null,
          ),
        );
        continue;
      }

      const thumbnail = rawImage?.thumbnail;
      const thumbnailValid = thumbnail === undefined || checkImageUrl(thumbnail).valid;
      if (!thumbnailValid) {
        warnings.push(
          issue(
            'WARNING',
            'INVALID_THUMBNAIL_URL',
            'Thumbnail URL is not absolute; it will be dropped',
            `${imagePath}.thumbnail`,
            String(thumbnail),
          ),
        );
      }

      images.push({
        url: (rawImage.url as string).trim(),
        thumbnailUrl: thumbnailValid && thumbnail ? thumbnail.trim() : null,
        altText: isNonEmptyString(rawImage.altText) ? rawImage.altText.trim() : null,
        isPrimary: rawImage.isPrimary === true,
        displayOrder: imageIndex,
      });
    }

    if (images.length > 0 && !images.some((image) => image.isPrimary)) {
      // Recoverable: the first image is the obvious default, so this is a
      // warning and the run stays importable.
      images[0].isPrimary = true;
      warnings.push(
        issue(
          'WARNING',
          'NO_PRIMARY_IMAGE',
          `${MENU_IMPORT_ERRORS.NO_PRIMARY_IMAGE}; defaulted to the first`,
          `${itemPath}.images`,
        ),
      );
    }

    if (images.filter((image) => image.isPrimary).length > 1) {
      let seenPrimary = false;
      for (const image of images) {
        if (image.isPrimary && seenPrimary) image.isPrimary = false;
        else if (image.isPrimary) seenPrimary = true;
      }
      warnings.push(
        issue(
          'WARNING',
          'MULTIPLE_PRIMARY_IMAGES',
          'More than one image marked primary; kept the first',
          `${itemPath}.images`,
        ),
      );
    }

    return images;
  }

  /** First sentence, clipped — enough for a card without authoring a second field. */
  private deriveShortDescription(description?: string): string | null {
    if (!isNonEmptyString(description)) return null;

    const text = description.trim();
    const sentenceEnd = text.indexOf('. ');
    const candidate = sentenceEnd > 0 ? text.slice(0, sentenceEnd + 1) : text;

    return candidate.length > 300 ? `${candidate.slice(0, 297)}...` : candidate;
  }

  private resolveCategorySlug(
    name: string,
    categoriesBySlug: Map<string, NormalizedCategory>,
    taken: Set<string>,
  ): string {
    const base = slugify(name);

    // Same category name across stores is the same master category — reuse it
    // rather than minting `soups-2`, `soups-3` for every store in the file.
    if (categoriesBySlug.has(base)) return base;

    return uniqueSlug(name, taken);
  }

  private failedReport(errors: ImportIssue[], startedAt: number): ImportReport {
    return {
      dryRun: true,
      readyToImport: false,
      counts: {
        storesScanned: 0,
        categories: 0,
        items: 0,
        images: 0,
        tags: 0,
        duplicateItemRows: 0,
        skipped: 0,
      },
      errors,
      warnings: [],
      durationMs: Date.now() - startedAt,
    };
  }
}
