import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
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

  async findAll(tenantUuid: string) {
    return this.prisma.event.findMany({
      where: { tenantUuid },
      include: {
        client: true,
        eventItems: {
          include: {
            item: true,
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

    return this.prisma.event.update({
      where: { id },
      data: {
        eventName: updateEventInput.eventName,
        startDate: updateEventInput.startDate ? parsedStart : undefined,
        endDate: updateEventInput.endDate ? parsedEnd : undefined,
        eventLocation: updateEventInput.eventLocation,
        status: updateEventInput.status,
        clientId: updateEventInput.clientId,
      },
      include: { client: true },
    });
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
