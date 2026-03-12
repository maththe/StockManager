import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { InventoryModule } from './inventory/inventory.module';
import { EventItemsModule } from './event-items/event-items.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    InventoryModule,
    EventItemsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
