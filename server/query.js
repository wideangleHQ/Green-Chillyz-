const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='store_vouchers'")
  .then(rows => {
    console.table(rows);
  })
  .finally(() => prisma.$disconnect());
