import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [RentalsController],
  providers: [RentalsService],
})
export class RentalsModule {}
