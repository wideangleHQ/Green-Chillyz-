import { beforeEach, describe, expect, it } from 'vitest';
import { FoodType } from '@prisma/client';
import { MenuImportService } from '../services';

const image = (url = 'https://cdn.example.com/a.jpg', isPrimary = true) => ({
  url,
  thumbnail: 'https://cdn.example.com/a-thumb.jpg',
  isPrimary,
});

const item = (overrides: Record<string, unknown> = {}) => ({
  id: 'i1',
  sku: 'GC-BIR-001',
  name: 'Chicken Kebab Biryani',
  description: 'Slow-cooked. Served with raita.',
  foodType: 'NON_VEG',
  price: 320,
  available: true,
  todaySpecial: false,
  displayOrder: 1,
  tags: ['Popular'],
  images: [image()],
  ...overrides,
});

const source = (overrides: Record<string, unknown> = {}) => ({
  version: '1.0',
  stores: [
    {
      store: { id: 's1', code: 'GC-CTK', name: 'Cuttack', brand: 'GreenChillyz' },
      categories: [
        { id: 'c1', name: 'Biryani', displayOrder: 1, items: [item()] },
      ],
    },
  ],
  ...overrides,
});

describe('MenuImportService', () => {
  let service: MenuImportService;

  beforeEach(() => {
    service = new MenuImportService();
  });

  describe('dry run contract', () => {
    it('should always report itself as a dry run', () => {
      expect(service.analyze(source()).dryRun).toBe(true);
    });

    it('should mark a clean document ready to import', () => {
      const report = service.analyze(source());

      expect(report.readyToImport).toBe(true);
      expect(report.errors).toHaveLength(0);
    });

    it('should return the normalized payload only when clean', () => {
      expect(service.analyze(source()).normalized).toBeDefined();
    });

    it('should withhold the payload when validation failed', () => {
      const bad = source({
        stores: [
          {
            store: { code: 'A', brand: 'GreenChillyz' },
            categories: [{ name: 'Biryani', items: [item({ foodType: 'MEAT' })] }],
          },
        ],
      });

      const report = service.analyze(bad);

      expect(report.readyToImport).toBe(false);
      expect(report.normalized).toBeUndefined();
    });

    it('should report a duration', () => {
      expect(service.analyze(source()).durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('malformed input', () => {
    it('should report invalid JSON rather than throwing', () => {
      const report = service.analyzeJson('{ not json');

      expect(report.readyToImport).toBe(false);
      expect(report.errors[0].code).toBe('MALFORMED_JSON');
    });

    it('should parse a valid JSON string', () => {
      expect(service.analyzeJson(JSON.stringify(source())).readyToImport).toBe(true);
    });

    it('should report an unreadable file rather than throwing', async () => {
      const report = await service.analyzeFile('/definitely/not/here.json');

      expect(report.readyToImport).toBe(false);
      expect(report.errors[0].code).toBe('SOURCE_UNREADABLE');
    });
  });

  describe('normalization', () => {
    it('should generate a slug from the name', () => {
      const report = service.analyze(source());

      expect(report.normalized?.items[0].slug).toBe('chicken-kebab-biryani');
    });

    it('should keep the authored SKU untouched', () => {
      const report = service.analyze(source());

      expect(report.normalized?.items[0].sku).toBe('GC-BIR-001');
    });

    it('should map the food type onto the enum', () => {
      const report = service.analyze(source());

      expect(report.normalized?.items[0].foodType).toBe(FoodType.NON_VEG);
    });

    it('should derive a short description from the first sentence', () => {
      const report = service.analyze(source());

      expect(report.normalized?.items[0].shortDescription).toBe('Slow-cooked.');
    });

    it('should build search keywords covering name and category', () => {
      const keywords = service.analyze(source()).normalized?.items[0].searchKeywords ?? [];

      expect(keywords).toContain('chicken');
      expect(keywords).toContain('biryani');
    });

    it('should collect tags as slugs', () => {
      const report = service.analyze(source());

      expect(report.normalized?.items[0].tagSlugs).toEqual(['popular']);
      expect(report.normalized?.tags[0]).toEqual({ name: 'Popular', slug: 'popular' });
    });
  });

  describe('store-scoped fields', () => {
    it('should never carry price, availability or today special into the master item', () => {
      const normalized = service.analyze(source()).normalized?.items[0] ?? {};
      const keys = Object.keys(normalized);

      expect(keys).not.toContain('price');
      expect(keys).not.toContain('available');
      expect(keys).not.toContain('todaySpecial');
    });

    it('should keep store codes only as import provenance', () => {
      const report = service.analyze(source());

      expect(report.normalized?.items[0].sourceStoreCodes).toEqual(['GC-CTK']);
    });
  });

  describe('cross-store deduplication', () => {
    const twoStores = () => ({
      stores: [
        {
          store: { code: 'GC-CTK', brand: 'GreenChillyz' },
          categories: [{ name: 'Biryani', items: [item()] }],
        },
        {
          store: { code: 'GC-BBS', brand: 'GreenChillyz' },
          categories: [{ name: 'Biryani', items: [item({ price: 340 })] }],
        },
      ],
    });

    it('should collapse the same SKU across stores into one master item', () => {
      const report = service.analyze(twoStores());

      expect(report.counts.items).toBe(1);
      expect(report.counts.duplicateItemRows).toBe(1);
    });

    it('should record every store the dish came from', () => {
      const report = service.analyze(twoStores());

      expect(report.normalized?.items[0].sourceStoreCodes).toEqual([
        'GC-CTK',
        'GC-BBS',
      ]);
    });

    it('should reuse one category across stores rather than suffixing', () => {
      const report = service.analyze(twoStores());

      expect(report.counts.categories).toBe(1);
      expect(report.normalized?.categories[0].slug).toBe('biryani');
    });

    it('should count the item once against its category', () => {
      const report = service.analyze(twoStores());

      expect(report.normalized?.categories[0].itemCount).toBe(1);
    });

    it('should merge tags seen on different stores', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GreenChillyz' },
            categories: [{ name: 'Biryani', items: [item({ tags: ['Popular'] })] }],
          },
          {
            store: { code: 'B', brand: 'GreenChillyz' },
            categories: [{ name: 'Biryani', items: [item({ tags: ['Signature'] })] }],
          },
        ],
      });

      expect(report.normalized?.items[0].tagSlugs.sort()).toEqual([
        'popular',
        'signature',
      ]);
    });

    it('should warn when one SKU carries two different names', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GreenChillyz' },
            categories: [{ name: 'Biryani', items: [item()] }],
          },
          {
            store: { code: 'B', brand: 'GreenChillyz' },
            categories: [
              { name: 'Biryani', items: [item({ name: 'Chicken Biryani Deluxe' })] },
            ],
          },
        ],
      });

      expect(report.warnings.some((w) => w.code === 'SKU_NAME_CONFLICT')).toBe(true);
      expect(report.readyToImport).toBe(true);
    });
  });

  describe('missing SKUs', () => {
    it('should generate one and warn', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [{ name: 'Biryani', items: [item({ sku: undefined })] }],
          },
        ],
      });

      expect(report.normalized?.items[0].sku).toBe('GC-BRY-001');
      expect(report.warnings.some((w) => w.code === 'SKU_GENERATED')).toBe(true);
    });

    it('should still be importable', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [{ name: 'Biryani', items: [item({ sku: undefined })] }],
          },
        ],
      });

      expect(report.readyToImport).toBe(true);
    });

    it('should warn but keep a SKU that breaks convention', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [{ name: 'Biryani', items: [item({ sku: 'weird_sku' })] }],
          },
        ],
      });

      expect(report.normalized?.items[0].sku).toBe('WEIRD_SKU');
      expect(report.warnings.some((w) => w.code === 'SKU_FORMAT')).toBe(true);
    });
  });

  describe('validation errors', () => {
    const analyzeItem = (overrides: Record<string, unknown>) =>
      service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [{ name: 'Biryani', items: [item(overrides)] }],
          },
        ],
      });

    it('should reject a missing item name', () => {
      const report = analyzeItem({ name: undefined });

      expect(report.errors.some((e) => e.code === 'MISSING_FIELD')).toBe(true);
      expect(report.counts.skipped).toBe(1);
    });

    it('should reject an unknown food type', () => {
      expect(
        analyzeItem({ foodType: 'MEAT' }).errors.some(
          (e) => e.code === 'INVALID_FOOD_TYPE',
        ),
      ).toBe(true);
    });

    it('should reject a relative image URL', () => {
      const report = analyzeItem({ images: [{ url: '/local/a.jpg', isPrimary: true }] });

      expect(report.errors.some((e) => e.code === 'INVALID_IMAGE_URL')).toBe(true);
    });

    it('should reject an empty tag', () => {
      expect(
        analyzeItem({ tags: ['', 'Popular'] }).errors.some(
          (e) => e.code === 'INVALID_TAG',
        ),
      ).toBe(true);
    });

    it('should reject a category with no name', () => {
      const report = service.analyze({
        stores: [
          { store: { code: 'A' }, categories: [{ name: undefined, items: [item()] }] },
        ],
      });

      expect(report.errors.some((e) => e.code === 'MISSING_FIELD')).toBe(true);
    });

    it('should point at the exact source path', () => {
      const report = analyzeItem({ foodType: 'MEAT' });

      expect(report.errors[0].path).toBe(
        '$.stores[0].categories[0].items[0].foodType',
      );
    });

    it('should accumulate every problem rather than stopping at the first', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [
              {
                name: 'Biryani',
                items: [
                  item({ sku: 'GC-BIR-001', foodType: 'MEAT' }),
                  item({ sku: 'GC-BIR-002', name: undefined }),
                ],
              },
            ],
          },
        ],
      });

      expect(report.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('images', () => {
    const analyzeImages = (images: unknown[]) =>
      service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [{ name: 'Biryani', items: [item({ images })] }],
          },
        ],
      });

    it('should default the first image to primary when none is marked', () => {
      const report = analyzeImages([
        { url: 'https://cdn.example.com/a.jpg', isPrimary: false },
        { url: 'https://cdn.example.com/b.jpg', isPrimary: false },
      ]);

      expect(report.normalized?.items[0].images[0].isPrimary).toBe(true);
      expect(report.warnings.some((w) => w.code === 'NO_PRIMARY_IMAGE')).toBe(true);
      expect(report.readyToImport).toBe(true);
    });

    it('should keep only the first of several primaries', () => {
      const report = analyzeImages([
        { url: 'https://cdn.example.com/a.jpg', isPrimary: true },
        { url: 'https://cdn.example.com/b.jpg', isPrimary: true },
      ]);

      const primaries = report.normalized?.items[0].images.filter((i) => i.isPrimary);

      expect(primaries).toHaveLength(1);
      expect(report.warnings.some((w) => w.code === 'MULTIPLE_PRIMARY_IMAGES')).toBe(true);
    });

    it('should preserve display order', () => {
      const report = analyzeImages([
        { url: 'https://cdn.example.com/a.jpg', isPrimary: true },
        { url: 'https://cdn.example.com/b.jpg' },
      ]);

      expect(report.normalized?.items[0].images.map((i) => i.displayOrder)).toEqual([
        0, 1,
      ]);
    });

    it('should drop a relative thumbnail with a warning but keep the image', () => {
      const report = analyzeImages([
        { url: 'https://cdn.example.com/a.jpg', thumbnail: '/rel.jpg', isPrimary: true },
      ]);

      expect(report.normalized?.items[0].images[0].thumbnailUrl).toBeNull();
      expect(report.warnings.some((w) => w.code === 'INVALID_THUMBNAIL_URL')).toBe(true);
    });

    it('should count images across the catalogue', () => {
      expect(analyzeImages([{ url: 'https://cdn.example.com/a.jpg', isPrimary: true }])
        .counts.images).toBe(1);
    });
  });

  describe('report counts', () => {
    it('should count stores, categories, items and tags', () => {
      const report = service.analyze(source());

      expect(report.counts.storesScanned).toBe(1);
      expect(report.counts.categories).toBe(1);
      expect(report.counts.items).toBe(1);
      expect(report.counts.tags).toBe(1);
    });

    it('should warn about a category with no items', () => {
      const report = service.analyze({
        stores: [{ store: { code: 'A' }, categories: [{ name: 'Empty', items: [] }] }],
      });

      expect(report.warnings.some((w) => w.code === 'EMPTY_CATEGORY')).toBe(true);
    });

    it('should sort categories by sort order then name', () => {
      const report = service.analyze({
        stores: [
          {
            store: { code: 'A', brand: 'GC' },
            categories: [
              { name: 'Zebra', displayOrder: 2, items: [item({ sku: 'GC-ZBR-001' })] },
              { name: 'Alpha', displayOrder: 1, items: [item({ sku: 'GC-ALP-001' })] },
            ],
          },
        ],
      });

      expect(report.normalized?.categories.map((c) => c.name)).toEqual([
        'Alpha',
        'Zebra',
      ]);
    });
  });
});
