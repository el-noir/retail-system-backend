import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierProductDto, UpdateSupplierProductDto, BulkAddProductsDto } from './dto/supplier-product.dto';
import { AuthGuard } from 'src/auth/guards/auth.gaurd';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('suppliers')
@UseGuards(AuthGuard, RolesGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.supplierService.findAll(
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.supplierService.remove(id);
  }

  // ============ SUPPLIER PRODUCT ENDPOINTS ============

  @Post('products')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  addProductToSupplier(@Body() dto: CreateSupplierProductDto) {
    return this.supplierService.addProductToSupplier(dto);
  }

  @Post('products/bulk')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  bulkAddProducts(@Body() dto: BulkAddProductsDto) {
    return this.supplierService.bulkAddProducts(dto);
  }

  @Get(':supplierId/products')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  getSupplierProducts(@Param('supplierId') supplierId: string) {
    return this.supplierService.getSupplierProducts(supplierId);
  }

  @Patch('products/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  updateSupplierProduct(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierProductDto,
  ) {
    return this.supplierService.updateSupplierProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  removeProductFromSupplier(@Param('id') id: string) {
    return this.supplierService.removeProductFromSupplier(id);
  }

  @Get('recommendations/low-stock')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  getLowStockRecommendations() {
    return this.supplierService.getLowStockRecommendations();
  }
}
