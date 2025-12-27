import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierProductDto, UpdateSupplierProductDto, BulkAddProductsDto } from './dto/supplier-product.dto';

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
        supplierProducts: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            product: {
              name: 'asc',
            },
          },
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
      throw new BadRequestException(
        `Cannot delete supplier with ${ordersCount} purchase orders. Archive instead.`,
      );
    }

    return this.prismaService.supplier.delete({
      where: { id },
    });
  }

  // ============ SUPPLIER PRODUCT MANAGEMENT ============

  async addProductToSupplier(dto: CreateSupplierProductDto) {
    // Verify supplier and product exist
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const product = await this.prismaService.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already exists
    const existing = await this.prismaService.supplierProduct.findUnique({
      where: {
        supplierId_productId: {
          supplierId: dto.supplierId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Product already added to this supplier');
    }

    return this.prismaService.supplierProduct.create({
      data: dto,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async bulkAddProducts(dto: BulkAddProductsDto) {
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const results: any[] = [];
    const errors: { productId: number; error: string }[] = [];

    for (const productId of dto.productIds) {
      try {
        const supplierProduct = await this.prismaService.supplierProduct.create({
          data: {
            supplierId: dto.supplierId,
            productId,
            supplierPrice: dto.defaultPrice,
            minOrderQty: dto.minOrderQty || 1,
            isAvailable: true,
          },
          include: {
            product: true,
          },
        });
        results.push(supplierProduct);
      } catch (error) {
        errors.push({ productId, error: 'Already exists or product not found' });
      }
    }

    return {
      success: results,
      errors,
      summary: {
        total: dto.productIds.length,
        added: results.length,
        failed: errors.length,
      },
    };
  }

  async getSupplierProducts(supplierId: string) {
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.prismaService.supplierProduct.findMany({
      where: { supplierId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });
  }

  async updateSupplierProduct(id: string, dto: UpdateSupplierProductDto) {
    const supplierProduct = await this.prismaService.supplierProduct.findUnique({
      where: { id },
    });

    if (!supplierProduct) {
      throw new NotFoundException('Supplier product not found');
    }

    return this.prismaService.supplierProduct.update({
      where: { id },
      data: dto,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async removeProductFromSupplier(id: string) {
    const supplierProduct = await this.prismaService.supplierProduct.findUnique({
      where: { id },
    });

    if (!supplierProduct) {
      throw new NotFoundException('Supplier product not found');
    }

    return this.prismaService.supplierProduct.delete({
      where: { id },
    });
  }

  async getProductSuppliers(productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prismaService.supplierProduct.findMany({
      where: { productId },
      include: {
        supplier: true,
      },
      orderBy: [
        { isPrimarySupplier: 'desc' },
        { supplierPrice: 'asc' },
      ],
    });
  }

  async getLowStockRecommendations() {
    // Get products below reorder level
    const lowStockProducts = await this.prismaService.product.findMany({
      where: {
        OR: [
          { stock: { lte: 10 } },
          {
            AND: [
              { reorderLevel: { not: null } },
              { stock: { lte: this.prismaService.product.fields.reorderLevel } },
            ],
          },
        ],
      },
      include: {
        category: true,
        supplierProducts: {
          where: {
            isAvailable: true,
          },
          include: {
            supplier: true,
          },
          orderBy: [
            { isPrimarySupplier: 'desc' },
            { supplierPrice: 'asc' },
          ],
        },
      },
    });

    return lowStockProducts.map((product) => ({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stock,
        reorderLevel: product.reorderLevel,
        suggestedReorderQty: product.reorderQty || 50,
        category: product.category.name,
      },
      suppliers: product.supplierProducts.map((sp) => ({
        id: sp.id,
        supplierId: sp.supplierId,
        supplierName: sp.supplier.name,
        supplierPrice: sp.supplierPrice,
        isPrimarySupplier: sp.isPrimarySupplier,
        isAvailable: sp.isAvailable,
        minOrderQty: sp.minOrderQty,
        leadTimeDays: sp.leadTimeDays,
        estimatedCost: Number(sp.supplierPrice) * (product.reorderQty || 50),
      })),
    }));
  }
}
