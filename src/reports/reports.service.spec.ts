import { Prisma } from '@prisma/client';

import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prismaMock = {
    sale: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    saleItem: {
      findMany: jest.fn(),
    },
    stockLog: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as any;

  let service: ReportsService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-10T12:00:00Z'));
    jest.clearAllMocks();
    service = new ReportsService(prismaMock);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns dashboard summary', async () => {
    prismaMock.sale.aggregate
      .mockResolvedValueOnce({ _sum: { totalAmount: new Prisma.Decimal(120) } }) // revenue
      .mockResolvedValueOnce({ _count: { id: 3 } }); // orders
    prismaMock.product.count.mockResolvedValue(2); // low stock
    prismaMock.saleItem.findMany.mockResolvedValue([
      {
        quantity: 2,
        unitPrice: new Prisma.Decimal(10),
        product: { costPrice: new Prisma.Decimal(5) },
      },
      {
        quantity: 1,
        unitPrice: new Prisma.Decimal(20),
        product: { costPrice: new Prisma.Decimal(8) },
      },
    ]);

    const result = await service.getDashboardSummary();

    expect(result).toEqual({
      todayRevenue: 120,
      totalOrders: 3,
      lowStock: 2,
      todayProfit: 22, // (10-5)*2 + (20-8)*1
    });

    expect(prismaMock.sale.aggregate).toHaveBeenCalledTimes(2);
    expect(prismaMock.product.count).toHaveBeenCalled();
    expect(prismaMock.saleItem.findMany).toHaveBeenCalled();
  });

  it('computes profit and loss', async () => {
    prismaMock.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: new Prisma.Decimal(200) } });
    prismaMock.saleItem.findMany.mockResolvedValue([
      { quantity: 2, product: { costPrice: new Prisma.Decimal(30) } },
      { quantity: 1, product: { costPrice: new Prisma.Decimal(50) } },
    ]);

    const result = await service.getProfitAndLoss({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });

    expect(result).toEqual({
      revenue: 200,
      cogs: 110, // 30*2 + 50*1
      grossProfit: 90,
    });
  });

  it('returns inventory value', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { stock: 5, costPrice: new Prisma.Decimal(10) },
      { stock: 2, costPrice: new Prisma.Decimal(25) },
    ]);

    const result = await service.getInventoryValue();

    expect(result).toEqual({ totalValue: 100 }); // 5*10 + 2*25
  });

  it('returns stock logs with pagination', async () => {
    prismaMock.stockLog.count.mockResolvedValue(4);
    prismaMock.stockLog.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await service.getStockLogs({ offset: 0, limit: 2 });

    expect(result).toEqual({
      total: 4,
      offset: 0,
      limit: 2,
      data: [{ id: 1 }, { id: 2 }],
    });

    expect(prismaMock.stockLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 2 }),
    );
  });
});

