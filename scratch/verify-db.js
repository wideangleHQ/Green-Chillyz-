const { PrismaClient } = require('../server/node_modules/@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function check() {
  const images = await prisma.menuItemImage.findMany({
    include: { menuItem: true }
  });
  console.log('Total MenuItemImage records in DB:', images.length);
  let errors = 0;
  for (const img of images) {
    const relativePath = path.join(__dirname, '..', decodeURI(img.url.replace('/assets/', 'client/public/assets/')));
    if (!fs.existsSync(relativePath)) {
      console.error('DB image file not found on disk:', relativePath, img.menuItem.name);
      errors++;
    }
    if (img.menuItem.foodType === 'VEG' && (img.url.includes('CHICKEN') || img.url.includes('MUTTON') || img.url.includes('Prawn') || img.url.includes('Kebab') || img.url.includes('Tangdi') || img.url.includes('HARIYALI') || img.url.includes('KASTURI') || img.url.includes('KATHI') || img.url.includes('MALAI'))) {
      console.error('DB MISMATCH! Veg item has non-veg image:', img.menuItem.name, img.url);
      errors++;
    }
    if (img.menuItem.foodType === 'NON_VEG' && (img.url.includes('VEG_BIRYANI') || img.url.includes('VEG_HAKKA') || img.url.includes('Mix_veg_roll') || img.url.includes('Lachha_paratha'))) {
      console.error('DB MISMATCH! Non-veg item has veg image:', img.menuItem.name, img.url);
      errors++;
    }
  }
  console.log('Database validation complete. Total records checked:', images.length, 'Errors found:', errors);
  await prisma.$disconnect();
}
check();
