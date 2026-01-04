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
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('inStock') inStock?: string,
  ) {
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    const inStockBool = inStock === 'true' ? true : inStock === 'false' ? false : undefined;
    return this.productService.getProducts(+limit, +offset, {
      categoryId: categoryIdNum,
      search,
      inStock: inStockBool,
    });
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

  @Get('categories/all')
  @Roles('ADMIN', 'CASHIER', 'MANAGER')
  @UseGuards(RolesGuard)
  async getAllCategories() {
    return this.productService.getAllCategories();
  }

  @Get('categories/:categoryId/summary')
  @Roles('ADMIN', 'CASHIER', 'MANAGER')
  @UseGuards(RolesGuard)
  async getCategorySummary(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productService.getCategorySummary(categoryId);
  }

  @Get(':id/suppliers')
  @Roles('ADMIN', 'MANAGER', 'PROCUREMENT')
  @UseGuards(RolesGuard)
  async getProductSuppliers(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.getProductSuppliers(id);
  }

  // SKU utility endpoints
  @Get('sku/codes')
  @Roles('ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  async getAvailableSKUCodes() {
    return this.productService.getAvailableSKUCodes();
  }

  @Get('sku/generate')
  @Roles('ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  async generateSKU(
    @Query('category') categoryName: string,
    @Query('supplier') supplierName?: string,
    @Query('variant') variant?: string,
  ) {
    const sku = await this.productService.generateProductSKU(categoryName, supplierName, variant);
    return { sku };
  }

  @Get('sku/parse/:sku')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @UseGuards(RolesGuard)
  async parseSKU(@Param('sku') sku: string) {
    const components = this.productService.parseProductSKU(sku);
    return { sku, components };
  }

  @Get('sku/validate/:sku')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @UseGuards(RolesGuard)
  async validateSKU(@Param('sku') sku: string) {
    const isValid = this.productService.validateSKU(sku);
    return { sku, isValid };
  }
}
