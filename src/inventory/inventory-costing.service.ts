import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InventoryCostingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add inventory batch when receiving stock from purchase order
   */
  async addInventoryBatch(params: {
    productId: number;
    quantity: number;
    unitCost: number;
    purchaseOrderId?: string;
    supplierId?: string;
    batchNumber?: string;
    expiresAt?: Date;
  }) {
    const { productId, quantity, unitCost, purchaseOrderId, supplierId, batchNumber, expiresAt } = params;

    // Create inventory batch
    const batch = await this.prisma.inventoryBatch.create({
      data: {
        productId,
        purchaseOrderId,
        quantityReceived: quantity,
        quantityRemaining: quantity,
        unitCost: new Decimal(unitCost),
        supplierId,
        batchNumber,
        expiresAt,
      },
    });

    // Update product's weighted average cost
    await this.updateWeightedAverageCost(productId);

    return batch;
  }

  /**
   * Calculate and update weighted average cost for a product
   */
  async updateWeightedAverageCost(productId: number) {
    // Get all batches with remaining quantity
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        productId,
        quantityRemaining: { gt: 0 },
      },
    });

    if (batches.length === 0) {
      // No inventory, set cost to 0
      await this.prisma.product.update({
        where: { id: productId },
        data: { costPrice: 0 },
      });
      return 0;
    }

    // Calculate weighted average: (sum of quantity * cost) / total quantity
    let totalValue = 0;
    let totalQuantity = 0;

    batches.forEach(batch => {
      totalValue += batch.quantityRemaining * batch.unitCost.toNumber();
      totalQuantity += batch.quantityRemaining;
    });

    const weightedAvgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // Update product cost
    await this.prisma.product.update({
      where: { id: productId },
      data: { costPrice: new Decimal(weightedAvgCost) },
    });

    return weightedAvgCost;
  }

  /**
   * Consume inventory using FIFO (First In, First Out) method
   * Returns the actual cost of goods sold
   */
  async consumeInventoryFIFO(productId: number, quantity: number): Promise<number> {
    let remainingToConsume = quantity;
    let totalCost = 0;

    // Get batches ordered by receivedAt (FIFO)
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        productId,
        quantityRemaining: { gt: 0 },
      },
      orderBy: {
        receivedAt: 'asc', // Oldest first (FIFO)
      },
    });

    for (const batch of batches) {
      if (remainingToConsume <= 0) break;

      const quantityFromBatch = Math.min(remainingToConsume, batch.quantityRemaining);
      const costFromBatch = quantityFromBatch * batch.unitCost.toNumber();

      totalCost += costFromBatch;
      remainingToConsume -= quantityFromBatch;

      // Update batch quantity
      await this.prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          quantityRemaining: batch.quantityRemaining - quantityFromBatch,
        },
      });
    }

    if (remainingToConsume > 0) {
      console.warn(`Not enough inventory batches for product ${productId}. Missing ${remainingToConsume} units.`);
    }

    // Update weighted average cost after consumption
    await this.updateWeightedAverageCost(productId);

    return totalCost;
  }

  /**
   * Get current average cost per unit using weighted average method
   */
  async getAverageCostPerUnit(productId: number): Promise<number> {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        productId,
        quantityRemaining: { gt: 0 },
      },
    });

    if (batches.length === 0) return 0;

    let totalValue = 0;
    let totalQuantity = 0;

    batches.forEach(batch => {
      totalValue += batch.quantityRemaining * batch.unitCost.toNumber();
      totalQuantity += batch.quantityRemaining;
    });

    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  /**
   * Get inventory valuation (total value of all inventory)
   */
  async getInventoryValuation(productId?: number) {
    const where = productId ? { productId } : {};

    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        ...where,
        quantityRemaining: { gt: 0 },
      },
      include: {
        product: true,
      },
    });

    const totalValue = batches.reduce((sum, batch) => {
      return sum + (batch.quantityRemaining * batch.unitCost.toNumber());
    }, 0);

    return {
      totalValue,
      batches: batches.map(b => ({
        productId: b.productId,
        productName: b.product.name,
        quantity: b.quantityRemaining,
        unitCost: b.unitCost.toNumber(),
        totalValue: b.quantityRemaining * b.unitCost.toNumber(),
        receivedAt: b.receivedAt,
      })),
    };
  }

  /**
   * Adjust inventory batch (for corrections or damaged goods)
   */
  async adjustInventoryBatch(batchId: number, newQuantity: number) {
    const batch = await this.prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { quantityRemaining: newQuantity },
    });

    // Update weighted average cost
    await this.updateWeightedAverageCost(batch.productId);

    return batch;
  }
}
