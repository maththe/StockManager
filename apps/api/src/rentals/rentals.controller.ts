import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateRentalInput } from './dto/create-rental.input';
import { CreateRentalItemInput } from './dto/create-rental-item.input';
import { UpdateRentalInput } from './dto/update-rental.input';
import { UpdateRentalItemInput } from './dto/update-rental-item.input';
import { RentalsService } from './rentals.service';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  async create(@Body() createRentalDto: CreateRentalInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.create(createRentalDto, user.tenantUuid);
  }

  @Get()
  async findAll(@Req() req: Request, @Query('search') search?: string) {
    const user = (req as any).user;
    return this.rentalsService.findAll(user.tenantUuid, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.findOne(id, user.tenantUuid);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.update(id, updateRentalDto, user.tenantUuid);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.cancel(id, user.tenantUuid);
  }

  @Patch(':id/return')
  async markReturned(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.markReturned(id, user.tenantUuid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.remove(id, user.tenantUuid);
  }

  @Post(':id/items')
  async addItem(@Param('id') id: string, @Body() dto: CreateRentalItemInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.addItem(id, dto, user.tenantUuid);
  }

  @Patch(':id/items/:rentalItemId')
  async updateItem(
    @Param('id') id: string,
    @Param('rentalItemId') rentalItemId: string,
    @Body() dto: UpdateRentalItemInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.rentalsService.updateItem(id, rentalItemId, dto, user.tenantUuid);
  }

  @Delete(':id/items/:rentalItemId')
  async removeItem(@Param('id') id: string, @Param('rentalItemId') rentalItemId: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.rentalsService.removeItem(id, rentalItemId, user.tenantUuid);
  }
}
