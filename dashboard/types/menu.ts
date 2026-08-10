export interface Dish {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  foodType: string;
  spiceLevel: string | null;
  preparationTime: number | null;
  price: number | string;
  discountedPrice: number | string | null;
  status: string;
  isFeatured: boolean;
  isRecommended: boolean;
  isSeasonal: boolean;
  sortOrder: number;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  tags: Array<{
    tag: { id: string; name: string; slug: string };
  }>;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
  brandId: string | null;
  status: string;
  _count?: { items: number };
}
