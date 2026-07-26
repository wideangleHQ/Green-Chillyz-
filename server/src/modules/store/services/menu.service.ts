import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MenuQueryDto } from '../dto/menu-query.dto';

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
}

const BRAND_DISHES: Record<string, Omit<Dish, 'id'>[]> = {
  // GreenChillyz dishes (primarily vegetarian, Hakka, starters)
  greenchillyz: [
    {
      name: 'Paneer Chilly Dry',
      description: 'Crispy paneer cubes tossed in a glossy, dark soy-based sauce with fresh green chillies and capsicum.',
      category: 'Starters',
      price: 210,
      isVeg: true,
      isBestseller: true,
      isNew: false,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.5,
      available: true,
      image: '/assets/food/paneer_chilly_dry.png',
      calories: 320,
      allergens: ['Dairy', 'Gluten', 'Soy'],
      prepTime: 12,
    },
    {
      name: 'Special Veg Biryani',
      description: 'Fragrant premium basmati rice layered with slow-cooked spiced vegetables, saffron, and fresh herbs.',
      category: 'Rice',
      price: 250,
      isVeg: true,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: true,
      rating: 4.7,
      available: true,
      image: '/assets/food/veg_manchurian.png', // Fallback images
      calories: 450,
      allergens: ['Dairy'],
      prepTime: 20,
    },
    {
      name: 'Veg Manchurian Dry',
      description: 'Crispy fried mixed vegetable balls tossed in a tangy, spicy, and slightly sweet Manchurian sauce.',
      category: 'Starters',
      price: 180,
      isVeg: true,
      isBestseller: false,
      isNew: true,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.3,
      available: true,
      image: '/assets/food/veg_manchurian.png',
      calories: 280,
      allergens: ['Gluten', 'Soy'],
      prepTime: 10,
    },
    {
      name: 'Schezwan Hakka Noodles',
      description: 'Fiery wok-tossed Hakka noodles coated in our signature in-house spicy Schezwan chili paste.',
      category: 'Noodles',
      price: 200,
      isVeg: true,
      isBestseller: true,
      isNew: false,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.4,
      available: true,
      image: '/assets/food/schezwan_noodles.png',
      calories: 380,
      allergens: ['Gluten', 'Soy'],
      prepTime: 10,
    },
    {
      name: 'Double Cheese Margherita Pizza',
      description: 'Classic single-base artisanal pizza with rich tangy Italian tomato sauce and double-loaded mozzarella cheese.',
      category: 'Pizza',
      price: 290,
      isVeg: true,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.6,
      available: true,
      image: '/assets/food/paneer_chilly_dry.png',
      calories: 620,
      allergens: ['Dairy', 'Gluten'],
      prepTime: 15,
    },
    {
      name: 'Hot Gulab Jamun (2 Pcs)',
      description: 'Soft, golden, cardamom-scented khoya dumplings deep-fried and soaked in warm rosewater sugar syrup.',
      category: 'Desserts',
      price: 80,
      isVeg: true,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.8,
      available: true,
      image: '/assets/food/veg_manchurian.png',
      calories: 220,
      allergens: ['Dairy', 'Gluten'],
      prepTime: 5,
    },
    {
      name: 'Premium Masala Chai',
      description: 'Aromatic tea freshly brewed with whole milk, ginger, green cardamom, cloves, and premium Assam tea leaves.',
      category: 'Beverages',
      price: 40,
      isVeg: true,
      isBestseller: true,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.9,
      available: true,
      image: '/assets/food/schezwan_noodles.png',
      calories: 80,
      allergens: ['Dairy'],
      prepTime: 8,
    },
  ],
  // YellowChillyz dishes (Biryanis, rich Mughlai and Tandoori)
  yellowchillyz: [
    {
      name: 'Chicken Tikka Kebab',
      description: 'Juicy chicken breast pieces marinated in spiced yogurt and grilled to smoky perfection in our traditional clay tandoor.',
      category: 'Starters',
      price: 240,
      isVeg: false,
      isBestseller: true,
      isNew: false,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.6,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 290,
      allergens: ['Dairy'],
      prepTime: 15,
    },
    {
      name: 'Butter Chicken Masala',
      description: 'Tandoori grilled chicken chunks simmered in a velvety, buttery tomato gravy spiced with aromatic fenugreek leaves.',
      category: 'Meals',
      price: 320,
      isVeg: false,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: true,
      rating: 4.8,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 540,
      allergens: ['Dairy', 'Nuts'],
      prepTime: 18,
    },
    {
      name: 'Fish Amritsari Fry',
      description: 'Flaky fresh-water fish chunks marinated in ajwain (carom seeds) and deep fried in crisp gram flour batter.',
      category: 'Starters',
      price: 280,
      isVeg: false,
      isNew: true,
      isSpicy: true,
      isBestseller: false,
      isChefRecommended: false,
      rating: 4.4,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 310,
      allergens: ['Gluten', 'Fish'],
      prepTime: 12,
    },
    {
      name: 'Hyderabadi Chicken Dum Biryani',
      description: 'Classic aromatic basmati rice and marinated chicken cooked on slow "dum" steam with mint, coriander, and saffron.',
      category: 'Rice',
      price: 290,
      isVeg: false,
      isBestseller: true,
      isNew: false,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.9,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 780,
      allergens: ['Dairy'],
      prepTime: 25,
    },
    {
      name: 'Deluxe Non-Veg Thali',
      description: 'A wholesome meal containing Butter Chicken, Dal Makhani, Mix Veg, Rice, Butter Naan, Gulab Jamun, and Raita.',
      category: 'Combos',
      price: 380,
      isVeg: false,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.7,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 950,
      allergens: ['Dairy', 'Gluten', 'Nuts'],
      prepTime: 20,
    },
    {
      name: 'Kesar Pista Kulfi',
      description: 'Traditional slow-reduced dense milk ice cream flavored with saffron, cardamom, and loaded with crushed pistachios.',
      category: 'Desserts',
      price: 90,
      isVeg: true,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.5,
      available: true,
      image: '/assets/food/veg_manchurian.png',
      calories: 180,
      allergens: ['Dairy', 'Nuts'],
      prepTime: 5,
    },
  ],
  // GoldenChillyz dishes (Sea food, premium Asian, gold signature items)
  goldenchillyz: [
    {
      name: 'Golden Prawn Tempura',
      description: 'Jumbo prawns coated in a light, crispy-airy Japanese tempura batter, deep fried and served with sweet chili dip.',
      category: 'Starters',
      price: 350,
      isVeg: false,
      isBestseller: true,
      isNew: false,
      isSpicy: false,
      isChefRecommended: true,
      rating: 4.8,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 260,
      allergens: ['Shellfish', 'Gluten'],
      prepTime: 12,
    },
    {
      name: 'Signature Malabar Prawn Curry',
      description: 'Fresh jumbo prawns cooked in a traditional Malabar-style rich spiced coconut milk gravy with curry leaves and steamed rice.',
      category: 'Meals',
      price: 390,
      isVeg: false,
      isBestseller: false,
      isNew: false,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.9,
      available: true,
      image: '/assets/food/golden_prawn_tempura.png',
      calories: 510,
      allergens: ['Shellfish'],
      prepTime: 18,
    },
    {
      name: 'Golden Egg Fried Rice',
      description: 'Fluffy jasmine rice wok-tossed with aromatic sesame oil, golden egg yolks, tender scallions, and spring greens.',
      category: 'Rice',
      price: 230,
      isVeg: false,
      isNew: false,
      isSpicy: false,
      isBestseller: false,
      isChefRecommended: false,
      rating: 4.5,
      available: true,
      image: '/assets/food/schezwan_noodles.png',
      calories: 410,
      allergens: ['Egg', 'Soy'],
      prepTime: 10,
    },
    {
      name: 'Golden Supreme Chicken Pizza',
      description: 'Premium hand-tossed crust loaded with smoky chicken tikka, peppers, fresh basil, mozzarella, and topped with edible gold flakes.',
      category: 'Pizza',
      price: 420,
      isVeg: false,
      isBestseller: false,
      isNew: true,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.7,
      available: true,
      image: '/assets/food/paneer_chilly_dry.png',
      calories: 740,
      allergens: ['Dairy', 'Gluten'],
      prepTime: 15,
    },
    {
      name: 'Spicy Seafood Udon Noodles',
      description: 'Thick chewy Japanese udon noodles tossed with prawns, squid, broccoli, and a fiery red pepper soy glaze.',
      category: 'Noodles',
      price: 340,
      isVeg: false,
      isBestseller: true,
      isNew: false,
      isSpicy: true,
      isChefRecommended: false,
      rating: 4.6,
      available: true,
      image: '/assets/food/schezwan_noodles.png',
      calories: 440,
      allergens: ['Gluten', 'Soy', 'Shellfish'],
      prepTime: 12,
    },
    {
      name: 'Premium Mango Lassi',
      description: 'Creamy cold beverage made from blended fresh Alphonso mango pulp, dense curd, saffron, and garnished with roasted pistachios.',
      category: 'Beverages',
      price: 110,
      isVeg: true,
      isBestseller: true,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.9,
      available: true,
      image: '/assets/food/schezwan_noodles.png',
      calories: 210,
      allergens: ['Dairy', 'Nuts'],
      prepTime: 6,
    },
    {
      name: 'Golden Triple Chocolate Mousse',
      description: 'Layered white, milk, and Belgian dark chocolate mousse cup decorated with edible gold leaf flakes and a fresh berry.',
      category: 'Desserts',
      price: 180,
      isVeg: true,
      isBestseller: false,
      isNew: false,
      isSpicy: false,
      isChefRecommended: false,
      rating: 4.8,
      available: true,
      image: '/assets/food/veg_manchurian.png',
      calories: 340,
      allergens: ['Dairy'],
      prepTime: 5,
    },
  ],
};

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreMenu(storeId: string, query: MenuQueryDto): Promise<Dish[]> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { brand: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    const brandName = store.brand?.name?.toLowerCase().replace(/\s+/g, '') || 'greenchillyz';
    const dishesRaw = BRAND_DISHES[brandName] || BRAND_DISHES['greenchillyz'];

    // Generate stable UUIDs for mock dishes based on name and store ID
    let dishes: Dish[] = dishesRaw.map((dish, index) => ({
      ...dish,
      id: `${storeId.substring(0, 8)}-${index}-dish-${dish.name.toLowerCase().replace(/\s+/g, '-')}`,
    }));

    // Apply Filters
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      dishes = dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower) ||
          d.category.toLowerCase().includes(searchLower),
      );
    }

    if (query.veg !== undefined) {
      dishes = dishes.filter((d) => d.isVeg === query.veg);
    }

    if (query.nonVeg !== undefined) {
      dishes = dishes.filter((d) => d.isVeg !== query.nonVeg);
    }

    if (query.bestseller !== undefined) {
      dishes = dishes.filter((d) => d.isBestseller === query.bestseller);
    }

    if (query.new !== undefined) {
      dishes = dishes.filter((d) => d.isNew === query.new);
    }

    if (query.spicy !== undefined) {
      dishes = dishes.filter((d) => d.isSpicy === query.spicy);
    }

    if (query.chefRecommended !== undefined) {
      dishes = dishes.filter((d) => d.isChefRecommended === query.chefRecommended);
    }

    if (query.available !== undefined) {
      dishes = dishes.filter((d) => d.available === query.available);
    }

    if (query.category) {
      dishes = dishes.filter((d) => d.category.toLowerCase() === query.category!.toLowerCase());
    }

    return dishes;
  }

  async getFeaturedDishes(storeId: string): Promise<Dish[]> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { brand: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    const brandName = store.brand?.name?.toLowerCase().replace(/\s+/g, '') || 'greenchillyz';
    const dishesRaw = BRAND_DISHES[brandName] || BRAND_DISHES['greenchillyz'];

    // Map and filter featured / bestsellers
    const dishes: Dish[] = dishesRaw.map((dish, index) => ({
      ...dish,
      id: `${storeId.substring(0, 8)}-${index}-dish-${dish.name.toLowerCase().replace(/\s+/g, '-')}`,
    }));

    return dishes.filter((d) => d.isBestseller || d.isChefRecommended).slice(0, 5);
  }
}
