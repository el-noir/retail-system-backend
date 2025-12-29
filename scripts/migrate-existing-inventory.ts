import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to create inventory batches for existing products with stock
 * This ensures existing inventory is tracked in the new batch system
 */
async function migrateExistingInventory() {
  console.log('Starting inventory migration...');

  try {
    // Get all products that have stock
    const productsWithStock = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        costPrice: true,
      },
    });

    console.log(`Found ${productsWithStock.length} products with stock to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // Create an inventory batch for each product
    for (const product of productsWithStock) {
      try {
        await prisma.inventoryBatch.create({
          data: {
            productId: product.id,
            quantityReceived: product.stock,
            quantityRemaining: product.stock,
            unitCost: product.costPrice,
            receivedAt: new Date(), // Current date as received date
            batchNumber: `MIGRATION-${product.id}`,
          },
        });

        console.log(
          `✓ Migrated ${product.stock} units of "${product.name}" (ID: ${product.id}) @ $${product.costPrice}`,
        );
        successCount++;
      } catch (error) {
        console.error(
          `✗ Failed to migrate product "${product.name}" (ID: ${product.id}):`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Successfully migrated: ${successCount} products`);
    console.log(`Failed: ${errorCount} products`);
    console.log(`Total: ${productsWithStock.length} products`);

    if (successCount > 0) {
      console.log('\n✓ Inventory batches created successfully!');
      console.log('Next steps:');
      console.log('1. All existing inventory now has batch tracking');
      console.log('2. New purchases will automatically create new batches');
      console.log('3. Sales will consume batches using FIFO method');
      console.log('4. Product costPrice will be auto-calculated as weighted average');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingInventory()
  .then(() => {
    console.log('\nMigration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
