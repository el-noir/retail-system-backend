import { Controller, Post, Get, Param, Body, UseGuards, Request, ParseIntPipe, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles('ADMIN', 'CASHIER')
  @UseGuards(RolesGuard)
  async createSale(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return this.salesService.createSale(createSaleDto, req.user.sub);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @UseGuards(RolesGuard)
  async getSales(
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.salesService.getSales(+limit, +offset);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @UseGuards(RolesGuard)
  async getSaleById(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.getSaleById(id);
  }

  @Get('invoice/:invoiceNumber')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @UseGuards(RolesGuard)
  async getSaleByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.salesService.getSaleByInvoiceNumber(invoiceNumber);
  }
}
