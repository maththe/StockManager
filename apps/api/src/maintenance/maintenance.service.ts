import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceStatus, MaintenanceType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { CreateMaintenanceInput } from './dto/create-maintenance.input';
import { UpdateMaintenanceInput } from './dto/update-maintenance.input';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(tenantUuid: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MAN-${year}-`;

    const last = await this.prisma.maintenance.findFirst({
      where: { tenantUuid, code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNumber = 1;
    if (last) {
      const match = last.code.match(/-(\d+)$/);
      if (match) {
        nextNumber = Number.parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser um inteiro maior que zero.');
    }
  }

  private validateType(type: MaintenanceType | undefined | null) {
    if (type == null) return;
    if (!Object.values(MaintenanceType).includes(type)) {
      throw new BadRequestException('Tipo de manutenção inválido.');
    }
  }

  private async ensureAssignedUserBelongsToTenant(assignedToId: string | null | undefined, tenantUuid: string) {
    if (!assignedToId) return;

    const user = await this.prisma.user.findFirst({ where: { id: assignedToId, tenantUuid } });
    if (!user) {
      throw new BadRequestException('Responsável não encontrado ou sem permissão.');
    }
  }

  // Criação automática a partir de DivergenceItems DAMAGED.
  // Não altera estoque — já foi ajustado na conclusão do evento.
  async createFromDivergence(
    divergenceId: string,
    damagedItems: { itemId: string; quantity: number }[],
    tenantUuid: string,
    tx: Prisma.TransactionClient,
    createdById?: string,
  ) {
    const results: Awaited<ReturnType<typeof tx.maintenance.create>>[] = [];

    for (const di of damagedItems) {
      const code = await this.generateCode(tenantUuid);
      const maintenance = await tx.maintenance.create({
        data: {
          code,
          tenantUuid,
          itemId: di.itemId,
          quantity: di.quantity,
          type: MaintenanceType.REPARO,
          divergenceId,
          createdById: createdById ?? null,
        },
      });
      results.push(maintenance);
    }

    return results;
  }

  async create(input: CreateMaintenanceInput, tenantUuid: string, createdById?: string) {
    this.validateQuantity(input.quantity);
    this.validateType(input.type);
    await this.ensureAssignedUserBelongsToTenant(input.assignedToId, tenantUuid);

    const item = await this.prisma.item.findFirst({ where: { id: input.itemId, tenantUuid } });
    if (!item) throw new NotFoundException('Item não encontrado.');

    if (item.availableQuantity < input.quantity) {
      throw new BadRequestException('Estoque insuficiente para criar a manutenção.');
    }

    const code = await this.generateCode(tenantUuid);

    return this.prisma.$transaction(async (tx) => {
      const reserved = await tx.item.updateMany({
        where: { id: input.itemId, tenantUuid, availableQuantity: { gte: input.quantity } },
        data: { availableQuantity: { decrement: input.quantity } },
      });

      if (reserved.count !== 1) {
        throw new BadRequestException('Estoque insuficiente para criar a manutenção.');
      }

      return tx.maintenance.create({
        data: {
          code,
          tenantUuid,
          itemId: input.itemId,
          quantity: input.quantity,
          type: input.type ?? MaintenanceType.OUTRA,
          notes: input.notes,
          assignedToId: input.assignedToId ?? null,
          createdById: createdById ?? null,
        },
        include: {
          item: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });
    });
  }

  async findAll(tenantUuid: string, status?: MaintenanceStatus) {
    return this.prisma.maintenance.findMany({
      where: {
        tenantUuid,
        ...(status ? { status } : {}),
      },
      include: {
        item: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        divergence: { select: { id: true, source: true, sourceId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantUuid: string) {
    const m = await this.prisma.maintenance.findFirst({
      where: { id, tenantUuid },
      include: {
        item: { select: { id: true, name: true, availableQuantity: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        divergence: { select: { id: true, source: true, sourceId: true, notes: true } },
      },
    });

    if (!m) throw new NotFoundException('Manutenção não encontrada.');
    return m;
  }

  async update(id: string, input: UpdateMaintenanceInput, tenantUuid: string) {
    const m = await this.prisma.maintenance.findFirst({ where: { id, tenantUuid } });
    if (!m) throw new NotFoundException('Manutenção não encontrada.');

    if (m.status === MaintenanceStatus.CONCLUIDA || m.status === MaintenanceStatus.CANCELADA) {
      throw new BadRequestException('Não é possível editar uma manutenção encerrada.');
    }

    this.validateType(input.type);
    await this.ensureAssignedUserBelongsToTenant(input.assignedToId, tenantUuid);

    const advanceToInProgress =
      m.status === MaintenanceStatus.PENDENTE &&
      input.assignedToId !== undefined &&
      input.assignedToId !== null;

    return this.prisma.maintenance.update({
      where: { id },
      data: {
        notes: input.notes,
        ...(input.type !== undefined ? { type: input.type } : {}),
        assignedToId: input.assignedToId,
        ...(advanceToInProgress ? { status: MaintenanceStatus.EM_ANDAMENTO } : {}),
      },
      include: {
        item: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async concluir(id: string, tenantUuid: string) {
    const m = await this.prisma.maintenance.findFirst({ where: { id, tenantUuid } });
    if (!m) throw new NotFoundException('Manutenção não encontrada.');

    if (m.status === MaintenanceStatus.CONCLUIDA) {
      throw new BadRequestException('Esta manutenção já está concluída.');
    }
    if (m.status === MaintenanceStatus.CANCELADA) {
      throw new BadRequestException('Não é possível concluir uma manutenção cancelada.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Se veio de divergência: restaura availableQuantity e totalQuantity (item reparado)
      // Se manual: restaura apenas availableQuantity (foi decrementado na criação)
      if (m.divergenceId) {
        await tx.item.update({
          where: { id: m.itemId },
          data: {
            availableQuantity: { increment: m.quantity },
            totalQuantity: { increment: m.quantity },
          },
        });
      } else {
        await tx.item.update({
          where: { id: m.itemId },
          data: { availableQuantity: { increment: m.quantity } },
        });
      }

      return tx.maintenance.update({
        where: { id },
        data: { status: MaintenanceStatus.CONCLUIDA, completedAt: new Date() },
        include: {
          item: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });
    });
  }

  async cancelar(id: string, tenantUuid: string) {
    const m = await this.prisma.maintenance.findFirst({ where: { id, tenantUuid } });
    if (!m) throw new NotFoundException('Manutenção não encontrada.');

    if (m.status === MaintenanceStatus.CANCELADA) {
      throw new BadRequestException('Esta manutenção já está cancelada.');
    }
    if (m.status === MaintenanceStatus.CONCLUIDA) {
      throw new BadRequestException('Não é possível cancelar uma manutenção já concluída.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Manutenção manual cancelada: devolve availableQuantity
      // Manutenção de divergência cancelada: sem mudança (item continua "perdido")
      if (!m.divergenceId) {
        await tx.item.update({
          where: { id: m.itemId },
          data: { availableQuantity: { increment: m.quantity } },
        });
      }

      return tx.maintenance.update({
        where: { id },
        data: { status: MaintenanceStatus.CANCELADA },
        include: {
          item: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });
    });
  }
}
