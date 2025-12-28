import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  async getSalesAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSalesAnalytics(startDate, endDate);
  }

  @Get('purchases')
  async getPurchaseAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getPurchaseAnalytics(startDate, endDate);
  }

  @Get('inventory')
  async getInventoryAnalytics() {
    return this.analyticsService.getInventoryAnalytics();
  }

  @Get('profit')
  async getProfitAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getProfitAnalytics(startDate, endDate);
  }

  @Get('dashboard')
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('product/:id')
  async getProductAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const productId = parseInt(id, 10);
    if (!productId || isNaN(productId)) {
      throw new Error('Invalid product ID');
    }
    console.log(`Fetching analytics for product ID: ${productId}`);
    try {
      const result = await this.analyticsService.getProductAnalytics(productId, startDate, endDate);
      return result;
    } catch (error) {
      console.error('Error in getProductAnalytics:', error);
      throw error;
    }
  }
}
