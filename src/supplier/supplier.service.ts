import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    return this.prismaService.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll(limit = 100, offset = 0) {
    const suppliers = await this.prismaService.supplier.findMany({
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    });

    const total = await this.prismaService.supplier.count();

    return {
      suppliers,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.findOne(id);

    return this.prismaService.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);

    // Check if supplier has purchase orders
    const ordersCount = await this.prismaService.purchaseOrder.count({
      where: { supplierId: id },
    });

    if (ordersCount > 0) {
      throw new Error(
        `Cannot delete supplier with ${ordersCount} purchase orders. Archive instead.`,
      );
    }

    return this.prismaService.supplier.delete({
      where: { id },
    });
  }
}
