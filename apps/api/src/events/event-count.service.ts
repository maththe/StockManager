import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DivergenceSource,
  DivergenceStatus,
  DivergenceType,
  EventStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';

export interface ContagemFinalItem {
  eventItemId: string;
  expectedQuantity: number;
  countedQuantity: number;
  notes?: string | null;
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
  async liquidarContagemFinal(
    eventId: string,
    contagem: ContagemFinalItem[],
    tenantUuid: string,
    tx: Prisma.TransactionClient,
    userId?: string,
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

    // Toda divergência já debitou totalQuantity ao ser registrada. As pendentes
    // são apagadas e substituídas por esta contagem, então o que elas debitaram
    // é creditado de volta. As resolvidas permanecem (já podem ter virado
    // manutenção), então não voltam ao total e são abatidas da nova perda para
    // a mesma unidade não ser cobrada duas vezes.
    const previousDivergenceItems = await tx.divergenceItem.findMany({
      where: {
        tenantUuid,
        sourceItemId: { in: event.eventItems.map((ei) => ei.id) },
        divergence: { source: DivergenceSource.EVENT, sourceId: eventId },
      },
      include: { divergence: { select: { status: true } } },
    });

    const pendingLossByEventItemId = new Map<string, number>();
    const resolvedLossByEventItemId = new Map<string, number>();
    for (const divergenceItem of previousDivergenceItems) {
      if (!divergenceItem.sourceItemId) continue;
      const alvo =
        divergenceItem.divergence.status === DivergenceStatus.RESOLVED
          ? resolvedLossByEventItemId
          : pendingLossByEventItemId;
      alvo.set(
        divergenceItem.sourceItemId,
        (alvo.get(divergenceItem.sourceItemId) ?? 0) + divergenceItem.quantity,
      );
    }

    const divergenceItemsToCreate: Omit<
      Prisma.DivergenceItemCreateManyInput,
      'divergenceId'
    >[] = [];

    for (const linha of contagem) {
      const eventItem = eventItemsById.get(linha.eventItemId);
      if (!eventItem) {
        throw new BadRequestException('Um dos itens contados não pertence a este evento.');
      }

      const counted = linha.countedQuantity;
      const pendingLoss = pendingLossByEventItemId.get(eventItem.id) ?? 0;
      const resolvedLoss = resolvedLossByEventItemId.get(eventItem.id) ?? 0;

      // O que já foi baixado numa divergência resolvida continua registrado lá:
      // não entra de novo na perda desta contagem.
      const faltando = Math.max(
        0,
        linha.expectedQuantity - counted - resolvedLoss,
      );

      // Volta ao estoque o que foi realmente contado; o que faltou sai do total.
      await tx.item.update({
        where: { id: eventItem.itemId },
        data: {
          availableQuantity: { increment: counted },
          totalQuantity: { increment: pendingLoss - faltando },
        },
      });

      await tx.eventItem.update({
        where: { id: eventItem.id },
        data: {
          shippedQuantity: eventItem.plannedQuantity,
          returnedQuantity: eventItem.returnedQuantity + counted,
        },
      });

      if (faltando > 0) {
        divergenceItemsToCreate.push({
          quantity: faltando,
          // A contagem do galpão só informa "não voltou". Se foi extravio ou
          // avaria é o admin quem classifica ao resolver a divergência.
          type: DivergenceType.MISSING,
          notes: linha.notes ?? 'Diferença apurada na contagem final. Classifique como falta ou avaria.',
          tenantUuid,
          itemId: eventItem.itemId,
          sourceItemId: eventItem.id,
        });
      }
    }

    // Divergências pendentes anteriores são substituídas pelo resultado da contagem
    await tx.divergence.deleteMany({
      where: {
        source: DivergenceSource.EVENT,
        sourceId: eventId,
        tenantUuid,
        status: DivergenceStatus.PENDING,
      },
    });

    if (divergenceItemsToCreate.length > 0) {
      const divergenceHeader = await tx.divergence.create({
        data: {
          source: DivergenceSource.EVENT,
          sourceId: eventId,
          tenantUuid,
          createdById: userId ?? null,
          notes: 'Gerada automaticamente pela contagem final do evento.',
        },
      });

      await tx.divergenceItem.createMany({
        data: divergenceItemsToCreate.map((divergenceItem) => ({
          ...divergenceItem,
          divergenceId: divergenceHeader.id,
        })),
      });
    }

    return tx.event.update({
      where: { id: eventId },
      data: { status: EventStatus.COMPLETED },
    });
  }
}
