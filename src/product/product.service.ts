import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProduct(createProductDto: CreateProductDto) {

    const productAlreadyExistsWithName = await this.prismaService.product.findFirst({
      where: { name: createProductDto.name },
    });

    if (productAlreadyExistsWithName) {
      throw new BadRequestException(`Product with name ${createProductDto.name} already exists`);
    }

    // Validate category exists
    const category = await this.prismaService.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`);
    }



    return this.prismaService.product.create({
      data: createProductDto,
      include: {
        category: true,
      },
    });
  }

  async getProducts(
    limit = 10, 
    offset = 0, 
    filters?: { categoryId?: number; search?: string; inStock?: boolean }
  ) {
    const whereCondition: any = {};

    // Category filter
    if (filters?.categoryId) {
      whereCondition.categoryId = filters.categoryId;
    }

    // Search filter (name, description, sku)
    if (filters?.search) {
      whereCondition.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Stock filter
    if (filters?.inStock === true) {
      whereCondition.stock = { gt: 0 };
    } else if (filters?.inStock === false) {
      whereCondition.stock = { lte: 0 };
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.product.findMany({
        where: whereCondition,
        take: limit,
        skip: offset,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.product.count({ where: whereCondition }),
    ]);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / Math.max(1, limit)),
        currentPage: Math.floor(offset / Math.max(1, limit)) + 1,
      },
      filters: filters || {},
    };
  }

  async getProductById(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto) {
    // Verify product exists first
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If categoryId is being updated, validate it exists
    if (updateProductDto.categoryId) {
      const category = await this.prismaService.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateProductDto.categoryId} not found`);
      }
    }

    return this.prismaService.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(id: number) {
    // Check if product has any sale items
    const saleItemCount = await this.prismaService.saleItem.count({
      where: { productId: id },
    });

    if (saleItemCount > 0) {
      throw new BadRequestException('Cannot delete product that has been sold');
    }

    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prismaService.product.delete({
      where: { id },
    });
  }

  async getProductsByCategory(categoryId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.prismaService.product.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getAllCategories() {
    const categories = await this.prismaService.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async getCategorySummary(categoryId: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Get category products with additional stats
    const products = await this.prismaService.product.findMany({
      where: { categoryId },
      include: {
        category: true,
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true,
          },
        },
      },
    });

    // Calculate category metrics
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.stock > 0).length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.reorderLevel || 10)).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price.toNumber()), 0);
    const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price.toNumber(), 0) / totalProducts : 0;

    // Products with sales data
    const productsWithSales = products.filter(p => p._count.saleItems > 0);
    const productsWithPurchases = products.filter(p => p._count.purchaseItems > 0);

    return {
      category: {
        id: category.id,
        name: category.name,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      summary: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockValue,
        averagePrice,
        productsWithSales: productsWithSales.length,
        productsWithPurchases: productsWithPurchases.length,
      },
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        price: p.price.toNumber(),
        costPrice: p.costPrice?.toNumber() || 0,
        reorderLevel: p.reorderLevel,
        salesCount: p._count.saleItems,
        purchaseCount: p._count.purchaseItems,
        stockValue: p.stock * p.price.toNumber(),
        status: p.stock === 0 ? 'OUT_OF_STOCK' : 
               (p.stock <= (p.reorderLevel || 10)) ? 'LOW_STOCK' : 'IN_STOCK',
      })),
    };
  }
}
