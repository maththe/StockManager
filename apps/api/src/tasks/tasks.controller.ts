import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TaskStatus, UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TasksService } from './tasks.service';
import { UpdateTaskInput } from './dto/update-task.input';
import { ConfirmTaskInput } from './dto/confirm-task.input';
import { CreatePartialTaskInput } from './dto/create-partial-task.input';

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

  @Post('evento/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DECORADOR)
  criarParcial(
    @Param('eventId') eventId: string,
    @Body() body: CreatePartialTaskInput,
    @Req() req: Request,
  ) {
    const { tenantUuid, sub } = (req as any).user;
    return this.tasksService.criarTaskParcial(eventId, body, tenantUuid, sub);
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
