import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';

export interface ContagemFinalItem {
  eventItemId: string;
  countedQuantity: number;
}

// Liquidação da contagem final de um evento.
//
// Vive fora de EventsService porque quem dispara é a conclusão da tarefa de
// contagem (TasksService), e EventsService já depende de TasksService — importar
// no sentido inverso criaria ciclo. Só depende do Prisma.
@Injectable()
export class EventCountService {
  constructor(private readonly prisma: PrismaService) {}

  // Roda sempre dentro da transação de quem chama: mexe em estoque.
  //
  // Chega aqui só o que foi conferido: TasksService exige que a contagem bata
  // com o esperado (solicitado menos o que já virou divergência). Por isso esta
  // liquidação não apura falta nem mexe em totalQuantity — a baixa do que não
  // voltou já aconteceu no registro da divergência.
  async liquidarContagemFinal(
    eventId: string,
    contagem: ContagemFinalItem[],
    tenantUuid: string,
    tx: Prisma.TransactionClient,
  ) {
    const event = await tx.event.findFirst({
      where: { id: eventId, tenantUuid },
      include: { eventItems: true },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    if (event.status !== EventStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Apenas eventos em andamento podem ser finalizados pela contagem.',
      );
    }

    const eventItemsById = new Map(event.eventItems.map((ei) => [ei.id, ei]));

    for (const linha of contagem) {
      const eventItem = eventItemsById.get(linha.eventItemId);
      if (!eventItem) {
        throw new BadRequestException('Um dos itens contados não pertence a este evento.');
      }

      // Volta ao estoque exatamente o que foi contado no galpão.
      await tx.item.update({
        where: { id: eventItem.itemId },
        data: { availableQuantity: { increment: linha.countedQuantity } },
      });

      await tx.eventItem.update({
        where: { id: eventItem.id },
        data: {
          shippedQuantity: eventItem.plannedQuantity,
          returnedQuantity: eventItem.returnedQuantity + linha.countedQuantity,
        },
      });
    }

    return tx.event.update({
      where: { id: eventId },
      data: { status: EventStatus.COMPLETED },
    });
  }
}
