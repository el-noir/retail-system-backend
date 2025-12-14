import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { DateRangeDto } from './dto/date-range.dto';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    try {
      const { start, end } = this.getTodayRange();

      const [salesAgg, ordersAgg, lowStockCount, saleItems] = await Promise.all([
        this.prisma.sale.aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: start, lte: end } },
        }),
        this.prisma.sale.aggregate({
          _count: { id: true },
          where: { createdAt: { gte: start, lte: end } },
        }),
        this.prisma.product.count({
          where: { stock: { lte: 5 } },
        }),
        this.prisma.saleItem.findMany({
          where: {
            sale: {
              createdAt: { gte: start, lte: end },
            },
          },
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { costPrice: true } },
          },
        }),
      ]);

      const todayRevenue = this.toNumber(salesAgg._sum.totalAmount);
      const totalOrders = ordersAgg._count.id ?? 0;
      const todayProfit = saleItems.reduce((acc, item) => {
        const unitPrice = new Prisma.Decimal(item.unitPrice);
        const costPrice = new Prisma.Decimal(item.product.costPrice);
        return acc.plus(unitPrice.minus(costPrice).mul(item.quantity));
      }, new Prisma.Decimal(0));

      return {
        todayRevenue,
        totalOrders,
        lowStock: lowStockCount,
        todayProfit: this.toNumber(todayProfit),
      };
    } catch (error) {
      this.handlePrismaError(error, 'getDashboardSummary');
    }
  }

  async getSalesReport(range: DateRangeDto) {
    const { start, end } = this.normalizeRange(range);

    try {
      return await this.prisma.sale.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          items: true,
          soldBy: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handlePrismaError(error, 'getSalesReport');
    }
  }

  async getProfitAndLoss(range: DateRangeDto) {
    const { start, end } = this.normalizeRange(range);

    try {
      const [salesAgg, saleItems] = await Promise.all([
        this.prisma.sale.aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: start, lte: end } },
        }),
        this.prisma.saleItem.findMany({
          where: {
            sale: { createdAt: { gte: start, lte: end } },
          },
          select: {
            quantity: true,
            product: { select: { costPrice: true } },
          },
        }),
      ]);

      const revenue = this.toNumber(salesAgg._sum.totalAmount);
      const cogsDecimal = saleItems.reduce((acc, item) => {
        const costPrice = new Prisma.Decimal(item.product.costPrice);
        return acc.plus(costPrice.mul(item.quantity));
      }, new Prisma.Decimal(0));
      const cogs = this.toNumber(cogsDecimal);
      const grossProfit = this.toNumber(new Prisma.Decimal(revenue).minus(cogsDecimal));

      return {
        revenue,
        cogs,
        grossProfit,
      };
    } catch (error) {
      this.handlePrismaError(error, 'getProfitAndLoss');
    }
  }

  async getInventoryValue() {
    try {
      const products = await this.prisma.product.findMany({
        select: { stock: true, costPrice: true },
      });

      const totalValue = products.reduce((acc, product) => {
        const cost = new Prisma.Decimal(product.costPrice);
        return acc.plus(cost.mul(product.stock));
      }, new Prisma.Decimal(0));

      return { totalValue: this.toNumber(totalValue) };
    } catch (error) {
      this.handlePrismaError(error, 'getInventoryValue');
    }
  }

  async getStockLogs(pagination: PaginationDto) {
    const { offset = 0, limit = 50 } = pagination;

    try {
      const [total, logs] = await Promise.all([
        this.prisma.stockLog.count(),
        this.prisma.stockLog.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            user: true,
          },
        }),
      ]);

      return {
        total,
        offset,
        limit,
        data: logs,
      };
    } catch (error) {
      this.handlePrismaError(error, 'getStockLogs');
    }
  }

  private normalizeRange(range: DateRangeDto) {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const endInclusive = new Date(end);
    endInclusive.setHours(23, 59, 59, 999);

    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    return { start: startDay, end: endInclusive };
  }

  private getTodayRange() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private toNumber(value?: Prisma.Decimal | null) {
    return value ? new Prisma.Decimal(value).toNumber() : 0;
  }

  private handlePrismaError(error: unknown, context: string): never {
    this.logger.error(`ReportsService ${context} failed`, error as Error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new InternalServerErrorException('Database error');
    }
    throw error;
  }
}

