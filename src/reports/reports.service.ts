import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { GetReportDto } from './dto/get-report.dto';
import PDFDocument from 'pdfkit'; // <--- CHANGED: Removed '* as'
import { Parser } from 'json2csv';
import type { Response } from 'express'; // <--- CHANGED: Added 'type' keyword

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesToday = await this.prisma.sale.findMany({
      where: { createdAt: { gte: today } },
      include: { items: { include: { product: true } } },
    });

    const totalRevenue = salesToday.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    let totalProfit = 0;
    for (const sale of salesToday) {
      for (const item of sale.items) {
        const cost = Number(item.product.costPrice || 0);
        const revenue = Number(item.unitPrice);
        totalProfit += (revenue - cost) * item.quantity;
      }
    }

    const lowStockCount = await this.prisma.product.count({
      where: { stock: { lte: 10 } },
    });

    return {
      totalRevenue,
      totalProfit,
      lowStockCount,
      date: today,
    };
  }

  async getSalesReport(dto: GetReportDto) {
    const { startDate, endDate } = dto;
    return this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: { soldBy: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPnL(dto: GetReportDto) {
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(dto.startDate),
          lte: new Date(dto.endDate),
        },
      },
      include: { items: { include: { product: true } } },
    });

    let totalRevenue = 0;
    let cogs = 0;

    for (const sale of sales) {
      totalRevenue += Number(sale.totalAmount);
      for (const item of sale.items) {
        cogs += Number(item.product.costPrice || 0) * item.quantity;
      }
    }

    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit;

    return {
      totalRevenue,
      cogs,
      grossProfit,
      netProfit,
      period: { start: dto.startDate, end: dto.endDate },
    };
  }

  async getInventoryValuation() {
    const products = await this.prisma.product.findMany();
    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.costPrice || 0) * p.stock,
      0,
    );
    return {
      totalInventoryValue: totalValue,
      totalItems: products.reduce((sum, p) => sum + p.stock, 0),
    };
  }

  async getStockLogs() {
    return this.prisma.stockLog.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // --- PDF GENERATION LOGIC ---
  async generateSalesPdf(dto: GetReportDto, res: Response) {
    const sales = await this.getSalesReport(dto);
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('StoreMaster Sales Report', { align: 'center' });
    doc.fontSize(12).text(`Period: ${dto.startDate} to ${dto.endDate}`, { align: 'center' });
    doc.moveDown();

    // Table Header
    const yStart = doc.y;
    doc.text('Invoice', 50, yStart);
    doc.text('Date', 150, yStart);
    doc.text('Customer', 300, yStart);
    doc.text('Total', 450, yStart);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Rows
    let totalRevenue = 0;
    sales.forEach((sale) => {
      const y = doc.y;
      if (y > 700) doc.addPage();

      doc.text(sale.invoiceNumber, 50, y);
      doc.text(sale.createdAt.toISOString().split('T')[0], 150, y);
      doc.text(sale.customerName || 'N/A', 300, y);
      doc.text(`$${Number(sale.totalAmount).toFixed(2)}`, 450, y);
      
      totalRevenue += Number(sale.totalAmount);
      doc.moveDown();
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'right' });

    doc.end();
  }

  // --- CSV GENERATION LOGIC ---
  async generateSalesCsv(dto: GetReportDto) {
    const sales = await this.getSalesReport(dto);
    
    // Flatten data for CSV
    const data = sales.map((sale) => ({
      Invoice: sale.invoiceNumber,
      Date: sale.createdAt.toISOString(),
      Customer: sale.customerName || 'N/A',
      Subtotal: sale.subtotal,
      Tax: sale.taxAmount,
      Discount: sale.discountAmount,
      Total: sale.totalAmount,
      PaymentMethod: sale.paymentMethod,
      Cashier: sale.soldBy?.name || 'Unknown',
    }));

    const fields = ['Invoice', 'Date', 'Customer', 'Subtotal', 'Tax', 'Discount', 'Total', 'PaymentMethod', 'Cashier'];
    const parser = new Parser({ fields });
    return parser.parse(data);
  }
}