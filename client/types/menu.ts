export interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
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

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  sortOrder: number;
  status: string;
  _count?: { items: number };
}

export interface MenuQueryParams {
  search?: string;
  veg?: boolean;
  nonVeg?: boolean;
  bestseller?: boolean;
  new?: boolean;
  spicy?: boolean;
  chefRecommended?: boolean;
  available?: boolean;
  offers?: boolean;
  category?: string;
}
