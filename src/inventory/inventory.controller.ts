import { Body, Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { InventoryService } from './inventory.service';
import { AuthGuard } from 'src/auth/guards/auth.gaurd';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';

@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============ STOCK OPERATIONS ============

  @Post('stock/in')
  @Roles(Role.ADMIN, Role.MANAGER)
  async stockIn(@Body() stockInDto: StockInDto, @Req() request: Request) {
    const userId = (request as any).user?.id || (request as any).user?.sub;
    return this.inventoryService.stockIn(stockInDto, userId);
  }

  @Post('stock/out')
  @Roles(Role.ADMIN, Role.MANAGER)
  async stockOut(@Body() stockOutDto: StockOutDto, @Req() request: Request) {
    const userId = (request as any).user?.id || (request as any).user?.sub;
    return this.inventoryService.stockOut(stockOutDto, userId);
  }

  @Get('logs')
  async getStockLogs(
    @Query('productId') productId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getStockLogs(
      productId ? parseInt(productId, 10) : undefined,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('logs/:productId')
  async getProductStockHistory(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getProductStockHistory(
      parseInt(productId, 10),
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ============ INVENTORY MONITORING ============

  @Get('low-stock')
  async getLowStockProducts(
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getLowStockProducts(
      threshold ? parseInt(threshold) : 10,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('summary')
  async getInventorySummary() {
    return this.inventoryService.getInventorySummary();
  }
}
