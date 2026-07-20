import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { MaintenanceModule } from 'src/maintenance/maintenance.module';
import { RolesGuard } from 'src/auth/roles.guard';
import { DivergencesController } from './divergences.controller';
import { DivergencesService } from './divergences.service';

@Module({
  imports: [PrismaModule, MaintenanceModule],
  controllers: [DivergencesController],
  providers: [DivergencesService, RolesGuard],
  exports: [DivergencesService],
})
export class DivergencesModule {}
