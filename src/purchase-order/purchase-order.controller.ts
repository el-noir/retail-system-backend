import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { AuthGuard } from 'src/auth/guards/auth.gaurd';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role, PurchaseStatus } from '@prisma/client';

@Controller('purchase-orders')
@UseGuards(AuthGuard, RolesGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  create(@Body() createDto: CreatePurchaseOrderDto, @Req() request: Request) {
    const userId = (request as any).user?.id || (request as any).user?.sub;
    return this.purchaseOrderService.create(createDto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  findAll(
    @Query('status') status?: PurchaseStatus,
    @Query('supplierId') supplierId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.purchaseOrderService.findAll(
      status,
      supplierId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('statistics')
  @Roles(Role.ADMIN, Role.MANAGER)
  getStatistics() {
    return this.purchaseOrderService.getStatistics();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  findOne(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  approve(@Param('id') id: string) {
    return this.purchaseOrderService.approve(id);
  }

  @Patch(':id/mark-paid')
  @Roles(Role.ADMIN, Role.MANAGER)
  markAsPaid(@Param('id') id: string) {
    return this.purchaseOrderService.markAsPaid(id);
  }

  @Patch(':id/items/:itemId/receive')
  @Roles(Role.ADMIN, Role.MANAGER, Role.PROCUREMENT)
  receiveGoods(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() receiveDto: ReceiveGoodsDto,
    @Req() request: Request,
  ) {
    const userId = (request as any).user?.id || (request as any).user?.sub;
    return this.purchaseOrderService.receiveGoods(id, itemId, receiveDto, userId);
  }

  @Patch(':id/close')
  @Roles(Role.ADMIN, Role.MANAGER)
  close(@Param('id') id: string) {
    return this.purchaseOrderService.close(id);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER)
  cancel(@Param('id') id: string) {
    return this.purchaseOrderService.cancel(id);
  }
}
