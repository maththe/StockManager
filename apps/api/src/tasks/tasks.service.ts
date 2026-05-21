import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma, TaskStatus, TaskType } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { UpdateTaskInput } from './dto/update-task.input';
import { ConfirmTaskInput } from './dto/confirm-task.input';
import { CreatePartialTaskInput } from './dto/create-partial-task.input';

type PrismaTx = Prisma.TransactionClient;

interface CreateGalpaoTaskItem {
  eventItemId: string;
  requestedQuantity: number;
  notes?: string;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateTaskCode(
    tenantUuid: string,
    client: PrismaTx | PrismaService = this.prisma,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRB-${year}-`;

    const last = await client.task.findFirst({
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

  private async createGalpaoTask(
    type: TaskType,
    eventId: string,
    items: CreateGalpaoTaskItem[],
    tenantUuid: string,
    createdById?: string,
    tx?: PrismaTx,
    options?: { assignedToId?: string | null; notes?: string },
  ) {
    if (!items.length) return null;

    const client: PrismaTx | PrismaService = tx ?? this.prisma;
    const code = await this.generateTaskCode(tenantUuid, client);

    return client.task.create({
      data: {
        code,
        type,
        tenantUuid,
        eventId,
        createdById: createdById ?? null,
        assignedToId: options?.assignedToId ?? null,
        notes: options?.notes ?? null,
        taskItems: {
          create: items.map((it) => ({
            tenantUuid,
            eventItemId: it.eventItemId,
            requestedQuantity: it.requestedQuantity,
            confirmedQuantity: 0,
            confirmed: false,
            notes: it.notes ?? null,
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

  async createSaidaGalpaoTask(
    eventId: string,
    items: CreateGalpaoTaskItem[],
    tenantUuid: string,
    createdById?: string,
    tx?: PrismaTx,
    options?: { assignedToId?: string | null; notes?: string },
  ) {
    return this.createGalpaoTask(
      TaskType.SAIDA_GALPAO,
      eventId,
      items,
      tenantUuid,
      createdById,
      tx,
      options,
    );
  }

  async createEntradaGalpaoTask(
    eventId: string,
    items: CreateGalpaoTaskItem[],
    tenantUuid: string,
    createdById?: string,
    tx?: PrismaTx,
    options?: { assignedToId?: string | null; notes?: string },
  ) {
    return this.createGalpaoTask(
      TaskType.ENTRADA_GALPAO,
      eventId,
      items,
      tenantUuid,
      createdById,
      tx,
      options,
    );
  }

  async criarTaskParcial(
    eventId: string,
    input: CreatePartialTaskInput,
    tenantUuid: string,
    createdById?: string,
  ) {
    if (!input.items?.length) {
      throw new BadRequestException('Selecione ao menos um item para a tarefa.');
    }

    const seen = new Set<string>();
    for (const item of input.items) {
      if (!item.eventItemId) {
        throw new BadRequestException('Item inválido na seleção.');
      }
      if (seen.has(item.eventItemId)) {
        throw new BadRequestException('Item duplicado na seleção.');
      }
      seen.add(item.eventItemId);

      if (
        !Number.isInteger(item.requestedQuantity) ||
        item.requestedQuantity <= 0
      ) {
        throw new BadRequestException(
          'Quantidade solicitada deve ser inteiro maior que zero.',
        );
      }
    }

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantUuid },
      include: { eventItems: true },
    });

    if (!event) throw new NotFoundException('Evento não encontrado.');

    if (
      event.status !== EventStatus.PLANNING &&
      event.status !== EventStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Só é possível criar tarefas para eventos em planejamento ou em andamento.',
      );
    }

    const eventItemsById = new Map(event.eventItems.map((ei) => [ei.id, ei]));
    for (const item of input.items) {
      if (!eventItemsById.has(item.eventItemId)) {
        throw new BadRequestException('Um dos itens não pertence a este evento.');
      }
    }

    const existingTaskItems = await this.prisma.taskItem.findMany({
      where: {
        tenantUuid,
        eventItemId: { in: input.items.map((it) => it.eventItemId) },
        task: {
          eventId,
          status: { in: [TaskStatus.PENDENTE, TaskStatus.CONCLUIDA] },
        },
      },
      select: { eventItemId: true, requestedQuantity: true },
    });

    const alreadyRequested = new Map<string, number>();
    for (const ti of existingTaskItems) {
      alreadyRequested.set(
        ti.eventItemId,
        (alreadyRequested.get(ti.eventItemId) ?? 0) + ti.requestedQuantity,
      );
    }

    for (const item of input.items) {
      const eventItem = eventItemsById.get(item.eventItemId)!;
      const already = alreadyRequested.get(item.eventItemId) ?? 0;
      const restante = eventItem.plannedQuantity - already;
      if (item.requestedQuantity > restante) {
        throw new BadRequestException(
          `Quantidade solicitada (${item.requestedQuantity}) excede o restante (${restante}) para um dos itens.`,
        );
      }
    }

    if (input.assignedToId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: input.assignedToId, tenantUuid },
        select: { id: true },
      });
      if (!assignee) {
        throw new BadRequestException('Usuário responsável inválido.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (event.status === EventStatus.PLANNING) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.IN_PROGRESS },
        });
      }

      return this.createSaidaGalpaoTask(
        eventId,
        input.items.map((it) => ({
          eventItemId: it.eventItemId,
          requestedQuantity: it.requestedQuantity,
          notes: it.notes,
        })),
        tenantUuid,
        createdById,
        tx,
        { assignedToId: input.assignedToId ?? null, notes: input.notes },
      );
    });
  }

  async findAll(tenantUuid: string, status?: TaskStatus, type?: TaskType) {
    return this.prisma.task.findMany({
      where: {
        tenantUuid,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
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

      if (update.confirmedQuantity > taskItem.requestedQuantity) {
        throw new BadRequestException(
          'Quantidade confirmada nao pode ser maior que a quantidade solicitada.',
        );
      }

      if (update.confirmedQuantity !== taskItem.requestedQuantity) {
        throw new BadRequestException(
          'A tarefa so pode ser concluida com a quantidade exata solicitada. Se houver problema, crie uma divergencia.',
        );
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

  private async ensureAssignedUserBelongsToTenant(
    assignedToId: string | null | undefined,
    tenantUuid: string,
  ) {
    if (!assignedToId) return;
    const assignee = await this.prisma.user.findFirst({
      where: { id: assignedToId, tenantUuid },
      select: { id: true },
    });
    if (!assignee) {
      throw new BadRequestException('Usuário responsável inválido.');
    }
  }
}
