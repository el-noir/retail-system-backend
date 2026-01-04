import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/prisma.service';
import { SupplierModule } from 'src/supplier/supplier.module';
import { SKUGeneratorService } from './sku-generator.service';

@Module({
  imports: [SupplierModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService, SKUGeneratorService],
  exports: [ProductService, SKUGeneratorService],
})
export class ProductModule {}
