import { Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DivergenceStatus } from '@prisma/client';
import { DivergencesService } from './divergences.service';

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

  @Patch(':id/resolver')
  resolver(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.divergencesService.resolver(id, user.tenantUuid, user.sub);
  }
}
