import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RentalStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';

export interface ContagemDevolucaoItem {
  rentalItemId: string;
  countedQuantity: number;
}

// Liquidação da contagem de devolução de uma locação.
//
// Mesmo desenho do EventCountService: quem dispara é a conclusão da tarefa de
// contagem (TasksService), e RentalsModule já depende de TasksModule — importar
// no sentido inverso criaria ciclo. Só depende do Prisma.
@Injectable()
export class RentalCountService {
  constructor(private readonly prisma: PrismaService) {}

  // Roda sempre dentro da transação de quem chama: mexe em estoque.
  //
  // Chega aqui só o que foi conferido: TasksService exige que a contagem bata
  // com o esperado (solicitado menos o que já virou divergência). O que não
  // voltou já saiu do acervo quando a divergência foi registrada.
  async liquidarDevolucao(
    rentalId: string,
    contagem: ContagemDevolucaoItem[],
    tenantUuid: string,
    tx: Prisma.TransactionClient,
  ) {
    const rental = await tx.rental.findFirst({
      where: { id: rentalId, tenantUuid },
      include: { rentalItems: true },
    });

    if (!rental) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException(
        'Apenas locações ativas podem ser devolvidas pela contagem.',
      );
    }

    const rentalItemsById = new Map(rental.rentalItems.map((ri) => [ri.id, ri]));

    for (const linha of contagem) {
      const rentalItem = rentalItemsById.get(linha.rentalItemId);
      if (!rentalItem) {
        throw new BadRequestException('Um dos itens contados não pertence a esta locação.');
      }

      // Volta ao estoque exatamente o que foi contado no galpão.
      await tx.item.update({
        where: { id: rentalItem.itemId },
        data: { availableQuantity: { increment: linha.countedQuantity } },
      });

      await tx.rentalItem.update({
        where: { id: rentalItem.id },
        data: {
          returnedQuantity: rentalItem.returnedQuantity + linha.countedQuantity,
        },
      });
    }

    return tx.rental.update({
      where: { id: rentalId },
      data: { status: RentalStatus.RETURNED, returnedAt: new Date() },
    });
  }
}
