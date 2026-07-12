import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DivergenceSource,
  DivergenceStatus,
  DivergenceType,
  TaskStatus,
} from '@prisma/client';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { PrismaService } from 'src/services/prisma.service';
import { CreateTaskDivergenceInput } from './dto/create-task-divergence.input';

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
    const divergence = await this.prisma.divergence.findFirst({
      where: { id, tenantUuid },
      include: {
        items: { include: { item: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        maintenances: { select: { id: true, code: true, status: true } },
      },
    });

    if (!divergence) {
      throw new NotFoundException('Divergencia nao encontrada.');
    }

    return divergence;
  }

  async createFromTask(
    taskId: string,
    input: CreateTaskDivergenceInput,
    tenantUuid: string,
    createdById?: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, tenantUuid },
      include: {
        taskItems: {
          include: {
            eventItem: {
              include: {
                item: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa nao encontrada.');
    }

    if (!task.eventId) {
      throw new BadRequestException(
        'Divergencias so podem ser criadas a partir de tarefas de evento.',
      );
    }

    if (task.status !== TaskStatus.PENDENTE) {
      throw new BadRequestException(
        'So e possivel criar divergencia para tarefa pendente.',
      );
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException(
        'Informe ao menos um item para criar a divergencia.',
      );
    }

    const taskItemsById = new Map(
      task.taskItems.map((taskItem) => [taskItem.id, taskItem]),
    );
    const itemsById = new Map(input.items.map((item) => [item.taskItemId, item]));

    if (itemsById.size !== input.items.length) {
      throw new BadRequestException('Ha itens duplicados na divergencia.');
    }

    const divergenceItems: Array<{
      quantity: number;
      type: DivergenceType;
      notes?: string | null;
      tenantUuid: string;
      itemId: string;
      sourceItemId: string;
    }> = [];

    for (const item of input.items) {
      const taskItem = taskItemsById.get(item.taskItemId);

      if (!taskItem) {
        throw new BadRequestException(
          'Um dos itens informados nao pertence a tarefa.',
        );
      }

      // Tarefa de evento (garantido pelo guard acima): item sempre tem eventItem.
      if (!taskItem.eventItem || !taskItem.eventItemId) {
        throw new BadRequestException(
          'Um dos itens da tarefa nao pertence a um evento.',
        );
      }

      if (
        !Number.isInteger(item.confirmedQuantity) ||
        item.confirmedQuantity < 0 ||
        item.confirmedQuantity > taskItem.requestedQuantity
      ) {
        throw new BadRequestException(
          'Quantidade contada deve ser um inteiro entre zero e a quantidade solicitada.',
        );
      }

      const missingQuantity = item.missingQuantity ?? 0;
      const damagedQuantity = item.damagedQuantity ?? 0;

      if (!Number.isInteger(missingQuantity) || missingQuantity < 0) {
        throw new BadRequestException(
          'Quantidade faltante deve ser um inteiro maior ou igual a zero.',
        );
      }

      if (!Number.isInteger(damagedQuantity) || damagedQuantity < 0) {
        throw new BadRequestException(
          'Quantidade avariada deve ser um inteiro maior ou igual a zero.',
        );
      }

      if (missingQuantity === 0 && damagedQuantity === 0) {
        throw new BadRequestException(
          'Cada item da divergencia precisa ter falta ou avaria.',
        );
      }

      if (
        item.confirmedQuantity + missingQuantity + damagedQuantity !==
        taskItem.requestedQuantity
      ) {
        throw new BadRequestException(
          'A soma entre quantidade contada, faltante e avariada deve ser igual a quantidade solicitada.',
        );
      }

      if (missingQuantity > 0) {
        divergenceItems.push({
          quantity: missingQuantity,
          type: DivergenceType.MISSING,
          notes: item.notes ?? null,
          tenantUuid,
          itemId: taskItem.eventItem.item.id,
          sourceItemId: taskItem.eventItemId,
        });
      }

      if (damagedQuantity > 0) {
        divergenceItems.push({
          quantity: damagedQuantity,
          type: DivergenceType.DAMAGED,
          notes: item.notes ?? null,
          tenantUuid,
          itemId: taskItem.eventItem.item.id,
          sourceItemId: taskItem.eventItemId,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const divergence = await tx.divergence.create({
        data: {
          source: DivergenceSource.EVENT,
          sourceId: task.eventId,
          tenantUuid,
          createdById: createdById ?? null,
          notes: input.notes?.trim() ? input.notes.trim() : null,
        },
      });

      await tx.divergenceItem.createMany({
        data: divergenceItems.map((item) => ({
          ...item,
          divergenceId: divergence.id,
        })),
      });

      // Baixa imediata no acervo: a perda registrada sai do estoque total agora.
      // A conferência final do evento abate esse valor (previousLoss) para não
      // debitar duas vezes, e a manutenção de item avariado repõe ao concluir.
      const lossByItemId = new Map<string, number>();
      for (const item of divergenceItems) {
        lossByItemId.set(item.itemId, (lossByItemId.get(item.itemId) ?? 0) + item.quantity);
      }
      for (const [itemId, quantity] of lossByItemId) {
        await tx.item.update({
          where: { id: itemId },
          data: { totalQuantity: { decrement: quantity } },
        });
      }

      return tx.divergence.findUniqueOrThrow({
        where: { id: divergence.id },
        include: {
          items: { include: { item: { select: { id: true, name: true } } } },
          createdBy: { select: { id: true, name: true } },
          resolvedBy: { select: { id: true, name: true } },
        },
      });
    });
  }

  async resolver(id: string, tenantUuid: string, resolvedById?: string) {
    const divergence = await this.prisma.divergence.findFirst({
      where: { id, tenantUuid },
      include: { items: true },
    });

    if (!divergence) {
      throw new NotFoundException('Divergencia nao encontrada.');
    }

    if (divergence.status === DivergenceStatus.RESOLVED) {
      throw new BadRequestException('Esta divergencia ja foi resolvida.');
    }

    const damagedItems = divergence.items
      .filter((item) => item.type === DivergenceType.DAMAGED)
      .map((item) => ({ itemId: item.itemId, quantity: item.quantity }));

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
