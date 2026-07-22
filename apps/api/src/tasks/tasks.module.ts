import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { EventCountModule } from 'src/events/event-count.module';
import { RentalCountModule } from 'src/rentals/rental-count.module';
import { RolesGuard } from '../auth/roles.guard';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule, EventCountModule, RentalCountModule],
  controllers: [TasksController],
  providers: [TasksService, RolesGuard],
  exports: [TasksService],
})
export class TasksModule {}
