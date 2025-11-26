import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
