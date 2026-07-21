import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { EventCountService } from './event-count.service';

// Módulo isolado para quebrar o ciclo EventsModule <-> TasksModule:
// a liquidação da contagem é disparada pela conclusão da tarefa.
@Module({
  imports: [PrismaModule],
  providers: [EventCountService],
  exports: [EventCountService],
})
export class EventCountModule {}
