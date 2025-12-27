import { Controller, Post, Get, Param, Body, UseGuards, Delete, Patch, ParseIntPipe, Query, Inject } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { SupplierService } from 'src/supplier/supplier.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly supplierService: SupplierService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  @Roles('ADMIN', 'CASHIER', 'MANAGER')
  @UseGuards(RolesGuard)
  async getProducts(
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.productService.getProducts(+limit, +offset);
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER', 'MANAGER')
  @UseGuards(RolesGuard)
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }

  @Get('category/:categoryId')
  @Roles('ADMIN', 'CASHIER', 'MANAGER')
  @UseGuards(RolesGuard)
  async getProductsByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productService.getProductsByCategory(categoryId);
  }

  @Get(':id/suppliers')
  @Roles('ADMIN', 'MANAGER', 'PROCUREMENT')
  @UseGuards(RolesGuard)
  async getProductSuppliers(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.getProductSuppliers(id);
  }
}
