import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';

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

    if (createEventInput.status === EventStatus.COMPLETED && !createEventInput.inventoryCountConfirmed) {
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

  async findAll(tenantUuid: string) {
    return this.prisma.event.findMany({
      where: { tenantUuid },
      include: { client: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string, tenantUuid: string) {
    return this.prisma.event.findFirst({
      where: { id, tenantUuid },
      include: { client: true },
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

    if (isFinishingEvent && !updateEventInput.inventoryCountConfirmed) {
      throw new BadRequestException(
        'Para finalizar o evento, confirme a contagem dos itens para validar o retorno ao estoque.',
      );
    }

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
}
