import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MenuQueryDto } from '../dto/menu-query.dto';

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discountedPrice?: number;
  isVeg: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isSpicy: boolean;
  isChefRecommended: boolean;
  rating: number;
  available: boolean;
  image: string;
  calories?: number;
  allergens?: string[];
  prepTime?: number;
  slug?: string;
  sku?: string;
  tags?: string[];
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreMenu(storeId: string, query: MenuQueryDto): Promise<Dish[]> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    const where: any = { deletedAt: null, status: 'ACTIVE' };

    if (query.category) {
      where.category = { slug: query.category.toLowerCase().replace(/\s+/g, '-') };
    }

    if (query.veg === true) {
      where.foodType = 'VEG';
    } else if (query.nonVeg === true) {
      where.foodType = { in: ['NON_VEG', 'EGG'] };
    }

    if (query.bestseller === true) {
      where.isFeatured = true;
    }

    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    let dishes = items.map((item) => this.toDish(item));

    if (query.search) {
      const q = query.search.toLowerCase();
      dishes = dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      );
    }

    return dishes;
  }

  async getFeaturedDishes(storeId: string): Promise<Dish[]> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    const items = await this.prisma.menuItem.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        OR: [{ isFeatured: true }, { isRecommended: true }],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 12,
    });

    return items.map((item) => this.toDish(item));
  }

  private toDish(item: any): Dish {
    const primaryImage = item.images?.[0];
    const tagNames = (item.tags ?? []).map((t: any) => t.tag?.name).filter(Boolean);
    const isVeg = item.foodType === 'VEG';
    const isBestseller = item.isFeatured || tagNames.some((t: string) => t.toLowerCase() === 'bestseller');
    const isRecommended = item.isRecommended || tagNames.some((t: string) => t.toLowerCase() === 'signature');

    // Use new price columns instead of hardcoded 0
    const price = Number(item.price || 0);
    const discountedPrice = item.discountedPrice ? Number(item.discountedPrice) : undefined;

    return {
      id: item.id,
      name: item.name,
      description: item.description || item.shortDescription || '',
      category: item.category?.name || 'Uncategorized',
      price,
      discountedPrice,
      isVeg,
      isBestseller,
      isNew: item.isSeasonal ?? false,
      isSpicy: (item.spiceLevel && item.spiceLevel !== 'NONE' && item.spiceLevel !== 'LOW'),
      isChefRecommended: isRecommended,
      rating: 4.5,
      available: true,
      image: primaryImage?.url || '/assets/menu/placeholder.webp',
      calories: item.calories ?? undefined,
      prepTime: item.preparationTime ?? undefined,
      slug: item.slug,
      sku: item.sku,
      tags: tagNames,
    };
  }
}
