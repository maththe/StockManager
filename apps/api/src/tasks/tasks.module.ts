import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { RolesGuard } from '../auth/roles.guard';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [TasksService, RolesGuard],
  exports: [TasksService],
})
export class TasksModule {}
