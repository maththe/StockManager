// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Optional: Makes Prisma available everywhere without re-importing the module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}