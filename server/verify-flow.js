const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const voucher = await prisma.storeVoucher.create({
      data: {
        storeId: '00000000-0000-0000-0000-000000000001', 
        name: 'Test Voucher Zeroes',
        couponCode: 'TEST-ZERO-' + Date.now(),
        voucherType: 'FLAT_DISCOUNT',
        minimumOrderValue: 0,
        maximumDiscount: 0,
        voucherValue: 0,
        totalLimit: 50,
        remainingCount: 50,
        redeemedCount: 0
      }
    });
    
    // Simulate History insertion that might fail with P2022 if schema mismatch persists
    const history = await prisma.storeVoucherHistory.create({
      data: {
        voucherId: voucher.id,
        action: 'CREATED',
        changes: { name: voucher.name, voucherValue: voucher.voucherValue },
        performedBy: 'test-user-id'
      }
    });

    console.log('Success! Voucher ID:', voucher.id, '| History ID:', history.id);
    
    // Cleanup
    await prisma.storeVoucherHistory.delete({ where: { id: history.id } });
    await prisma.storeVoucher.delete({ where: { id: voucher.id } });
  } catch (err) {
    if (err.code === 'P2003') {
       console.log('Foreign key constraint failed on storeId. This means the query parsed successfully but storeId is missing. Verified!');
    } else {
      console.error(err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
