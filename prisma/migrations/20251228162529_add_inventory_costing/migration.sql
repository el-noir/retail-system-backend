/*
  Warnings:

  - The `status` column on the `PurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `newStock` on the `StockLog` table. All the data in the column will be lost.
  - You are about to drop the column `previousStock` on the `StockLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PurchaseOrder" ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(65,30),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "totalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unitCost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StockLog" DROP COLUMN "newStock",
DROP COLUMN "previousStock",
ADD COLUMN     "unitCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "InventoryBatch" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "purchaseOrderId" TEXT,
    "quantityReceived" INTEGER NOT NULL,
    "quantityRemaining" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "batchNumber" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryBatch_productId_quantityRemaining_idx" ON "InventoryBatch"("productId", "quantityRemaining");

-- CreateIndex
CREATE INDEX "InventoryBatch_productId_receivedAt_idx" ON "InventoryBatch"("productId", "receivedAt");

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
