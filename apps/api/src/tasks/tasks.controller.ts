import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { UpdateTaskInput } from './dto/update-task.input';
import { ConfirmTaskInput } from './dto/confirm-task.input';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Req() req: Request, @Query('status') status?: TaskStatus) {
    const { tenantUuid } = (req as any).user;
    return this.tasksService.findAll(tenantUuid, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.tasksService.findOne(id, tenantUuid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTaskInput, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.tasksService.update(id, body, tenantUuid);
  }

  @Patch(':id/concluir')
  concluir(@Param('id') id: string, @Body() body: ConfirmTaskInput, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.tasksService.concluir(id, body, tenantUuid);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.tasksService.cancelar(id, tenantUuid);
  }
}
