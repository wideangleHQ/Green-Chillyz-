import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ImageRule {
  imageFile: string;
  folder: string;
  allowedFoodTypes: ('VEG' | 'NON_VEG' | 'EGG')[];
  itemNames: string[];
}

const MAPPING_RULES: ImageRule[] = [
  // Biryani (6 images)
  {
    imageFile: 'CHICKEN_BIRYANI.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Biryani', 'Chicken Biryani (Full)', 'Chicken Biryani (Half)'],
  },
  {
    imageFile: 'CHICKEN_LEG_BIRYANI.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Spl Leg Biryani', 'Chicken Tandoor Leg Biryani'],
  },
  {
    imageFile: 'Kabab_biryani.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Kebab Biryani', 'Kebab Biryani'],
  },
  {
    imageFile: 'MUTTON_BIRYANI.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Mutton Biryani', 'Mutton Dum Biryani'],
  },
  {
    imageFile: 'Prawn_biryani.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Prawn Biryani', 'Prawns Biryani'],
  },
  {
    imageFile: 'VEG_BIRYANI.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Veg Biryani', 'Special Veg Biryani'],
  },

  // Chicken (5 images) — strictly NON_VEG
  {
    imageFile: 'CHICKEN_BUTTER_MASALA.jpg',
    folder: 'Chicken',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Butter Masala'],
  },
  {
    imageFile: 'CHICKEN_LOLLIPOP.jpg',
    folder: 'Chicken',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Lollipop', 'Chicken Lollypop'],
  },
  {
    imageFile: 'CHICKEN_MANCHURIAN.jpg',
    folder: 'Chicken',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Manchurian'],
  },
  {
    imageFile: 'CHICKEN_PAKODA.jpg',
    folder: 'Chicken',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Pakoda', 'Chicken Pakoda 5pcs', 'Chicken Pakoda 6pcs', 'Chicken Pakora'],
  },
  {
    imageFile: 'CHILLY_CHICKEN.jpg',
    folder: 'Chicken',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: [
      'Chilly Chicken',
      'Chilli Chicken',
      'Chilli Chicken 4pcs',
      'Chilly Chicken Dry',
      'Chilly Chicken Gravy',
      'Chilli Chicken Dry',
      'Chilli Chicken Gravy',
    ],
  },

  // Mutton & Prawn (1 image) — strictly NON_VEG
  {
    imageFile: 'Mutton_keema_masala.jpg',
    folder: 'Mutton & Prawn',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Mutton Keema Masala'],
  },

  // Noodles (8 images)
  {
    imageFile: 'EGG_CHICKEN_NOODLES.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Egg Chicken Noodles', 'Egg Chicken Chowmein', 'Egg Chicken Hakka Noodles'],
  },
  {
    imageFile: 'Egg_noodles.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['EGG'],
    itemNames: ['Egg Noodles', 'Egg Chowmein', 'Egg Hakka Noodles'],
  },
  {
    imageFile: 'KEBAB_NOODLES.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Kebab Noodles', 'Chicken Kebab Noodles', 'Chicken Kebab Chowmein'],
  },
  {
    imageFile: 'Mushroom_noodles.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Mushroom Noodles', 'Mushroom Chowmein', 'Mushroom Hakka Noodles'],
  },
  {
    imageFile: 'NON_VEG_MIX_NOODLES.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Non-Veg Mix Noodles', 'Non Veg Mix Noodles', 'Non Veg Mix Chowmein', 'Mixed Non-Veg Noodles'],
  },
  {
    imageFile: 'PANEER_NOODLES.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Paneer Noodles', 'Paneer Chowmein', 'Paneer Hakka Noodles'],
  },
  {
    imageFile: 'Prawn_noodles.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Prawn Noodles', 'Prawn Chowmein', 'Prawn Hakka Noodles'],
  },
  {
    imageFile: 'VEG_HAKKA_NOODLES.jpg',
    folder: 'Noodles',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Veg Hakka Noodles', 'Veg Noodles', 'Veg Chowmein'],
  },

  // Paneer & Mushroom (4 images) — strictly VEG
  {
    imageFile: 'MUSHROOM_CHILLY.jpg',
    folder: 'Paneer & Mushroom',
    allowedFoodTypes: ['VEG'],
    itemNames: [
      'Mushroom Chilly',
      'Mushroom Chilli',
      'Mushroom Chilly Dry',
      'Mushroom Chilly Gravy',
      'Mushroom Chilli Dry',
      'Mushroom Chilli Gravy',
    ],
  },
  {
    imageFile: 'MUSHROOM_MANCHURIAN.jpg',
    folder: 'Paneer & Mushroom',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Mushroom Manchurian', 'Mushroom Manchurian Dry', 'Mushroom Manchurian Gravy'],
  },
  {
    imageFile: 'PANEER_CHILLY.jpg',
    folder: 'Paneer & Mushroom',
    allowedFoodTypes: ['VEG'],
    itemNames: [
      'Paneer Chilly',
      'Paneer Chilli',
      'Paneer Chilly 4pcs',
      'Paneer Chilly Dry',
      'Paneer Chilly Gravy',
      'Paneer Chilli Dry',
      'Paneer Chilli Gravy',
    ],
  },
  {
    imageFile: 'PANEER_MANCHURIAN.jpg',
    folder: 'Paneer & Mushroom',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Paneer Manchurian', 'Paneer Manchurian Dry', 'Paneer Manchurian Gravy'],
  },

  // Paratha (1 image) — strictly VEG
  {
    imageFile: 'Lachha_paratha.jpg',
    folder: 'Paratha',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Lachha Paratha', 'Laccha Paratha'],
  },

  // Roll (7 images)
  {
    imageFile: 'CHICKEN_ROLL.jpg',
    folder: 'Roll',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Roll', 'Plain Chicken Roll'],
  },
  {
    imageFile: 'Double_egg_chicken_roll.jpg',
    folder: 'Roll',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Double Egg Chicken Roll', 'Dbl Egg Chicken Roll', '2 Egg Chicken Roll'],
  },
  {
    imageFile: 'EGG_CHICKEN_ROLL.png',
    folder: 'Roll',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Egg Chicken Roll', '1 Egg Chicken Roll'],
  },
  {
    imageFile: 'EGG_KEBAB_ROLL.jpg',
    folder: 'Roll',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Egg Kebab Roll', 'Egg Chicken Kebab Roll'],
  },
  {
    imageFile: 'Mix_veg_roll.jpg',
    folder: 'Roll',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Mix Veg Roll', 'Mix Veg Roll (Paneer & Mushroom)', 'Veg Roll', 'Plain Veg Roll'],
  },
  {
    imageFile: 'Mushroom_roll.jpg',
    folder: 'Roll',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Mushroom Roll'],
  },
  {
    imageFile: 'Paneer_roll.jpg',
    folder: 'Roll',
    allowedFoodTypes: ['VEG'],
    itemNames: ['Paneer Roll'],
  },

  // Tandoor (7 images) — strictly NON_VEG (Never assign to Veg/Soya Chaap)
  {
    imageFile: 'CHICKEN_TIKKA.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Tikka', 'Chicken Tikka Kebab'],
  },
  {
    imageFile: 'HARIYALI_KEBAB.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Hariyali Kebab', 'Chicken Hariyali Kebab', 'Chicken Haryali Kebab'],
  },
  {
    imageFile: 'KASTURI_KEBAB.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Kasturi Kebab', 'Chicken Kasturi Kebab'],
  },
  {
    imageFile: 'KATHI_KEBAB.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Kathi Kebab', 'Chicken Kathi Kebab'],
  },
  {
    imageFile: 'KEBAB_BUTTER_MASALA.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Kebab Butter Masala', 'Chicken Tikka Butter Masala', 'Chicken Kebab Butter Masala'],
  },
  {
    imageFile: 'MALAI_KEBAB.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Malai Kebab', 'Chicken Malai Kebab'],
  },
  {
    imageFile: 'Tangdi_leg.jpg',
    folder: 'Tandoor',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Tangdi Leg', 'Tangri Leg', 'Tandoor Leg', 'Chicken Tangdi Kebab', 'Chicken Tangri Leg'],
  },
];

