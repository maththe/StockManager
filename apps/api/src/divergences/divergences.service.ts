import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DivergenceStatus, DivergenceType } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { MaintenanceService } from 'src/maintenance/maintenance.service';

@Injectable()
export class DivergencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  async findAll(tenantUuid: string, status?: DivergenceStatus) {
    return this.prisma.divergence.findMany({
      where: {
        tenantUuid,
        ...(status ? { status } : {}),
      },
      include: {
        items: { include: { item: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async findOne(id: string, tenantUuid: string) {
    const d = await this.prisma.divergence.findFirst({
      where: { id, tenantUuid },
      include: {
        items: { include: { item: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        maintenances: { select: { id: true, code: true, status: true } },
      },
    });

    if (!d) throw new NotFoundException('Divergência não encontrada.');
    return d;
  }

  async resolver(id: string, tenantUuid: string, resolvedById?: string) {
    const divergence = await this.prisma.divergence.findFirst({
      where: { id, tenantUuid },
      include: { items: true },
    });

    if (!divergence) throw new NotFoundException('Divergência não encontrada.');

    if (divergence.status === DivergenceStatus.RESOLVED) {
      throw new BadRequestException('Esta divergência já foi resolvida.');
    }

    const damagedItems = divergence.items
      .filter((i) => i.type === DivergenceType.DAMAGED)
      .map((i) => ({ itemId: i.itemId, quantity: i.quantity }));

    return this.prisma.$transaction(async (tx) => {
      const resolved = await tx.divergence.update({
        where: { id },
        data: {
          status: DivergenceStatus.RESOLVED,
          resolvedById: resolvedById ?? null,
          resolvedAt: new Date(),
        },
        include: {
          items: { include: { item: { select: { id: true, name: true } } } },
          resolvedBy: { select: { id: true, name: true } },
        },
      });

      if (damagedItems.length > 0) {
        await this.maintenanceService.createFromDivergence(
          id,
          damagedItems,
          tenantUuid,
          tx,
          resolvedById,
        );
      }

      return resolved;
    });
  }
}
