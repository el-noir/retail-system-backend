import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProduct(createProductDto: CreateProductDto) {
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

  async getProducts(limit = 10, offset = 0) {
    return this.prismaService.product.findMany({
      take: limit,
      skip: offset,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
}
