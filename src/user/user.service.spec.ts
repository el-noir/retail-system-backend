import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const mockPrisma = { user: { findUnique: jest.fn(), create: jest.fn() } } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
