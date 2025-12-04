import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from 'src/prisma.service';

describe('SalesService', () => {
  let service: SalesService;
  const mockPrisma = {
    $transaction: jest.fn(),
    sale: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    saleItem: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createSale method', () => {
    expect(service.createSale).toBeDefined();
  });

  it('should have getSales method', () => {
    expect(service.getSales).toBeDefined();
  });

  it('should have getSaleById method', () => {
    expect(service.getSaleById).toBeDefined();
  });
});
