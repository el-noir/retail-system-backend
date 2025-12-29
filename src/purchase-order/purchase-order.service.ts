import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PurchaseStatus } from '@prisma/client';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createDto: CreatePurchaseOrderDto, userId?: number) {
    // Verify supplier exists
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: createDto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Verify all products exist
    const productIds = createDto.items.map((item) => item.productId);
    const products = await this.prismaService.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Calculate total amount
    const totalAmount = createDto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Create purchase order with items
    const purchaseOrder = await this.prismaService.purchaseOrder.create({
      data: {
        supplierId: createDto.supplierId,
        totalAmount,
        notes: createDto.notes,
        createdById: userId,
        status: PurchaseStatus.DRAFT,
        items: {
          create: createDto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return purchaseOrder;
  }

  async findAll(
    status?: PurchaseStatus,
    supplierId?: string,
    limit = 50,
    offset = 0,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const orders = await this.prismaService.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prismaService.purchaseOrder.count({ where });

    return {
      orders,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prismaService.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    return order;
  }

  async approve(id: string) {
    const order = await this.findOne(id);

    if (order.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT orders can be approved');
    }

    return this.prismaService.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseStatus.APPROVED,
        approvedAt: new Date(),
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async markAsPaid(id: string) {
    const order = await this.findOne(id);

    if (order.status !== PurchaseStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED orders can be marked as paid');
    }

    return this.prismaService.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseStatus.PAID,
        paidAt: new Date(),
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async receiveGoods(id: string, itemId: string, receiveDto: ReceiveGoodsDto, userId?: number) {
    const order = await this.findOne(id);

    if (order.status !== PurchaseStatus.PAID) {
      throw new BadRequestException('Only PAID orders can receive goods');
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Purchase item not found');
    }

    if (item.receivedQty + receiveDto.receivedQty > item.quantity) {
      throw new BadRequestException(
        `Cannot receive ${receiveDto.receivedQty} units. Only ${item.quantity - item.receivedQty} remaining.`,
      );
    }

    // Update item received quantity
    const updatedItem = await this.prismaService.purchaseItem.update({
      where: { id: itemId },
      data: {
        receivedQty: item.receivedQty + receiveDto.receivedQty,
      },
    });

    // Update product stock
    const product = await this.prismaService.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update product stock AND cost price based on supplier unit price
    await this.prismaService.product.update({
      where: { id: item.productId },
      data: { 
        stock: { increment: receiveDto.receivedQty },
        costPrice: item.unitPrice, // Update cost price to match supplier price
      },
    });

    // Log stock movement
    await this.prismaService.stockLog.create({
      data: {
        productId: item.productId,
        type: 'in',
        quantity: receiveDto.receivedQty,
        reason: `Purchase Order ${order.id} - Goods Received`,
        createdBy: userId,
      },
    });

    // Check if all items are fully received
    const allItems = await this.prismaService.purchaseItem.findMany({
      where: { purchaseOrderId: id },
    });

    const allReceived = allItems.every((i) => i.receivedQty === i.quantity);

    if (allReceived) {
      await this.prismaService.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseStatus.RECEIVED,
          receivedAt: new Date(),
        },
      });
    }

    return this.findOne(id);
  }

  async close(id: string) {
    const order = await this.findOne(id);

    if (order.status !== PurchaseStatus.RECEIVED) {
      throw new BadRequestException('Only RECEIVED orders can be closed');
    }

    return this.prismaService.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseStatus.CLOSED,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async cancel(id: string) {
    const order = await this.findOne(id);

    if (order.status === PurchaseStatus.CLOSED || order.status === PurchaseStatus.RECEIVED) {
      throw new BadRequestException('Cannot cancel CLOSED or RECEIVED orders');
    }

    return this.prismaService.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseStatus.CANCELLED,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getStatistics() {
    const orders = await this.prismaService.purchaseOrder.findMany();

    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const byStatus = {
      draft: orders.filter((o) => o.status === PurchaseStatus.DRAFT).length,
      approved: orders.filter((o) => o.status === PurchaseStatus.APPROVED).length,
      paid: orders.filter((o) => o.status === PurchaseStatus.PAID).length,
      received: orders.filter((o) => o.status === PurchaseStatus.RECEIVED).length,
      closed: orders.filter((o) => o.status === PurchaseStatus.CLOSED).length,
      cancelled: orders.filter((o) => o.status === PurchaseStatus.CANCELLED).length,
    };

    return {
      summary: {
        totalOrders,
        totalValue,
        byStatus,
      },
    };
  }
}
