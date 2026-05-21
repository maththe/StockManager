import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DivergenceStatus } from '@prisma/client';
import { DivergencesService } from './divergences.service';
import { CreateTaskDivergenceInput } from './dto/create-task-divergence.input';

@Controller('divergences')
export class DivergencesController {
  constructor(private readonly divergencesService: DivergencesService) {}

  @Get()
  findAll(@Req() req: Request, @Query('status') status?: DivergenceStatus) {
    const { tenantUuid } = (req as any).user;
    return this.divergencesService.findAll(tenantUuid, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const { tenantUuid } = (req as any).user;
    return this.divergencesService.findOne(id, tenantUuid);
  }

  @Post('tasks/:taskId')
  createFromTask(
    @Param('taskId') taskId: string,
    @Body() body: CreateTaskDivergenceInput,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.divergencesService.createFromTask(
      taskId,
      body,
      user.tenantUuid,
      user.sub,
    );
  }

  @Patch(':id/resolver')
  resolver(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.divergencesService.resolver(id, user.tenantUuid, user.sub);
  }
}
