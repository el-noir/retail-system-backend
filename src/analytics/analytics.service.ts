import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSalesAnalytics(startDate?: string, endDate?: string, categoryId?: number) {
    const dateFilter: Prisma.SaleWhereInput = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Add category filter if provided
    if (categoryId) {
      dateFilter.items = {
        some: {
          product: {
            categoryId: categoryId,
          },
        },
      };
    }

    // Get all sales with items
    const sales = await this.prisma.sale.findMany({
      where: dateFilter,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount.toNumber(), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top products by quantity sold
    const productSales = new Map<number, { product: any; quantity: number; revenue: number }>();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productSales.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice.toNumber();
        } else {
          productSales.set(item.productId, {
            product: item.product,
            quantity: item.quantity,
            revenue: item.totalPrice.toNumber(),
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(p => ({
        productId: p.product.id.toString(),
        name: p.product.name,
        quantitySold: p.quantity,
        revenue: p.revenue,
      }));

    // Sales by date
    const salesByDate = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
        existing.revenue += sale.totalAmount.toNumber();
      } else {
        acc.push({
          date,
          count: 1,
          revenue: sale.totalAmount.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ date: string; count: number; revenue: number }>);

    salesByDate.sort((a, b) => a.date.localeCompare(b.date));

    // Sales by payment method
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      const existing = acc.find(item => item.method === sale.paymentMethod);
      if (existing) {
        existing.count++;
        existing.amount += sale.totalAmount.toNumber();
      } else {
        acc.push({
          method: sale.paymentMethod,
          count: 1,
          amount: sale.totalAmount.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ method: string; count: number; amount: number }>);

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      topProducts,
      salesByDate,
      salesByPaymentMethod,
    };
  }

  async getPurchaseAnalytics(startDate?: string, endDate?: string, categoryId?: number) {
    const dateFilter: Prisma.PurchaseOrderWhereInput = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Add category filter if provided
    if (categoryId) {
      dateFilter.items = {
        some: {
          product: {
            categoryId: categoryId,
          },
        },
      };
    }

    // Add category filter if provided
    if (categoryId) {
      dateFilter.items = {
        some: {
          product: {
            categoryId: categoryId,
          },
        },
      };
    }

    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: dateFilter,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalPurchases = purchaseOrders.length;
    const totalSpent = purchaseOrders.reduce((sum, po) => sum + po.totalAmount.toNumber(), 0);

    // Top suppliers by spending
    const supplierSpending = new Map<string, { supplier: any; totalSpent: number; orderCount: number }>();
    purchaseOrders.forEach(po => {
      const existing = supplierSpending.get(po.supplierId);
      if (existing) {
        existing.totalSpent += po.totalAmount.toNumber();
        existing.orderCount++;
      } else {
        supplierSpending.set(po.supplierId, {
          supplier: po.supplier,
          totalSpent: po.totalAmount.toNumber(),
          orderCount: 1,
        });
      }
    });

    const topSuppliers = Array.from(supplierSpending.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(s => ({
        supplierId: s.supplier.id,
        name: s.supplier.name,
        totalSpent: s.totalSpent,
        orderCount: s.orderCount,
      }));

    // Purchases by date
    const purchasesByDate = purchaseOrders.reduce((acc, po) => {
      const date = po.createdAt.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
        existing.amount += po.totalAmount.toNumber();
      } else {
        acc.push({
          date,
          count: 1,
          amount: po.totalAmount.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ date: string; count: number; amount: number }>);

    purchasesByDate.sort((a, b) => a.date.localeCompare(b.date));

    // Purchases by status
    const purchasesByStatus = purchaseOrders.reduce((acc, po) => {
      const existing = acc.find(item => item.status === po.status);
      if (existing) {
        existing.count++;
        existing.amount += po.totalAmount.toNumber();
      } else {
        acc.push({
          status: po.status,
          count: 1,
          amount: po.totalAmount.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ status: string; count: number; amount: number }>);

    return {
      totalPurchases,
      totalSpent,
      topSuppliers,
      purchasesByDate,
      purchasesByStatus,
    };
  }

  async getInventoryAnalytics(categoryId?: number) {
    const whereCondition: Prisma.ProductWhereInput = {};
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    const products = await this.prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
      },
    });

    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => {
      return sum + (p.stock * p.price.toNumber());
    }, 0);
    const lowStockCount = products.filter(p => p.stock <= (p.reorderLevel || 10)).length;

    // Get sales data to determine top selling products
    const salesDataWhere: Prisma.SaleItemWhereInput = {};
    if (categoryId) {
      salesDataWhere.product = {
        categoryId: categoryId,
      };
    }

    const salesData = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: salesDataWhere,
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const topSellingProducts = await Promise.all(
      salesData.map(async (item) => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId.toString(),
          name: product?.name || 'Unknown',
          quantitySold: item._sum.quantity || 0,
          currentStock: product?.stock || 0,
        };
      })
    );

    // Products by category
    const productsByCategory = products.reduce((acc, product) => {
      const categoryName = product.category?.name || 'Uncategorized';
      const existing = acc.find(item => item.category === categoryName);
      if (existing) {
        existing.count++;
        existing.stockValue += product.stock * product.price.toNumber();
      } else {
        acc.push({
          category: categoryName,
          count: 1,
          stockValue: product.stock * product.price.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ category: string; count: number; stockValue: number }>);

    return {
      totalProducts,
      totalStockValue,
      lowStockCount,
      topSellingProducts,
      productsByCategory,
    };
  }

  async getProfitAnalytics(startDate?: string, endDate?: string, categoryId?: number) {
    const dateFilter: Prisma.SaleWhereInput = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Add category filter if provided
    if (categoryId) {
      dateFilter.items = {
        some: {
          product: {
            categoryId: categoryId,
          },
        },
      };
    }

    // Add category filter if provided
    if (categoryId) {
      dateFilter.items = {
        some: {
          product: {
            categoryId: categoryId,
          },
        },
      };
    }

    const sales = await this.prisma.sale.findMany({
      where: dateFilter,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const profitByProduct = new Map<number, { product: any; revenue: number; cost: number; profit: number }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const revenue = item.totalPrice.toNumber();
        // Use actual cost from sale item if available (new system), otherwise fallback to product cost price (old data)
        const cost = item.totalCost 
          ? item.totalCost.toNumber() 
          : item.quantity * (item.product.costPrice?.toNumber() || 0);
        
        totalRevenue += revenue;
        totalCost += cost;

        const existing = profitByProduct.get(item.productId);
        if (existing) {
          existing.revenue += revenue;
          existing.cost += cost;
          existing.profit += (revenue - cost);
        } else {
          profitByProduct.set(item.productId, {
            product: item.product,
            revenue,
            cost,
            profit: revenue - cost,
          });
        }
      });
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const profitByProductArray = Array.from(profitByProduct.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(p => ({
        productId: p.product.id.toString(),
        name: p.product.name,
        revenue: p.revenue,
        cost: p.cost,
        profit: p.profit,
        margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }));

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      profitByProduct: profitByProductArray,
    };
  }

  async getDashboardSummary() {
    // Get current month data
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      salesCount,
      monthRevenue,
      purchaseCount,
      monthSpending,
      lowStockProducts,
      totalProducts,
    ] = await Promise.all([
      this.prisma.sale.count(),
      this.prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrder.aggregate({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.product.count({
        where: {
          stock: {
            lte: 10, // Consider low stock if <= 10 units
          },
        },
      }),
      this.prisma.product.count(),
    ]);

    return {
      totalSales: salesCount,
      monthlyRevenue: monthRevenue._sum?.totalAmount?.toNumber() || 0,
      totalPurchases: purchaseCount,
      monthlySpending: monthSpending._sum?.totalAmount?.toNumber() || 0,
      lowStockCount: lowStockProducts,
      totalProducts,
    };
  }

  async getProductAnalytics(productId: number, startDate?: string, endDate?: string) {
    // Get product details
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const dateFilter: any = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Get sales data for this product
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        productId,
        sale: dateFilter,
      },
      include: {
        sale: true,
      },
      orderBy: {
        sale: {
          createdAt: 'desc',
        },
      },
    });

    // Calculate sales metrics
    const totalUnitsSold = saleItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = saleItems.reduce((sum, item) => sum + item.totalPrice.toNumber(), 0);
    // Calculate totals from sale items - use actual cost if available
    let totalCost = 0;
    saleItems.forEach(item => {
      if (item.totalCost) {
        totalCost += item.totalCost.toNumber();
      } else {
        // Fallback for old data without cost tracking
        totalCost += item.quantity * (product.costPrice?.toNumber() || 0);
      }
    });
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Sales by date
    const salesByDate = saleItems.reduce((acc, item) => {
      const date = item.sale.createdAt.toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice.toNumber();
      } else {
        acc.push({
          date,
          quantity: item.quantity,
          revenue: item.totalPrice.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ date: string; quantity: number; revenue: number }>);

    salesByDate.sort((a, b) => a.date.localeCompare(b.date));

    // Get purchase/restock data
    const purchaseItems = await this.prisma.purchaseItem.findMany({
      where: {
        productId,
        purchaseOrder: dateFilter,
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalUnitsRestocked = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRestockCost = purchaseItems.reduce((sum, item) => sum + item.totalPrice.toNumber(), 0);

    // Restock by date
    const restockByDate = purchaseItems.reduce((acc, item) => {
      const date = item.purchaseOrder.createdAt.toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.quantity += item.quantity;
        existing.cost += item.totalPrice.toNumber();
      } else {
        acc.push({
          date,
          quantity: item.quantity,
          cost: item.totalPrice.toNumber(),
        });
      }
      return acc;
    }, [] as Array<{ date: string; quantity: number; cost: number }>);

    restockByDate.sort((a, b) => a.date.localeCompare(b.date));

    // Get stock movement history
    const stockLogs = await this.prisma.stockLog.findMany({
      where: {
        productId,
        ...dateFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const stockMovements = stockLogs.map(log => ({
      id: log.id,
      type: log.type,
      quantity: log.quantity,
      reason: log.reason,
      unitCost: log.unitCost?.toNumber() || null,
      createdBy: log.createdByUser?.name || 'System',
      createdAt: log.createdAt.toISOString(),
    }));

    // Suppliers for this product
    const suppliers = await this.prisma.supplierProduct.findMany({
      where: { productId },
      include: {
        supplier: true,
      },
    });

    const supplierList = suppliers.map(sp => ({
      supplierId: sp.supplierId,
      name: sp.supplier.name,
      supplierSku: sp.supplierSku,
      price: sp.supplierPrice.toNumber(),
      isAvailable: sp.isAvailable,
      isPrimary: sp.isPrimarySupplier,
      leadTimeDays: sp.leadTimeDays,
      minOrderQty: sp.minOrderQty,
    }));

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: {
          id: product.category?.id || null,
          name: product.category?.name || 'Uncategorized',
        },
        currentStock: product.stock,
        costPrice: product.costPrice.toNumber(),
        sellingPrice: product.price.toNumber(),
        reorderLevel: product.reorderLevel,
        reorderQty: product.reorderQty,
      },
      salesMetrics: {
        totalUnitsSold,
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        averageSellingPrice: totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0,
        salesCount: saleItems.length,
      },
      purchaseMetrics: {
        totalUnitsRestocked,
        totalRestockCost,
        averageRestockPrice: totalUnitsRestocked > 0 ? totalRestockCost / totalUnitsRestocked : 0,
        purchaseCount: purchaseItems.length,
      },
      salesByDate,
      restockByDate,
      stockMovements,
      suppliers: supplierList,
    };
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
    }));
  }

  async getCategoryAnalytics(categoryId: number, startDate?: string, endDate?: string) {
    // Get category details
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const dateFilter: any = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // Get sales analytics for this category
    const salesAnalytics = await this.getSalesAnalytics(startDate, endDate, categoryId);
    
    // Get inventory analytics for this category
    const inventoryAnalytics = await this.getInventoryAnalytics(categoryId);
    
    // Get profit analytics for this category
    const profitAnalytics = await this.getProfitAnalytics(startDate, endDate, categoryId);

    // Get purchase analytics for this category
    const purchaseAnalytics = await this.getPurchaseAnalytics(startDate, endDate, categoryId);

    // Get category-specific products performance
    const products = await this.prisma.product.findMany({
      where: { categoryId },
      include: {
        _count: {
          select: {
            saleItems: {
              where: {
                sale: dateFilter,
              },
            },
          },
        },
      },
    });

    const categoryProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      price: product.price.toNumber(),
      costPrice: product.costPrice?.toNumber() || 0,
      salesCount: product._count.saleItems,
      stockValue: product.stock * product.price.toNumber(),
    }));

    return {
      category: {
        id: category.id,
        name: category.name,
        productCount: category._count.products,
      },
      salesAnalytics,
      inventoryAnalytics,
      profitAnalytics,
      purchaseAnalytics,
      products: categoryProducts,
    };
  }
}
