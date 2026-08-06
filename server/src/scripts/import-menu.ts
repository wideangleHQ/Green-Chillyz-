import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const PLACEHOLDER_IMAGE = '/assets/menu/placeholder.webp';
const PLACEHOLDER_THUMB = '/assets/menu/placeholder-thumb.webp';

interface RawItem {
  sku?: string;
  name: string;
  description?: string;
  short_description?: string;
  food_type?: string;
  images?: Array<{ url: string; thumbnail_url?: string; alt_text?: string; is_primary?: boolean }>;
  tags?: string[];
}

interface RawCategory {
  name: string;
  items: RawItem[];
}

interface RawStore {
  store_code: string;
  store_name: string;
  categories: RawCategory[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFoodType(raw?: string): 'VEG' | 'NON_VEG' | 'EGG' {
  if (!raw) return 'VEG';
  const upper = raw.toUpperCase().replace(/[^A-Z_]/g, '');
  if (upper === 'NON_VEG' || upper === 'NONVEG') return 'NON_VEG';
  if (upper === 'EGG') return 'EGG';
  return 'VEG';
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const filePath = join(process.cwd(), 'src', 'menu.json');
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    const stores: RawStore[] = raw.stores ?? raw;

    console.log(`Found ${stores.length} stores`);

    const categoryMap = new Map<string, { name: string; sortOrder: number }>();
    const itemMap = new Map<string, {
      name: string;
      description: string | null;
      shortDescription: string | null;
      foodType: 'VEG' | 'NON_VEG' | 'EGG';
      categorySlug: string;
      images: Array<{ url: string; thumbnailUrl?: string; altText?: string; isPrimary?: boolean }>;
      tags: string[];
      sku: string;
      slug: string;
    }>();
    const allTags = new Set<string>();
    let catOrder = 0;
    let itemOrder = 0;

    for (const store of stores) {
      for (const cat of store.categories) {
        const catSlug = slugify(cat.name);
        if (!categoryMap.has(catSlug)) {
          categoryMap.set(catSlug, { name: cat.name, sortOrder: catOrder++ });
        }

        for (const item of cat.items) {
          const sku = item.sku ?? `GC-${catSlug.substring(0, 3).toUpperCase()}-${String(itemOrder + 1).padStart(3, '0')}`;
          const itemKey = sku;

          if (itemMap.has(itemKey)) continue;

          const images = (item.images ?? []).map((img, i) => ({
            url: img.url,
            thumbnailUrl: img.thumbnail_url,
            altText: img.alt_text ?? item.name,
            isPrimary: img.is_primary ?? i === 0,
          }));

          const tags = (item.tags ?? []).filter((t) => t && t.trim());
          tags.forEach((t) => allTags.add(t.trim().toLowerCase()));

          itemMap.set(itemKey, {
            name: item.name,
            description: item.description ?? null,
            shortDescription: item.short_description ?? null,
            foodType: parseFoodType(item.food_type),
            categorySlug: catSlug,
            images,
            tags: tags.map((t) => t.trim().toLowerCase()),
            sku,
            slug: slugify(item.name),
          });

          itemOrder++;
        }
      }
    }

    console.log(`Normalized: ${categoryMap.size} categories, ${itemMap.size} items, ${allTags.size} tags`);

    await prisma.$transaction(async (tx) => {
      // 1. Create tags
      const tagIdMap = new Map<string, string>();
      for (const tagName of allTags) {
        const slug = slugify(tagName);
        const existing = await tx.menuTag.findUnique({ where: { slug } });
        if (existing) {
          tagIdMap.set(tagName, existing.id);
        } else {
          const created = await tx.menuTag.create({
            data: { name: tagName, slug, status: 'ACTIVE' },
          });
          tagIdMap.set(tagName, created.id);
        }
      }
      console.log(`Tags: ${tagIdMap.size} created/found`);

      // 2. Create categories
      const categoryIdMap = new Map<string, string>();
      for (const [slug, cat] of categoryMap) {
        const existing = await tx.menuCategory.findFirst({
          where: { slug, deletedAt: null },
        });
        if (existing) {
          categoryIdMap.set(slug, existing.id);
        } else {
          const created = await tx.menuCategory.create({
            data: { name: cat.name, slug, sortOrder: cat.sortOrder, status: 'ACTIVE' },
          });
          categoryIdMap.set(slug, created.id);
        }
      }
      console.log(`Categories: ${categoryIdMap.size} created/found`);

      // 3. Create items with images and tags
      let createdItems = 0;
      let skippedItems = 0;

      // Handle slug collisions
      const usedSlugs = new Set<string>();

      for (const [sku, item] of itemMap) {
        const existing = await tx.menuItem.findUnique({ where: { sku } });
        if (existing) {
          skippedItems++;
          continue;
        }

        let slug = item.slug;
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${Date.now()}-${createdItems}`;
        }
        usedSlugs.add(slug);

        const existingSlug = await tx.menuItem.findUnique({ where: { slug } });
        if (existingSlug) {
          slug = `${slug}-${Date.now()}`;
        }

        const categoryId = categoryIdMap.get(item.categorySlug) ?? null;

        const searchKeywords = [
          ...item.name.toLowerCase().split(/\s+/),
          ...item.tags,
          item.categorySlug,
        ].filter(Boolean);

        const created = await tx.menuItem.create({
          data: {
            sku,
            name: item.name,
            slug,
            shortDescription: item.shortDescription,
            description: item.description,
            foodType: item.foodType,
            categoryId,
            sortOrder: createdItems,
            searchKeywords,
            status: 'ACTIVE',
          },
        });

        // Images
        if (item.images.length > 0) {
          for (let i = 0; i < item.images.length; i++) {
            const img = item.images[i];
            await tx.menuItemImage.create({
              data: {
                menuItemId: created.id,
                url: img.url,
                thumbnailUrl: img.thumbnailUrl ?? null,
                altText: img.altText ?? item.name,
                isPrimary: img.isPrimary ?? false,
                displayOrder: i,
              },
            });
          }
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
        for (const tagName of item.tags) {
          const tagId = tagIdMap.get(tagName);
          if (tagId) {
            try {
              await tx.menuItemTag.create({
                data: { menuItemId: created.id, tagId },
              });
            } catch {
              // duplicate — skip
            }
          }
        }

        createdItems++;
      }

      console.log(`Items: ${createdItems} created, ${skippedItems} skipped (already exist)`);
    }, { timeout: 120000 });

    // Verify counts
    const [catCount, itemCount, imgCount, tagCount] = await Promise.all([
      prisma.menuCategory.count(),
      prisma.menuItem.count(),
      prisma.menuItemImage.count(),
      prisma.menuTag.count(),
    ]);

    console.log('\n=== Database Counts ===');
    console.log(`Categories: ${catCount}`);
    console.log(`Items: ${itemCount}`);
    console.log(`Images: ${imgCount}`);
    console.log(`Tags: ${tagCount}`);
    console.log('\nImport complete!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
