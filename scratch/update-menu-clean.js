const fs = require('fs');
const path = require('path');

const MAPPING_RULES = [
  // Biryani (6 images)
  {
    imageFile: 'CHICKEN_BIRYANI.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Biryani', 'Chicken Biryani (Full)', 'Chicken Biryani (Half)', 'Chicken Dum Biryani'],
  },
  {
    imageFile: 'CHICKEN_LEG_BIRYANI.jpg',
    folder: 'Biryani',
    allowedFoodTypes: ['NON_VEG'],
    itemNames: ['Chicken Spl Leg Biryani', 'Chicken Tandoor Leg Biryani', 'Chicken Leg Biryani'],
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
    itemNames: ['Veg Biryani', 'Special Veg Biryani', 'Veg Dum Biryani'],
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
    allowedFoodTypes: ['NON_VEG', 'EGG'],
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
    itemNames: ['Lachha Paratha', 'Laccha Paratha', 'Plain Lachha Paratha'],
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

  // Tandoor (7 images) — strictly NON_VEG
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

const menuJsonPath = path.join('c:/WideAngle/Green Chillyz', 'server/src/menu.json');
const menuJson = JSON.parse(fs.readFileSync(menuJsonPath, 'utf8'));

let totalUpdated = 0;
let totalKeptEmpty = 0;

menuJson.stores.forEach(storeObj => {
  storeObj.categories.forEach(cat => {
    cat.items.forEach(item => {
      let matchedRule = null;
      for (const rule of MAPPING_RULES) {
        if (
          rule.allowedFoodTypes.includes(item.foodType) &&
          rule.itemNames.some(n => n.toLowerCase() === item.name.trim().toLowerCase())
        ) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule) {
        const url = encodeURI(`/assets/Food Image/${matchedRule.folder}/${matchedRule.imageFile}`);
        item.images = [
          {
            url,
            thumbnail: url,
            isPrimary: true,
          }
        ];
        totalUpdated++;
      } else {
        // Items without real original image stay empty!
        item.images = [];
        totalKeptEmpty++;
      }
    });
  });
});

fs.writeFileSync(menuJsonPath, JSON.stringify(menuJson, null, 2), 'utf8');
console.log(`Updated ${totalUpdated} items with authentic food images.`);
console.log(`Kept ${totalKeptEmpty} unmapped items completely empty (no fake placeholders).`);
