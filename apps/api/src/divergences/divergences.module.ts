import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { DivergencesController } from './divergences.controller';
import { DivergencesService } from './divergences.service';

@Module({
  imports: [PrismaModule, MaintenanceModule],
  controllers: [DivergencesController],
  providers: [DivergencesService],
  exports: [DivergencesService],
})
export class DivergencesModule {}
