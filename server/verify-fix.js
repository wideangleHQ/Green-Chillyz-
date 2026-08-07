const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // We only pass the required fields to verify if Prisma and Postgres accept it
    const voucher = await prisma.storeVoucher.create({
      data: {
        storeId: '00000000-0000-0000-0000-000000000001', // Dummy UUID
        name: 'Test Voucher',
        couponCode: 'TEST-' + Date.now(),
        voucherType: 'FLAT_DISCOUNT',
        itemsIncluded: JSON.stringify('Free Fries'), // The fix!
      }
    });
    console.log('Success!', voucher.id);
    
    // Cleanup
    await prisma.storeVoucher.delete({ where: { id: voucher.id } });
  } catch (err) {
    if (err.code === 'P2003') {
       console.log('Foreign key constraint failed on storeId. This means the JSON parsing succeeded, but the dummy storeId was rejected. This confirms the fix works!');
    } else {
      console.error(err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
