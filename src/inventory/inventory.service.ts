import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { InventoryCostingService } from './inventory-costing.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly costingService: InventoryCostingService,
  ) {}

  // ============ STOCK OPERATIONS ============

  async stockIn(stockInDto: StockInDto, userId?: number) {
    const { productId, quantity, reason } = stockInDto;

    // Check product exists
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const unitCost = product.costPrice.toNumber() || 0;

    // Update product stock
    const updatedProduct = await this.prismaService.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });

    // Create inventory batch for cost tracking
    await this.costingService.addInventoryBatch({
      productId,
      quantity,
      unitCost,
    });

    // Log stock movement
    const log = await this.prismaService.stockLog.create({
      data: {
        productId,
        type: 'in',
        quantity,
        reason: reason || 'Stock replenishment',
        unitCost,
        createdBy: userId,
      },
      include: {
        product: true,
        createdByUser: true,
      },
    });

    return {
      product: updatedProduct,
      log,
      message: `Stock increased by ${quantity} units`,
    };
  }

  async stockOut(stockOutDto: StockOutDto, userId?: number) {
    const { productId, quantity, reason } = stockOutDto;

    // Check product exists
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Update product stock
    const updatedProduct = await this.prismaService.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    // Log stock movement
    const log = await this.prismaService.stockLog.create({
      data: {
        productId,
        type: 'out',
        quantity,
        reason: reason || 'Manual stock reduction',
        createdBy: userId,
      },
      include: {
        product: true,
        createdByUser: true,
      },
    });

    return {
      product: updatedProduct,
      log,
      message: `Stock reduced by ${quantity} units`,
    };
  }

  // Helper: perform stock-out inside an existing Prisma transaction
  async stockOutUsingTx(tx: Prisma.TransactionClient, stockOutDto: StockOutDto, userId?: number) {
    const { productId, quantity, reason } = stockOutDto;

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    const log = await tx.stockLog.create({
      data: {
        productId,
        type: 'out',
        quantity,
        reason: reason || 'Manual stock reduction',
        createdBy: userId,
      },
    });

    return { product: updatedProduct, log };
  }

  // Helper: perform stock-in inside an existing Prisma transaction (useful for cancellations)
  async stockInUsingTx(tx: Prisma.TransactionClient, stockInDto: StockInDto, userId?: number) {
    const { productId, quantity, reason } = stockInDto;

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });

    const log = await tx.stockLog.create({
      data: {
        productId,
        type: 'in',
        quantity,
        reason: reason || 'Stock replenishment',
        createdBy: userId,
      },
    });

    return { product: updatedProduct, log };
  }

  async getStockLogs(productId?: number, limit = 50, offset = 0) {
    const where = productId ? { productId } : {};

    const logs = await this.prismaService.stockLog.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prismaService.stockLog.count({ where });

    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getProductStockHistory(productId: number, limit = 50, offset = 0) {
    // Verify product exists
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const logs = await this.prismaService.stockLog.findMany({
      where: { productId },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prismaService.stockLog.count({ where: { productId } });

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stock,
      },
      history: logs,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ============ INVENTORY MONITORING ============

  async getLowStockProducts(threshold = 10, limit = 100, offset = 0) {
    const products = await this.prismaService.product.findMany({
      where: {
        stock: {
          lte: threshold,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          stock: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      take: limit,
      skip: offset,
    });

    const total = await this.prismaService.product.count({
      where: {
        stock: {
          lte: threshold,
        },
      },
    });

    // Calculate alert level for each product
    const productsWithAlerts = products.map((product) => ({
      ...product,
      alertLevel:
        product.stock === 0
          ? 'critical'
          : product.stock <= Math.ceil(threshold / 2)
            ? 'high'
            : 'medium',
      stockPercentage: Math.round((product.stock / threshold) * 100),
    }));

    return {
      products: productsWithAlerts,
      summary: {
        total,
        criticalCount: productsWithAlerts.filter((p) => p.alertLevel === 'critical').length,
        highCount: productsWithAlerts.filter((p) => p.alertLevel === 'high').length,
        mediumCount: productsWithAlerts.filter((p) => p.alertLevel === 'medium').length,
        threshold,
      },
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getInventorySummary() {
    const products = await this.prismaService.product.findMany();

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const normalStock = products.filter((p) => p.stock > 10).length;

    return {
      summary: {
        totalProducts,
        totalStock,
        outOfStock,
        lowStock,
        normalStock,
        stockHealth: {
          outOfStock: Math.round((outOfStock / totalProducts) * 100),
          lowStock: Math.round((lowStock / totalProducts) * 100),
          normalStock: Math.round((normalStock / totalProducts) * 100),
        },
      },
    };
  }
}
