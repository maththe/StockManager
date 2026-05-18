import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventItem, TaskStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { UpdateTaskInput } from './dto/update-task.input';
import { ConfirmTaskInput } from './dto/confirm-task.input';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureAssignedUserBelongsToTenant(assignedToId: string | null | undefined, tenantUuid: string) {
    if (!assignedToId) return;

    const user = await this.prisma.user.findFirst({ where: { id: assignedToId, tenantUuid } });
    if (!user) {
      throw new BadRequestException('Responsável não encontrado ou sem permissão.');
    }
  }

  private async generateTaskCode(tenantUuid: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRB-${year}-`;

    const last = await this.prisma.task.findFirst({
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

  async createSaidaGalpaoTask(
    eventId: string,
    eventItems: EventItem[],
    tenantUuid: string,
    createdById?: string,
  ) {
    if (!eventItems.length) return null;

    const existing = await this.prisma.task.findFirst({
      where: { eventId, tenantUuid },
      include: {
        taskItems: { include: { eventItem: { include: { item: true } } } },
        assignedTo: { select: { id: true, name: true } },
        event: { select: { id: true, eventName: true } },
      },
    });

    if (existing) return existing;

    const code = await this.generateTaskCode(tenantUuid);

    return this.prisma.task.create({
      data: {
        code,
        tenantUuid,
        eventId,
        createdById: createdById ?? null,
        taskItems: {
          create: eventItems.map((ei) => ({
            tenantUuid,
            eventItemId: ei.id,
            confirmedQuantity: 0,
            confirmed: false,
          })),
        },
      },
      include: {
        taskItems: { include: { eventItem: { include: { item: true } } } },
        assignedTo: { select: { id: true, name: true } },
        event: { select: { id: true, eventName: true } },
      },
    });
  }

  async findAll(tenantUuid: string, status?: TaskStatus) {
    return this.prisma.task.findMany({
      where: {
        tenantUuid,
        ...(status ? { status } : {}),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        event: { select: { id: true, eventName: true } },
        taskItems: {
          include: { eventItem: { include: { item: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantUuid: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantUuid },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        event: { select: { id: true, eventName: true, startDate: true } },
        taskItems: {
          include: { eventItem: { include: { item: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada.');
    return task;
  }

  async update(id: string, input: UpdateTaskInput, tenantUuid: string) {
    const task = await this.prisma.task.findFirst({ where: { id, tenantUuid } });
    if (!task) throw new NotFoundException('Tarefa não encontrada.');

    if (task.status !== TaskStatus.PENDENTE) {
      throw new BadRequestException('Apenas tarefas pendentes podem ser editadas.');
    }

    await this.ensureAssignedUserBelongsToTenant(input.assignedToId, tenantUuid);

    return this.prisma.task.update({
      where: { id },
      data: {
        assignedToId: input.assignedToId,
        notes: input.notes,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        event: { select: { id: true, eventName: true } },
        taskItems: { include: { eventItem: { include: { item: true } } } },
      },
    });
  }

  async concluir(id: string, input: ConfirmTaskInput, tenantUuid: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantUuid },
      include: { taskItems: { include: { eventItem: true } } },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada.');
    if (task.status === TaskStatus.CONCLUIDA) {
      throw new BadRequestException('Esta tarefa já está concluída.');
    }
    if (task.status === TaskStatus.CANCELADA) {
      throw new BadRequestException('Não é possível concluir uma tarefa cancelada.');
    }

    if (!Array.isArray(input.items) || input.items.length !== task.taskItems.length) {
      throw new BadRequestException('Informe a confirmação de todos os itens da tarefa.');
    }

    const itemsById = new Map(input.items.map((i) => [i.taskItemId, i]));

    if (itemsById.size !== input.items.length) {
      throw new BadRequestException('Há itens duplicados na confirmação da tarefa.');
    }

    for (const ti of input.items) {
      if (!Number.isInteger(ti.confirmedQuantity) || ti.confirmedQuantity < 0) {
        throw new BadRequestException('Quantidade confirmada deve ser um inteiro maior ou igual a zero.');
      }
    }

    for (const taskItem of task.taskItems) {
      const update = itemsById.get(taskItem.id);
      if (!update) {
        throw new BadRequestException('Informe a confirmação de todos os itens da tarefa.');
      }

      if (update.confirmedQuantity > taskItem.eventItem.plannedQuantity) {
        throw new BadRequestException('Quantidade confirmada não pode ser maior que a quantidade planejada.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      for (const ti of task.taskItems) {
        const update = itemsById.get(ti.id);
        if (!update) continue;

        await tx.taskItem.update({
          where: { id: ti.id },
          data: {
            confirmedQuantity: update.confirmedQuantity,
            confirmed: true,
            notes: update.notes ?? ti.notes,
          },
        });
      }

      return tx.task.update({
        where: { id },
        data: { status: TaskStatus.CONCLUIDA, completedAt: new Date() },
        include: {
          taskItems: { include: { eventItem: { include: { item: true } } } },
          assignedTo: { select: { id: true, name: true } },
          event: { select: { id: true, eventName: true } },
        },
      });
    });
  }

  async cancelar(id: string, tenantUuid: string) {
    const task = await this.prisma.task.findFirst({ where: { id, tenantUuid } });
    if (!task) throw new NotFoundException('Tarefa não encontrada.');

    if (task.status === TaskStatus.CANCELADA) {
      throw new BadRequestException('Esta tarefa já está cancelada.');
    }
    if (task.status === TaskStatus.CONCLUIDA) {
      throw new BadRequestException('Não é possível cancelar uma tarefa já concluída.');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.CANCELADA },
      include: {
        event: { select: { id: true, eventName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }
}
