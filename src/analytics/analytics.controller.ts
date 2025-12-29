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
    @Query('categoryId') categoryId?: string,
  ) {
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.analyticsService.getSalesAnalytics(startDate, endDate, categoryIdNum);
  }

  @Get('purchases')
  async getPurchaseAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.analyticsService.getPurchaseAnalytics(startDate, endDate, categoryIdNum);
  }

  @Get('inventory')
  async getInventoryAnalytics(@Query('categoryId') categoryId?: string) {
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.analyticsService.getInventoryAnalytics(categoryIdNum);
  }

  @Get('profit')
  async getProfitAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.analyticsService.getProfitAnalytics(startDate, endDate, categoryIdNum);
  }

  @Get('dashboard')
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('categories')
  async getCategories() {
    return this.analyticsService.getCategories();
  }

  @Get('category/:id')
  async getCategoryAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const categoryId = parseInt(id, 10);
    if (!categoryId || isNaN(categoryId)) {
      throw new Error('Invalid category ID');
    }
    return this.analyticsService.getCategoryAnalytics(categoryId, startDate, endDate);
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
