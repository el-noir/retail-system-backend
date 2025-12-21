import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/auth/guards/auth.gaurd';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, AuthGuard, RolesGuard],
  exports: [InventoryService],
})
export class InventoryModule {}
