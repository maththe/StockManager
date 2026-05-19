import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { RolesGuard } from '../auth/roles.guard';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [EventsController],
  providers: [EventsService, RolesGuard],
  exports: [EventsService],
})
export class EventsModule {}
