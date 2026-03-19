import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { PrismaModule } from 'src/services/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ItemsService],
  exports: [ItemsService],
  controllers: [ItemsController],
})
export class ItemsModule {}
