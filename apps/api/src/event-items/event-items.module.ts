import { Module } from '@nestjs/common';
import { EventItemsService } from './event-items.service';
import { EventItemsController } from './event-items.controller';

@Module({
  controllers: [EventItemsController],
  providers: [EventItemsService],
})
export class EventItemsModule {}
