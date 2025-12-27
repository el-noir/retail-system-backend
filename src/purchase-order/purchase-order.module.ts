import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PrismaService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
