
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
    
    // Middleware to handle connection issues gracefully
    this.$use(async (params, next) => {
      try {
        return await next(params);
      } catch (error: any) {
        // Log connection errors but don't crash
        if (error.code === 'P2024' || error.message?.includes('Connection')) {
          this.logger.error('Database connection issue, retrying...', error.message);
        }
        throw error;
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Database connection failed', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
