import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DivergenceType, Event, EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { CompleteEventItemInput, UpdateEventInput } from './dto/update-event.input';
import { CreateEventItemInput } from './dto/create-event-item.input';
import { UpdateEventItemInput } from './dto/update-event-item.input';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseEventDates(startDate: string, endDate: string) {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      throw new BadRequestException('Datas do evento inválidas.');
    }

    if (parsedEnd < parsedStart) {
      throw new BadRequestException('A data final deve ser maior ou igual à inicial.');
    }

    return { parsedStart, parsedEnd };
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
  ) {
    const eventItems = await tx.eventItem.findMany({
      where: { eventId, tenantUuid },
      include: { divergences: true },
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
      const previousLossQuantity = eventItem.divergences.reduce(
        (total, divergence) => total + divergence.quantity,
        0,
      );
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

      await tx.divergence.deleteMany({
        where: { eventItemId: eventItem.id },
      });

      const divergenceData = [
        missingQuantity > 0
          ? {
              eventItemId: eventItem.id,
              quantity: missingQuantity,
              type: DivergenceType.MISSING,
              notes: completionItem.notes,
              tenantUuid,
            }
          : null,
        damagedQuantity > 0
          ? {
              eventItemId: eventItem.id,
              quantity: damagedQuantity,
              type: DivergenceType.DAMAGED,
              notes: completionItem.notes,
              tenantUuid,
            }
          : null,
      ].filter((divergence): divergence is NonNullable<typeof divergence> => Boolean(divergence));

      if (divergenceData.length) {
        await tx.divergence.createMany({ data: divergenceData });
      }

      await tx.eventItem.update({
        where: { id: eventItem.id },
        data: {
          shippedQuantity: eventItem.plannedQuantity,
          returnedQuantity,
        },
      });
    }
  }

  private async ensureClientExists(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new BadRequestException('Cliente não encontrado.');
    }

    return client;
  }

  async create(createEventInput: CreateEventInput, tenantUuid: string): Promise<Event> {
    const { parsedStart, parsedEnd } = this.parseEventDates(
      createEventInput.startDate,
      createEventInput.endDate,
    );

    await this.ensureClientExists(createEventInput.clientId);

    if (
      createEventInput.status === EventStatus.COMPLETED &&
      !createEventInput.inventoryCountConfirmed
    ) {
      throw new BadRequestException(
        'Para finalizar o evento, confirme a contagem dos itens para validar o retorno ao estoque.',
      );
    }

    return this.prisma.event.create({
      data: {
        eventName: createEventInput.eventName,
        startDate: parsedStart,
        endDate: parsedEnd,
        eventLocation: createEventInput.eventLocation,
        status: createEventInput.status ?? EventStatus.PLANNING,
        clientId: createEventInput.clientId,
        tenantUuid,
      },
      include: { client: true },
    });
  }

  async findAll(tenantUuid: string, search?: string) {
    const where: any = { tenantUuid };

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      where.OR = [
        { eventName: { contains: searchTerm, mode: 'insensitive' } },
        { client: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.event.findMany({
      where,
      include: {
        client: true,
        eventItems: {
          include: {
            item: true,
            divergences: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string, tenantUuid: string) {
    return this.prisma.event.findFirst({
      where: { id, tenantUuid },
      include: {
        client: true,
        eventItems: {
          include: {
            item: true,
            divergences: true,
          },
        },
      },
    });
  }

  async update(id: string, updateEventInput: UpdateEventInput, tenantUuid: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (updateEventInput.clientId && updateEventInput.clientId !== existing.clientId) {
      await this.ensureClientExists(updateEventInput.clientId);
    }

    const nextStartDate = updateEventInput.startDate ?? existing.startDate.toISOString();
    const nextEndDate = updateEventInput.endDate ?? existing.endDate.toISOString();
    const { parsedStart, parsedEnd } = this.parseEventDates(nextStartDate, nextEndDate);
    const isFinishingEvent =
      updateEventInput.status === EventStatus.COMPLETED &&
      existing.status !== EventStatus.COMPLETED;

    if (
      updateEventInput.status === EventStatus.CANCELLED &&
      existing.status !== EventStatus.CANCELLED
    ) {
      throw new BadRequestException('Use a ação de cancelar para encerrar o evento.');
    }

    if (
      existing.status === EventStatus.CANCELLED &&
      updateEventInput.status &&
      updateEventInput.status !== EventStatus.CANCELLED
    ) {
      throw new BadRequestException('Não é possível reabrir um evento cancelado.');
    }

    if (
      existing.status === EventStatus.COMPLETED &&
      updateEventInput.status &&
      updateEventInput.status !== EventStatus.COMPLETED
    ) {
      throw new BadRequestException('Não é possível reabrir um evento concluído.');
    }

    if (isFinishingEvent && !updateEventInput.inventoryCountConfirmed) {
      throw new BadRequestException(
        'Para finalizar o evento, confirme a contagem dos itens para validar o retorno ao estoque.',
      );
    }

    const updateEvent = async (tx: Prisma.TransactionClient) => {
      if (isFinishingEvent) {
        await this.applyCompletionReport(id, tenantUuid, updateEventInput.completionItems, tx);
      }

      return tx.event.update({
        where: { id },
        data: {
          eventName: updateEventInput.eventName,
          startDate: updateEventInput.startDate ? parsedStart : undefined,
          endDate: updateEventInput.endDate ? parsedEnd : undefined,
          eventLocation: updateEventInput.eventLocation,
          status: updateEventInput.status,
          clientId: updateEventInput.clientId,
        },
        include: {
          client: true,
          eventItems: {
            include: {
              item: true,
              divergences: true,
            },
          },
        },
      });
    };

    return this.prisma.$transaction(updateEvent);
  }

  async remove(id: string, tenantUuid: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return this.prisma.event.delete({
      where: { id },
      include: { client: true },
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

    return this.prisma.$transaction(async (tx) => {
      for (const eventItem of event.eventItems) {
        await tx.item.update({
          where: { id: eventItem.itemId },
          data: {
            availableQuantity: {
              increment: eventItem.plannedQuantity,
            },
          },
        });
      }

      return tx.event.update({
        where: { id },
        data: {
          status: EventStatus.CANCELLED,
        },
        include: { client: true },
      });
    });
  }

  async findItems(eventId: string, tenantUuid: string) {
    const event = await this.findOne(eventId, tenantUuid);

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return this.prisma.eventItem.findMany({
      where: {
        eventId,
        tenantUuid,
      },
      include: {
        item: true,
        divergences: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addItem(eventId: string, input: CreateEventItemInput, tenantUuid: string) {
    if (!input.plannedQuantity || input.plannedQuantity <= 0) {
      throw new BadRequestException('Quantidade planejada deve ser maior que zero.');
    }

    const event = await this.findOne(eventId, tenantUuid);
    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
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

    if (item.availableQuantity < input.plannedQuantity) {
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
      await tx.item.update({
        where: { id: item.id },
        data: {
          availableQuantity: {
            decrement: input.plannedQuantity,
          },
        },
      });

      return tx.eventItem.create({
        data: {
          eventId,
          itemId: input.itemId,
          plannedQuantity: input.plannedQuantity,
          tenantUuid,
        },
        include: {
          item: true,
          divergences: true,
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
        divergences: true,
      },
    });

    if (!eventItem) {
      throw new NotFoundException('Item do evento não encontrado.');
    }

    const nextPlannedQuantity = input.plannedQuantity ?? eventItem.plannedQuantity;

    if (nextPlannedQuantity <= 0) {
      throw new BadRequestException('Quantidade planejada deve ser maior que zero.');
    }

    const plannedDelta = nextPlannedQuantity - eventItem.plannedQuantity;

    if (plannedDelta > 0 && eventItem.item.availableQuantity < plannedDelta) {
      throw new BadRequestException('Estoque insuficiente para aumentar a quantidade planejada.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (plannedDelta !== 0) {
        await tx.item.update({
          where: { id: eventItem.itemId },
          data: {
            availableQuantity:
              plannedDelta > 0
                ? { decrement: plannedDelta }
                : { increment: Math.abs(plannedDelta) },
          },
        });
      }

      return tx.eventItem.update({
        where: { id: eventItemId },
        data: {
          plannedQuantity: input.plannedQuantity,
          shippedQuantity: input.shippedQuantity,
          returnedQuantity: input.returnedQuantity,
        },
        include: {
          item: true,
          divergences: true,
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
    });

    if (!eventItem) {
      throw new NotFoundException('Item do evento não encontrado.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id: eventItem.itemId },
        data: {
          availableQuantity: {
            increment: eventItem.plannedQuantity,
          },
        },
      });

      return tx.eventItem.delete({
        where: { id: eventItem.id },
      });
    });
  }
}
