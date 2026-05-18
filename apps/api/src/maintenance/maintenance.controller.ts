import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { MaintenanceStatus } from '@prisma/client';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceInput } from './dto/create-maintenance.input';
import { UpdateMaintenanceInput } from './dto/update-maintenance.input';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  create(@Body() body: CreateMaintenanceInput, @Req() req: Request) {
    const user = (req as any).user;
    return this.maintenanceService.create(body, user.tenantUuid, user.sub);
  }

  @Get()
  findAll(@Req() req: Request, @Query('status') status?: MaintenanceStatus) {
    const { tenantUuid } = (req as any).user;
    return this.maintenanceService.findAll(tenantUuid, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.maintenanceService.findOne(id, tenantUuid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateMaintenanceInput, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.maintenanceService.update(id, body, tenantUuid);
  }

  @Patch(':id/concluir')
  concluir(@Param('id') id: string, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.maintenanceService.concluir(id, tenantUuid);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.maintenanceService.cancelar(id, tenantUuid);
  }
}
