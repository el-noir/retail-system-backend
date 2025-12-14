import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateSaleDto, CreateSaleItemDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createSale(createSaleDto: CreateSaleDto, soldById?: number) {
    const { items, customerName, customerPhone, taxAmount = 0, discountAmount = 0, paymentMethod } = createSaleDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
    }

    // Use Prisma transaction for atomicity
    return await this.prismaService.$transaction(async (tx) => {
      // Validate and fetch all products with their prices
      const productMap = new Map<number, any>();
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }

        productMap.set(item.productId, product);
      }

      // Calculate subtotal
      let subtotal = new Prisma.Decimal(0);
      const saleItemsData: Array<{ productId: number; quantity: number; unitPrice: Prisma.Decimal; totalPrice: Prisma.Decimal }> = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        const unitPrice = product.price;
        const totalPrice = unitPrice.mul(item.quantity);

        subtotal = subtotal.add(totalPrice);
        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      // Calculate total
      const taxDecimal = new Prisma.Decimal(taxAmount);
      const discountDecimal = new Prisma.Decimal(discountAmount);
      const totalAmount = subtotal.add(taxDecimal).minus(discountDecimal);

      // Create Sale and SaleItems in transaction
      const sale = await tx.sale.create({
        data: {
          customerName,
          customerPhone,
          subtotal,
          taxAmount: taxDecimal,
          discountAmount: discountDecimal,
          totalAmount,
          paymentMethod,
          ...(soldById && { soldById }),
          items: {
            create: saleItemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          soldBy: true,
        },
      });

      // Deduct stock atomically
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return sale;
    });
  }

  async getSales(limit = 10, offset = 0) {
    return this.prismaService.sale.findMany({
      take: limit,
      skip: offset,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        soldBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSaleById(id: number) {
    const sale = await this.prismaService.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        soldBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async getSaleByInvoiceNumber(invoiceNumber: string) {
    const sale = await this.prismaService.sale.findUnique({
      where: { invoiceNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        soldBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with invoice number ${invoiceNumber} not found`);
    }

    return sale;
  }
}
