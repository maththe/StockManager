import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@Body() createEventDto: CreateEventInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.create(createEventDto, user.tenantUuid);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.findAll(user.tenantUuid);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.findOne(id, user.tenantUuid);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.eventsService.update(id, updateEventDto, user.tenantUuid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.remove(id, user.tenantUuid);
  }
}
