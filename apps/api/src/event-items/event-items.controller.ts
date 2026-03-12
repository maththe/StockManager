import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventItemsService } from './event-items.service';
import { CreateEventItemDto } from './dto/create-event-item.dto';
import { UpdateEventItemDto } from './dto/update-event-item.dto';

@Controller('event-items')
export class EventItemsController {
  constructor(private readonly eventItemsService: EventItemsService) {}

  @Post()
  create(@Body() createEventItemDto: CreateEventItemDto) {
    return this.eventItemsService.create(createEventItemDto);
  }

  @Get()
  findAll() {
    return this.eventItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventItemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventItemDto: UpdateEventItemDto) {
    return this.eventItemsService.update(id, updateEventItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventItemsService.remove(id);
  }
}
