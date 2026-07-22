import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma.module';
import { RentalCountService } from './rental-count.service';

// Módulo mínimo, sem dependência de RentalsModule, para o TasksModule poder
// liquidar a devolução sem criar ciclo (RentalsModule já importa TasksModule).
@Module({
  imports: [PrismaModule],
  providers: [RentalCountService],
  exports: [RentalCountService],
})
export class RentalCountModule {}