async function main() {
  console.log('=== Populating MenuItemImage records with strict Veg / Non-Veg separation ===\n');

  const items = await prisma.menuItem.findMany({
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      images: true,
    }
  });

  console.log(`Found ${items.length} total menu items in database.`);

  let createdCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  let matchedItemCount = 0;

  for (const item of items) {
    let matchedRule: ImageRule | null = null;
    for (const rule of MAPPING_RULES) {
      if (
        rule.allowedFoodTypes.includes(item.foodType as any) &&
        rule.itemNames.some(n => n.toLowerCase() === item.name.trim().toLowerCase())
      ) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      matchedItemCount++;
      const url = encodeURI(`/assets/Food Image/${matchedRule.folder}/${matchedRule.imageFile}`);
      const altText = item.name;

      if (item.images.length === 0) {
        await prisma.menuItemImage.create({
          data: {
            menuItemId: item.id,
            url,
            thumbnailUrl: url,
            altText,
            isPrimary: true,
            displayOrder: 0,
          }
        });
        createdCount++;
      } else {
        const primaryImg = item.images.find(img => img.isPrimary) || item.images[0];
        await prisma.menuItemImage.update({
          where: { id: primaryImg.id },
          data: {
            url,
            thumbnailUrl: url,
            altText,
            isPrimary: true,
          }
        });
        updatedCount++;
      }
    } else {
      // If item has an image that was previously mapped but no longer matches our strict rules (e.g. Soya Chaap with Kebab photo), delete it!
      if (item.images.length > 0) {
        const localFoodImages = item.images.filter(img => img.url.includes('/assets/Food%20Image/'));
        if (localFoodImages.length > 0) {
          for (const img of localFoodImages) {
            await prisma.menuItemImage.delete({ where: { id: img.id } });
            removedCount++;
          }
        }
      }
    }
  }

  console.log(`\nMapping Summary:`);
  console.log(`- Total Matched Items: ${matchedItemCount}`);
  console.log(`- Created Image Records: ${createdCount}`);
  console.log(`- Updated Image Records: ${updatedCount}`);
  console.log(`- Removed Incompatible/Mismatched Records: ${removedCount}`);
  console.log(`- Unmatched Items (Safe default fallback): ${items.length - matchedItemCount}`);

  const totalImagesInDb = await prisma.menuItemImage.count();
  console.log(`- Total MenuItemImage records in DB now: ${totalImagesInDb}`);
}

main()
  .catch(e => {
    console.error('Error populating menu images:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
