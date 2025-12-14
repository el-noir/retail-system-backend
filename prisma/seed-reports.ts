process.env.PRISMA_CLIENT_ENGINE_TYPE =
  process.env.PRISMA_CLIENT_ENGINE_TYPE || 'binary';

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'reports.admin@example.com' },
    update: {},
    create: {
      name: 'Reports Admin',
      email: 'reports.admin@example.com',
      password: 'hashed-password-placeholder',
      role: Role.ADMIN,
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'RPT-001' },
      update: {},
      create: {
        name: 'Report Widget A',
        sku: 'RPT-001',
        description: 'Widget for reports testing',
        price: 50,
        costPrice: 30,
        stock: 20,
        category: {
          connectOrCreate: {
            where: { name: 'Reports QA' },
            create: { name: 'Reports QA' },
          },
        },
      },
    }),
    prisma.product.upsert({
      where: { sku: 'RPT-002' },
      update: {},
      create: {
        name: 'Report Widget B',
        sku: 'RPT-002',
        description: 'Widget for reports testing',
        price: 80,
        costPrice: 55,
        stock: 5,
        category: {
          connectOrCreate: {
            where: { name: 'Reports QA' },
            create: { name: 'Reports QA' },
          },
        },
      },
    }),
  ]);

  const sale = await prisma.sale.create({
    data: {
      customerName: 'QA Customer',
      subtotal: 130,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 130,
      paymentMethod: 'cash',
      soldById: admin.id,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
          },
          {
            productId: products[1].id,
            quantity: 1,
            unitPrice: 80,
            totalPrice: 80,
          },
        ],
      },
    },
  });

  await prisma.stockLog.createMany({
    data: [
      {
        productId: products[0].id,
        changeType: 'RESTOCK',
        quantity: 10,
        reason: 'Initial QA restock',
        userId: admin.id,
      },
      {
        productId: products[1].id,
        changeType: 'SALE',
        quantity: -1,
        reason: `Sale ${sale.invoiceNumber}`,
        userId: admin.id,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });