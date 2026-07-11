import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DivergenceSource,
  DivergenceStatus,
  DivergenceType,
  Event,
  EventStatus,
  Prisma,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { TasksService } from 'src/tasks/tasks.service';
import { CreateEventInput } from './dto/create-event.input';
import { CompleteEventItemInput, UpdateEventInput } from './dto/update-event.input';
import { CreateEventItemInput } from './dto/create-event-item.input';
import { UpdateEventItemInput } from './dto/update-event-item.input';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  private readonly responsibleSelect = {
    id: true,
    name: true,
    email: true,
  } as const;

  private async attachDivergencesToEventItems<T extends { id: string }>(
    eventItems: T[],
    tenantUuid: string,
  ) {
    if (eventItems.length === 0) return eventItems;

    const divergenceItems = await this.prisma.divergenceItem.findMany({
      where: {
        tenantUuid,
        sourceItemId: { in: eventItems.map((eventItem) => eventItem.id) },
        divergence: { source: DivergenceSource.EVENT },
      },
      include: { divergence: { select: { status: true } } },
    });

    const divergencesByEventItemId = new Map<string, any[]>();
    for (const divergenceItem of divergenceItems) {
      if (!divergenceItem.sourceItemId) continue;

      const current = divergencesByEventItemId.get(divergenceItem.sourceItemId) ?? [];
      current.push({
        id: divergenceItem.id,
        quantity: divergenceItem.quantity,
        type: divergenceItem.type,
        status: divergenceItem.divergence.status,
        notes: divergenceItem.notes,
        tenantUuid: divergenceItem.tenantUuid,
        eventItemId: divergenceItem.sourceItemId,
        createdAt: divergenceItem.createdAt,
        updatedAt: divergenceItem.updatedAt,
      });
      divergencesByEventItemId.set(divergenceItem.sourceItemId, current);
    }

    return eventItems.map((eventItem) => ({
      ...eventItem,
      divergences: divergencesByEventItemId.get(eventItem.id) ?? [],
    }));
  }

  private parseEventDates(startDate: string, endDate?: string | null) {
    const parsedStart = new Date(startDate);

    if (Number.isNaN(parsedStart.getTime())) {
      throw new BadRequestException('Data de início inválida.');
    }

    if (!endDate) {
      return { parsedStart, parsedEnd: null as null };
    }

    const parsedEnd = new Date(endDate);

    if (Number.isNaN(parsedEnd.getTime())) {
      throw new BadRequestException('Data de término inválida.');
    }

    if (parsedEnd <= parsedStart) {
      throw new BadRequestException('O horário de término deve ser após o horário de início.');
    }

    // Sem fuso explícito, compara o dia pelo texto (YYYY-MM-DD) para não depender
    // do fuso do servidor; com fuso (Z/±hh:mm), compara os componentes locais.
    const hasExplicitZone = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
    const startDay = startDate.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    const endDay = endDate.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    const sameDay =
      startDay && endDay && !hasExplicitZone(startDate) && !hasExplicitZone(endDate)
        ? startDay === endDay
        : parsedStart.getFullYear() === parsedEnd.getFullYear() &&
          parsedStart.getMonth() === parsedEnd.getMonth() &&
          parsedStart.getDate() === parsedEnd.getDate();

    if (!sameDay) {
      throw new BadRequestException('O horário de término deve ser no mesmo dia que o início.');
    }

    return { parsedStart, parsedEnd };
  }

  private normalizePositiveQuantity(value: number | undefined, fieldName: string) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} deve ser um número inteiro maior que zero.`);
    }

    return value;
  }

  private normalizeCompletionQuantity(value: number | undefined, fieldName: string) {
    const quantity = value ?? 0;

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException(
        `${fieldName} deve ser um número inteiro maior ou igual a zero.`,
      );
    }

    return quantity;
  }

  private async applyCompletionReport(
    eventId: string,
    tenantUuid: string,
    completionItems: CompleteEventItemInput[] | undefined,
    tx: Prisma.TransactionClient,
    userId?: string,
  ) {
    const eventItems = await tx.eventItem.findMany({
      where: { eventId, tenantUuid },
    });

    // A conferência final substitui a contagem das tarefas ainda pendentes
    await tx.task.updateMany({
      where: { eventId, tenantUuid, status: TaskStatus.PENDENTE },
      data: { status: TaskStatus.CANCELADA },
    });

    if (eventItems.length === 0) {
      return;
    }

    if (!completionItems?.length) {
      throw new BadRequestException(
        'Informe a contagem de retorno dos itens para finalizar o evento.',
      );
    }

    const completionByEventItemId = new Map(
      completionItems.map((completionItem) => [completionItem.eventItemId, completionItem]),
    );

    if (completionByEventItemId.size !== completionItems.length) {
      throw new BadRequestException('Há itens duplicados na contagem de finalização.');
    }

    for (const eventItem of eventItems) {
      const completionItem = completionByEventItemId.get(eventItem.id);

      if (!completionItem) {
        throw new BadRequestException(
          'Informe a contagem de retorno para todos os itens do evento.',
        );
      }

      const returnedQuantity = this.normalizeCompletionQuantity(
        completionItem.returnedQuantity,
        'Quantidade retornada',
      );
      const missingQuantity = this.normalizeCompletionQuantity(
        completionItem.missingQuantity,
        'Quantidade faltante',
      );
      const damagedQuantity = this.normalizeCompletionQuantity(
        completionItem.damagedQuantity,
        'Quantidade avariada',
      );
      const totalCounted = returnedQuantity + missingQuantity + damagedQuantity;

      if (totalCounted !== eventItem.plannedQuantity) {
        throw new BadRequestException(
          'A soma de itens retornados, faltantes e avariados deve ser igual à quantidade reservada.',
        );
      }
    }

    const previousDivergenceItems = await tx.divergenceItem.findMany({
      where: {
        sourceItemId: { in: eventItems.map((eventItem) => eventItem.id) },
        tenantUuid,
        divergence: { source: DivergenceSource.EVENT, sourceId: eventId },
      },
      include: { divergence: { select: { status: true } } },
    });

    // Toda divergência de evento já debitou totalQuantity ao ser registrada;
    // o delta abaixo abate essas perdas já contabilizadas.
    const previousLossByEventItemId = new Map<string, number>();
    // Divergências resolvidas podem já ter gerado manutenção; são preservadas
    // e abatidas das novas para não registrar a mesma perda duas vezes.
    const resolvedLossByEventItemAndType = new Map<string, number>();
    for (const divergenceItem of previousDivergenceItems) {
      if (!divergenceItem.sourceItemId) continue;
      previousLossByEventItemId.set(
        divergenceItem.sourceItemId,
        (previousLossByEventItemId.get(divergenceItem.sourceItemId) ?? 0) + divergenceItem.quantity,
      );

      if (divergenceItem.divergence.status === DivergenceStatus.RESOLVED) {
        const key = `${divergenceItem.sourceItemId}:${divergenceItem.type}`;
        resolvedLossByEventItemAndType.set(
          key,
          (resolvedLossByEventItemAndType.get(key) ?? 0) + divergenceItem.quantity,
        );
      }
    }

    // Divergências pendentes são substituídas pela contagem da conferência final
    await tx.divergence.deleteMany({
      where: {
        source: DivergenceSource.EVENT,
        sourceId: eventId,
        tenantUuid,
        status: DivergenceStatus.PENDING,
      },
    });

    const divergenceItemsToCreate: Omit<Prisma.DivergenceItemCreateManyInput, 'divergenceId'>[] = [];
    const entradaTaskItems: { eventItemId: string; requestedQuantity: number; notes?: string }[] = [];

    for (const eventItem of eventItems) {
      const completionItem = completionByEventItemId.get(eventItem.id)!;
      const returnedQuantity = this.normalizeCompletionQuantity(
        completionItem.returnedQuantity,
        'Quantidade retornada',
      );
      const missingQuantity = this.normalizeCompletionQuantity(
        completionItem.missingQuantity,
        'Quantidade faltante',
      );
      const damagedQuantity = this.normalizeCompletionQuantity(
        completionItem.damagedQuantity,
        'Quantidade avariada',
      );
      const lossQuantity = missingQuantity + damagedQuantity;
      const previousLossQuantity = previousLossByEventItemId.get(eventItem.id) ?? 0;
      const availableDelta = returnedQuantity - eventItem.returnedQuantity;
      const totalQuantityDelta = previousLossQuantity - lossQuantity;

      if (availableDelta !== 0 || totalQuantityDelta !== 0) {
        await tx.item.update({
          where: { id: eventItem.itemId },
          data: {
            availableQuantity: { increment: availableDelta },
            totalQuantity: { increment: totalQuantityDelta },
          },
        });
      }

      const newMissingQuantity = Math.max(
        0,
        missingQuantity -
          (resolvedLossByEventItemAndType.get(`${eventItem.id}:${DivergenceType.MISSING}`) ?? 0),
      );
      const newDamagedQuantity = Math.max(
        0,
        damagedQuantity -
          (resolvedLossByEventItemAndType.get(`${eventItem.id}:${DivergenceType.DAMAGED}`) ?? 0),
      );

      if (newMissingQuantity > 0) {
        divergenceItemsToCreate.push({
          quantity: newMissingQuantity,
          type: DivergenceType.MISSING,
          notes: completionItem.notes,
          tenantUuid,
          itemId: eventItem.itemId,
          sourceItemId: eventItem.id,
        });
      }
      if (newDamagedQuantity > 0) {
        divergenceItemsToCreate.push({
          quantity: newDamagedQuantity,
          type: DivergenceType.DAMAGED,
          notes: completionItem.notes,
          tenantUuid,
          itemId: eventItem.itemId,
          sourceItemId: eventItem.id,
        });
      }

      await tx.eventItem.update({
        where: { id: eventItem.id },
        data: {
          shippedQuantity: eventItem.plannedQuantity,
          returnedQuantity,
        },
      });

      if (returnedQuantity > 0) {
        entradaTaskItems.push({
          eventItemId: eventItem.id,
          requestedQuantity: returnedQuantity,
          notes: completionItem.notes ?? undefined,
        });
      }
    }

    if (divergenceItemsToCreate.length > 0) {
      const divergenceHeader = await tx.divergence.create({
        data: {
          source: DivergenceSource.EVENT,
          sourceId: eventId,
          tenantUuid,
        },
      });
      await tx.divergenceItem.createMany({
        data: divergenceItemsToCreate.map((divergenceItem) => ({
          ...divergenceItem,
          divergenceId: divergenceHeader.id,
        })),
      });
    }

    if (entradaTaskItems.length > 0) {
      await this.tasksService.createEntradaGalpaoTask(
        eventId,
        entradaTaskItems,
        tenantUuid,
        userId,
        tx,
      );
    }
  }

  private async ensureClientExists(clientId: string, tenantUuid: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantUuid },
    });

    if (!client) {
      throw new BadRequestException('Cliente não encontrado.');
    }

    return client;
  }

  private async ensureResponsibleExists(responsibleId: string, tenantUuid: string) {
    const responsible = await this.prisma.user.findFirst({
      where: { id: responsibleId, tenantUuid },
    });

    if (!responsible) {
      throw new BadRequestException('Responsável não encontrado.');
    }

    return responsible;
  }

  async create(createEventInput: CreateEventInput, tenantUuid: string): Promise<Event> {
    const { parsedStart, parsedEnd } = this.parseEventDates(
      createEventInput.startDate,
      createEventInput.endDate ?? null,
    );

    await this.ensureClientExists(createEventInput.clientId, tenantUuid);
    if (createEventInput.responsibleId) {
      await this.ensureResponsibleExists(createEventInput.responsibleId, tenantUuid);
    }

    if (
      createEventInput.status === EventStatus.COMPLETED ||
      createEventInput.status === EventStatus.CANCELLED
    ) {
      throw new BadRequestException('Um novo evento só pode iniciar em planejamento ou em andamento.');
    }

    return this.prisma.event.create({
      data: {
        eventName: createEventInput.eventName,
        startDate: parsedStart,
        endDate: parsedEnd ?? null,
        eventLocation: createEventInput.eventLocation,
        status: createEventInput.status ?? EventStatus.PLANNING,
        clientId: createEventInput.clientId,
        responsibleId: createEventInput.responsibleId ?? null,
        tenantUuid,
      },
      include: {
        client: true,
        responsible: { select: this.responsibleSelect },
      },
    });
  }

  async findAll(tenantUuid: string, search?: string) {
    const where: any = { tenantUuid };

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      where.OR = [
        { eventName: { contains: searchTerm, mode: 'insensitive' } },
        { client: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
        { responsible: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        client: true,
        responsible: { select: this.responsibleSelect },
        eventItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const eventItemsWithDivergences = await this.attachDivergencesToEventItems(
      events.flatMap((event) => event.eventItems),
      tenantUuid,
    );
    const eventItemsById = new Map(
      eventItemsWithDivergences.map((eventItem) => [eventItem.id, eventItem]),
    );

    return events.map((event) => ({
      ...event,
      eventItems: event.eventItems.map((eventItem) => eventItemsById.get(eventItem.id) ?? eventItem),
    }));
  }

  async findOne(id: string, tenantUuid: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantUuid },
      include: {
        client: true,
        responsible: { select: this.responsibleSelect },
        eventItems: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!event) return null;

    return {
      ...event,
      eventItems: await this.attachDivergencesToEventItems(event.eventItems, tenantUuid),
    };
  }

  async update(id: string, updateEventInput: UpdateEventInput, tenantUuid: string, userId?: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (existing.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Não é possível editar um evento cancelado.');
    }

    if (existing.status === EventStatus.COMPLETED) {
      throw new BadRequestException('Não é possível editar um evento concluído.');
    }

    if (updateEventInput.clientId && updateEventInput.clientId !== existing.clientId) {
      await this.ensureClientExists(updateEventInput.clientId, tenantUuid);
    }

    if (updateEventInput.responsibleId !== undefined) {
      if (updateEventInput.responsibleId !== null) {
        await this.ensureResponsibleExists(updateEventInput.responsibleId, tenantUuid);
      }
    }

    const nextStartDate = updateEventInput.startDate ?? existing.startDate.toISOString();
    const nextEndDate =
      updateEventInput.endDate !== undefined
        ? updateEventInput.endDate
        : (existing.endDate?.toISOString() ?? null);
    const { parsedStart, parsedEnd } = this.parseEventDates(nextStartDate, nextEndDate);
    // Eventos COMPLETED/CANCELLED já foram bloqueados acima
    const isFinishingEvent = updateEventInput.status === EventStatus.COMPLETED;

    if (
      updateEventInput.status === EventStatus.IN_PROGRESS &&
      existing.status !== EventStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Use a ação de iniciar evento para movê-lo para Em andamento.',
      );
    }

    if (updateEventInput.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Use a ação de cancelar para encerrar o evento.');
    }

    if (
      existing.status === EventStatus.IN_PROGRESS &&
      updateEventInput.status &&
      updateEventInput.status !== EventStatus.IN_PROGRESS &&
      updateEventInput.status !== EventStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Eventos em andamento só podem ser concluídos ou cancelados pelas ações dedicadas.',
      );
    }

    if (isFinishingEvent && !updateEventInput.inventoryCountConfirmed) {
      throw new BadRequestException(
        'Para finalizar o evento, confirme a contagem dos itens para validar o retorno ao estoque.',
      );
    }

    const updateEvent = async (tx: Prisma.TransactionClient) => {
      if (isFinishingEvent) {
        await this.applyCompletionReport(id, tenantUuid, updateEventInput.completionItems, tx, userId);
      }

      return tx.event.update({
        where: { id },
        data: {
          eventName: updateEventInput.eventName,
          startDate: updateEventInput.startDate ? parsedStart : undefined,
          endDate: updateEventInput.endDate !== undefined ? parsedEnd : undefined,
          eventLocation: updateEventInput.eventLocation,
          status: updateEventInput.status,
          clientId: updateEventInput.clientId,
          responsibleId: updateEventInput.responsibleId,
        },
        include: {
          client: true,
          responsible: { select: this.responsibleSelect },
          eventItems: {
            include: {
              item: true,
            },
          },
        },
      });
    };

    const result = await this.prisma.$transaction(updateEvent);

    return result;
  }

  async iniciar(id: string, tenantUuid: string, userId?: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (existing.status !== EventStatus.PLANNING) {
      throw new BadRequestException(
        'Apenas eventos em planejamento podem ser iniciados.',
      );
    }

    if (!existing.eventItems || existing.eventItems.length === 0) {
      throw new BadRequestException(
        'Adicione ao menos um item ao evento antes de iniciar.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id },
        data: { status: EventStatus.IN_PROGRESS },
        include: {
          client: true,
          responsible: { select: this.responsibleSelect },
          eventItems: { include: { item: true } },
        },
      });

      await this.tasksService.createSaidaGalpaoTask(
        id,
        existing.eventItems.map((eventItem) => ({
          eventItemId: eventItem.id,
          requestedQuantity: eventItem.plannedQuantity,
        })),
        tenantUuid,
        userId,
        tx,
      );

      return event;
    });

    return updated;
  }

  async remove(id: string, tenantUuid: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (existing.eventItems.length > 0) {
      throw new BadRequestException('Remova os itens do evento antes de excluí-lo.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.divergence.deleteMany({
        where: { source: DivergenceSource.EVENT, sourceId: id, tenantUuid },
      });

      return tx.event.delete({
        where: { id },
        include: {
          client: true,
          responsible: { select: this.responsibleSelect },
        },
      });
    });
  }

  async cancel(id: string, tenantUuid: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantUuid },
      include: {
        eventItems: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Este evento já está cancelado.');
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException('Não é possível cancelar um evento já concluído.');
    }

    const divergenceItems = await this.prisma.divergenceItem.findMany({
      where: {
        tenantUuid,
        sourceItemId: { in: event.eventItems.map((eventItem) => eventItem.id) },
        divergence: { source: DivergenceSource.EVENT, sourceId: id },
      },
    });
    const lossByEventItemId = new Map<string, number>();
    for (const divergenceItem of divergenceItems) {
      if (!divergenceItem.sourceItemId) continue;
      lossByEventItemId.set(
        divergenceItem.sourceItemId,
        (lossByEventItemId.get(divergenceItem.sourceItemId) ?? 0) + divergenceItem.quantity,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { eventId: id, tenantUuid, status: TaskStatus.PENDENTE },
        data: { status: TaskStatus.CANCELADA },
      });

      for (const eventItem of event.eventItems) {
        // Unidades já devolvidas ou registradas como perda em divergência não voltam ao estoque
        const recordedLoss = lossByEventItemId.get(eventItem.id) ?? 0;
        const pendingReturn = Math.max(
          0,
          eventItem.plannedQuantity - eventItem.returnedQuantity - recordedLoss,
        );

        if (pendingReturn > 0) {
          await tx.item.update({
            where: { id: eventItem.itemId },
            data: { availableQuantity: { increment: pendingReturn } },
          });
        }
      }

      return tx.event.update({
        where: { id },
        data: {
          status: EventStatus.CANCELLED,
        },
        include: {
          client: true,
          responsible: { select: this.responsibleSelect },
        },
      });
    });
  }

  async findItems(eventId: string, tenantUuid: string) {
    const event = await this.findOne(eventId, tenantUuid);

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const eventItems = await this.prisma.eventItem.findMany({
      where: {
        eventId,
        tenantUuid,
      },
      include: {
        item: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return this.attachDivergencesToEventItems(eventItems, tenantUuid);
  }

  async addItem(eventId: string, input: CreateEventItemInput, tenantUuid: string) {
    const plannedQuantity = this.normalizePositiveQuantity(input.plannedQuantity, 'Quantidade planejada');

    const event = await this.findOne(eventId, tenantUuid);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (
      event.status !== EventStatus.PLANNING &&
      event.status !== EventStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Itens só podem ser adicionados em eventos em planejamento ou em andamento.',
      );
    }

    const item = await this.prisma.item.findFirst({
      where: {
        id: input.itemId,
        tenantUuid,
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado.');
    }

    if (item.availableQuantity < plannedQuantity) {
      throw new BadRequestException('Estoque insuficiente para o item selecionado.');
    }

    const existingEventItem = await this.prisma.eventItem.findFirst({
      where: {
        eventId,
        itemId: input.itemId,
        tenantUuid,
      },
    });

    if (existingEventItem) {
      throw new BadRequestException('Este item já foi adicionado ao evento.');
    }

    return this.prisma.$transaction(async (tx) => {
      const reserved = await tx.item.updateMany({
        where: { id: item.id, tenantUuid, availableQuantity: { gte: plannedQuantity } },
        data: { availableQuantity: { decrement: plannedQuantity } },
      });

      if (reserved.count !== 1) {
        throw new BadRequestException('Estoque insuficiente para o item selecionado.');
      }

      return tx.eventItem.create({
        data: {
          eventId,
          itemId: input.itemId,
          plannedQuantity,
          tenantUuid,
        },
        include: {
          item: true,
        },
      });
    });
  }

  async updateItem(
    eventId: string,
    eventItemId: string,
    input: UpdateEventItemInput,
    tenantUuid: string,
  ) {
    const eventItem = await this.prisma.eventItem.findFirst({
      where: {
        id: eventItemId,
        eventId,
        tenantUuid,
      },
      include: {
        item: true,
        event: true,
      },
    });

    if (!eventItem) {
      throw new NotFoundException('Item do evento não encontrado.');
    }

    if (
      eventItem.event.status !== EventStatus.PLANNING &&
      eventItem.event.status !== EventStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Itens só podem ser editados em eventos em planejamento ou em andamento.',
      );
    }

    const activeTaskItem = await this.prisma.taskItem.findFirst({
      where: {
        eventItemId,
        tenantUuid,
        task: { status: { in: [TaskStatus.PENDENTE, TaskStatus.CONCLUIDA] } },
      },
    });

    if (activeTaskItem) {
      throw new BadRequestException(
        'Este item está vinculado a uma tarefa ativa. Cancele a tarefa antes de editá-lo.',
      );
    }

    const nextPlannedQuantity =
      input.plannedQuantity === undefined
        ? eventItem.plannedQuantity
        : this.normalizePositiveQuantity(input.plannedQuantity, 'Quantidade planejada');
    const nextShippedQuantity =
      input.shippedQuantity === undefined
        ? eventItem.shippedQuantity
        : this.normalizeCompletionQuantity(input.shippedQuantity, 'Quantidade enviada');
    const nextReturnedQuantity =
      input.returnedQuantity === undefined
        ? eventItem.returnedQuantity
        : this.normalizeCompletionQuantity(input.returnedQuantity, 'Quantidade retornada');

    if (nextShippedQuantity > nextPlannedQuantity || nextReturnedQuantity > nextPlannedQuantity) {
      throw new BadRequestException(
        'Quantidades enviada e retornada não podem ser maiores que a quantidade planejada.',
      );
    }

    const plannedDelta = nextPlannedQuantity - eventItem.plannedQuantity;
    const returnedDelta = nextReturnedQuantity - eventItem.returnedQuantity;
    // Reservar mais unidades consome estoque; registrar devolução repõe
    const stockDelta = returnedDelta - plannedDelta;

    if (stockDelta < 0 && eventItem.item.availableQuantity < Math.abs(stockDelta)) {
      throw new BadRequestException('Estoque insuficiente para a alteração solicitada.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (stockDelta < 0) {
        const reserved = await tx.item.updateMany({
          where: {
            id: eventItem.itemId,
            tenantUuid,
            availableQuantity: { gte: Math.abs(stockDelta) },
          },
          data: { availableQuantity: { decrement: Math.abs(stockDelta) } },
        });

        if (reserved.count !== 1) {
          throw new BadRequestException('Estoque insuficiente para a alteração solicitada.');
        }
      } else if (stockDelta > 0) {
        await tx.item.update({
          where: { id: eventItem.itemId },
          data: { availableQuantity: { increment: stockDelta } },
        });
      }

      return tx.eventItem.update({
        where: { id: eventItemId },
        data: {
          plannedQuantity: nextPlannedQuantity,
          shippedQuantity: nextShippedQuantity,
          returnedQuantity: nextReturnedQuantity,
        },
        include: {
          item: true,
        },
      });
    });
  }

  async removeItem(eventId: string, eventItemId: string, tenantUuid: string) {
    const eventItem = await this.prisma.eventItem.findFirst({
      where: {
        id: eventItemId,
        eventId,
        tenantUuid,
      },
      include: { event: true },
    });

    if (!eventItem) {
      throw new NotFoundException('Item do evento não encontrado.');
    }

    if (
      eventItem.event.status !== EventStatus.PLANNING &&
      eventItem.event.status !== EventStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Itens só podem ser removidos em eventos em planejamento ou em andamento.',
      );
    }

    const activeTaskItem = await this.prisma.taskItem.findFirst({
      where: {
        eventItemId,
        tenantUuid,
        task: { status: { in: [TaskStatus.PENDENTE, TaskStatus.CONCLUIDA] } },
      },
    });

    if (activeTaskItem) {
      throw new BadRequestException(
        'Este item está vinculado a uma tarefa ativa. Cancele a tarefa antes de removê-lo.',
      );
    }

    // Divergências já debitaram o estoque total; apagá-las junto com o item corromperia a contagem
    const divergenceCount = await this.prisma.divergenceItem.count({
      where: { sourceItemId: eventItem.id, tenantUuid },
    });

    if (divergenceCount > 0) {
      throw new BadRequestException(
        'Este item possui divergências registradas. Trate-as antes de removê-lo do evento.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const pendingReturn = eventItem.plannedQuantity - eventItem.returnedQuantity;

      if (pendingReturn > 0) {
        await tx.item.update({
          where: { id: eventItem.itemId },
          data: { availableQuantity: { increment: pendingReturn } },
        });
      }

      return tx.eventItem.delete({
        where: { id: eventItem.id },
      });
    });
  }

}
