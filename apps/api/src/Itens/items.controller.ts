import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { ItemsService } from './items.service';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  async create(@Body() createItemDto: CreateItemInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.itemsService.create(createItemDto, user.tenantUuid);
  }

  @Get()
  async findAll(@Req() req: Request, @Query('search') search?: string) {
    const user = (req as any).user;
    return this.itemsService.findAll(user.tenantUuid, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.itemsService.findOne(id, user.tenantUuid);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.itemsService.update(id, updateItemDto, user.tenantUuid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.itemsService.remove(id, user.tenantUuid);
  }
}
