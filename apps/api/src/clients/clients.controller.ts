import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(@Body() createClientDto: CreateClientInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.clientsService.create(createClientDto, user.tenantUuid);
  }

  @Get()
  async findAll(@Req() req: Request, @Query('search') search?: string) {
    const user = (req as any).user;
    return this.clientsService.findAll(user.tenantUuid, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.clientsService.findOne(id, user.tenantUuid);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.clientsService.update(id, updateClientDto, user.tenantUuid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.clientsService.remove(id, user.tenantUuid);
  }
}
