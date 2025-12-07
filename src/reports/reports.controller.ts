import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express'; // <--- CHANGED: Added 'type' keyword
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetReportDto } from './dto/get-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'MANAGER')
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('sales')
  @Roles('ADMIN', 'MANAGER')
  async getSalesReport(@Query() dto: GetReportDto) {
    return this.reportsService.getSalesReport(dto);
  }

  @Get('pnl')
  @Roles('ADMIN')
  async getPnL(@Query() dto: GetReportDto) {
    return this.reportsService.getPnL(dto);
  }

  @Get('inventory-value')
  @Roles('ADMIN', 'MANAGER')
  async getInventoryValuation() {
    return this.reportsService.getInventoryValuation();
  }

  @Get('stock-logs')
  @Roles('ADMIN', 'MANAGER')
  async getStockLogs() {
    return this.reportsService.getStockLogs();
  }

  // --- NEW EXPORT ENDPOINTS ---

  @Get('sales/export/pdf')
  @Roles('ADMIN', 'MANAGER')
  async exportSalesPdf(@Query() dto: GetReportDto, @Res() res: Response) {
    const filename = `sales_report_${Date.now()}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return this.reportsService.generateSalesPdf(dto, res);
  }

  @Get('sales/export/csv')
  @Roles('ADMIN', 'MANAGER')
  async exportSalesCsv(@Query() dto: GetReportDto, @Res() res: Response) {
    const filename = `sales_report_${Date.now()}.csv`;
    const csvData = await this.reportsService.generateSalesCsv(dto);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csvData);
  }
}