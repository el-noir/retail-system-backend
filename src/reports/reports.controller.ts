import { Controller, Get, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { DateRangeDto } from './dto/date-range.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('sales')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSales(@Query() range: DateRangeDto) {
    return this.reportsService.getSalesReport(range);
  }

  @Get('pnl')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getProfitAndLoss(@Query() range: DateRangeDto) {
    return this.reportsService.getProfitAndLoss(range);
  }

  @Get('inventory-value')
  async getInventoryValue() {
    return this.reportsService.getInventoryValue();
  }

  @Get('stock-logs')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getStockLogs(@Query() pagination: PaginationDto) {
    return this.reportsService.getStockLogs(pagination);
  }
}

