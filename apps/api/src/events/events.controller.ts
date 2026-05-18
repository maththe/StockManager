import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventsService } from './events.service';
import { CreateEventItemInput } from './dto/create-event-item.input';
import { UpdateEventItemInput } from './dto/update-event-item.input';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@Body() createEventDto: CreateEventInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.create(createEventDto, user.tenantUuid);
  }

  @Get()
  async findAll(@Req() req: Request, @Query('search') search?: string) {
    const user = (req as any).user;
    return this.eventsService.findAll(user.tenantUuid, search);
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
    return this.eventsService.update(id, updateEventDto, user.tenantUuid, user.sub);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.cancel(id, user.tenantUuid);
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.complete(id, user.tenantUuid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.remove(id, user.tenantUuid);
  }

  @Get(':id/items')
  async findItems(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.eventsService.findItems(id, user.tenantUuid);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') id: string,
    @Body() createEventItemDto: CreateEventItemInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.eventsService.addItem(id, createEventItemDto, user.tenantUuid);
  }

  @Patch(':id/items/:eventItemId')
  async updateItem(
    @Param('id') id: string,
    @Param('eventItemId') eventItemId: string,
    @Body() updateEventItemDto: UpdateEventItemInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.eventsService.updateItem(id, eventItemId, updateEventItemDto, user.tenantUuid);
  }

  @Delete(':id/items/:eventItemId')
  async removeItem(
    @Param('id') id: string,
    @Param('eventItemId') eventItemId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.eventsService.removeItem(id, eventItemId, user.tenantUuid);
  }
}
