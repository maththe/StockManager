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

  // `sourceId` é um id solto (não há relação no schema, porque a origem pode ser
  // evento, locação ou nenhuma das duas). Resolvemos o nome em lote para a UI
  // conseguir dizer de onde a divergência veio sem abrir o registro.
  private async resolverOrigens<
    T extends { source: DivergenceSource; sourceId: string | null },
  >(divergences: T[], tenantUuid: string) {
    const idsPorOrigem = (origem: DivergenceSource) => [
      ...new Set(
        divergences
          .filter((d) => d.source === origem && d.sourceId)
          .map((d) => d.sourceId!),
      ),
    ];

    const eventIds = idsPorOrigem(DivergenceSource.EVENT);
    const rentalIds = idsPorOrigem(DivergenceSource.RENTAL);

    const [events, rentals] = await Promise.all([
      eventIds.length
        ? this.prisma.event.findMany({
            where: { tenantUuid, id: { in: eventIds } },
            select: {
              id: true,
              eventName: true,
              startDate: true,
              client: { select: { companyName: true } },
            },
          })
        : [],
      rentalIds.length
        ? this.prisma.rental.findMany({
            where: { tenantUuid, id: { in: rentalIds } },
            select: {
              id: true,
              rentalCode: true,
              startDate: true,
              client: { select: { companyName: true } },
            },
          })
        : [],
    ]);

    const origemPorId = new Map<
      string,
      { label: string; clientName: string | null; date: Date | null }
    >();

    for (const event of events) {
      origemPorId.set(event.id, {
        label: event.eventName,
        clientName: event.client?.companyName ?? null,
        date: event.startDate,
      });
    }

    for (const rental of rentals) {
      origemPorId.set(rental.id, {
        label: rental.rentalCode,
        clientName: rental.client?.companyName ?? null,
        date: rental.startDate,
      });
    }

    return divergences.map((divergence) => ({
      ...divergence,
      // null quando a origem foi apagada ou não se aplica (MANUAL/MAINTENANCE).
      sourceRef: divergence.sourceId
        ? (origemPorId.get(divergence.sourceId) ?? null)
        : null,
    }));
  }

  async findAll(tenantUuid: string, status?: DivergenceStatus) {
    const divergences = await this.prisma.divergence.findMany({
      where: {
        tenantUuid,
        ...(status ? { status } : {}),
      },
      include: {
        items: { include: { item: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        maintenances: { select: { id: true, code: true, status: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });

    return this.resolverOrigens(divergences, tenantUuid);
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

    const [comOrigem] = await this.resolverOrigens([divergence], tenantUuid);
    return comOrigem;
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
            rentalItem: {
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

    if (!task.eventId && !task.rentalId) {
      throw new BadRequestException(
        'A tarefa nao esta vinculada a um evento ou locacao.',
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

    // Um item pode ter mais de uma divergência (ex.: falta apurada na saída e
    // avaria na volta). O que já foi registrado sai da quantidade ainda em jogo.
    const sourceItemIds = task.taskItems
      .map((taskItem) => taskItem.eventItemId ?? taskItem.rentalItemId)
      .filter((id): id is string => !!id);

    const gruposDivergidos = sourceItemIds.length
      ? await this.prisma.divergenceItem.groupBy({
          by: ['sourceItemId'],
          where: { tenantUuid, sourceItemId: { in: sourceItemIds } },
          _sum: { quantity: true },
        })
      : [];

    const jaDivergidoPorSourceItemId = new Map(
      gruposDivergidos
        .filter((grupo) => grupo.sourceItemId)
        .map((grupo) => [grupo.sourceItemId!, grupo._sum.quantity ?? 0]),
    );

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

      // A linha aponta para EventItem (tarefa de evento) ou RentalItem (locação).
      const sourceItem = taskItem.eventItem ?? taskItem.rentalItem;
      const sourceItemId = taskItem.eventItemId ?? taskItem.rentalItemId;

      if (!sourceItem || !sourceItemId) {
        throw new BadRequestException(
          'Um dos itens da tarefa nao esta vinculado a um evento ou locacao.',
        );
      }

      const esperada = Math.max(
        0,
        taskItem.requestedQuantity -
          (jaDivergidoPorSourceItemId.get(sourceItemId) ?? 0),
      );

      if (
        !Number.isInteger(item.confirmedQuantity) ||
        item.confirmedQuantity < 0 ||
        item.confirmedQuantity > esperada
      ) {
        throw new BadRequestException(
          `Quantidade contada deve ser um inteiro entre zero e a quantidade esperada (${esperada}).`,
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
        esperada
      ) {
        throw new BadRequestException(
          `A soma entre quantidade contada, faltante e avariada deve ser igual a quantidade esperada (${esperada}).`,
        );
      }

      if (missingQuantity > 0) {
        divergenceItems.push({
          quantity: missingQuantity,
          type: DivergenceType.MISSING,
          notes: item.notes ?? null,
          tenantUuid,
          itemId: sourceItem.item.id,
          sourceItemId,
        });
      }

      if (damagedQuantity > 0) {
        divergenceItems.push({
          quantity: damagedQuantity,
          type: DivergenceType.DAMAGED,
          notes: item.notes ?? null,
          tenantUuid,
          itemId: sourceItem.item.id,
          sourceItemId,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const divergence = await tx.divergence.create({
        data: {
          source: task.eventId ? DivergenceSource.EVENT : DivergenceSource.RENTAL,
          sourceId: task.eventId ?? task.rentalId,
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
      // Em eventos, a conferência final abate esse valor (previousLoss); em
      // locações, a devolução/cancelamento desconta a perda do retorno pendente.
      // A manutenção de item avariado repõe ao concluir, em ambos os casos.
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
