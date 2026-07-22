import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DivergenceSource, Rental, RentalStatus, TaskStatus, TaskType } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { TasksService } from 'src/tasks/tasks.service';
import { nextSequentialCode } from 'src/common/code.util';
import { CreateRentalInput } from './dto/create-rental.input';
import { CreateRentalItemInput } from './dto/create-rental-item.input';
import { UpdateRentalInput } from './dto/update-rental.input';
import { UpdateRentalItemInput } from './dto/update-rental-item.input';

@Injectable()
export class RentalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) { }

  private parseRentalDates(startDate: string, expectedReturn: string) {
    const parsedStart = new Date(startDate);
    const parsedReturn = new Date(expectedReturn);

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedReturn.getTime())) {
      throw new BadRequestException('Datas da locação inválidas.');
    }

    if (parsedReturn < parsedStart) {
      throw new BadRequestException('A data de devolução deve ser maior ou igual à data inicial.');
    }

    return { parsedStart, parsedReturn };
  }

  private async generateRentalCode(tenantUuid: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LOC-${year}-`;

    const existing = await this.prisma.rental.findMany({
      where: { tenantUuid, rentalCode: { startsWith: prefix } },
      select: { rentalCode: true },
    });

    // Corrida entre requisições é coberta pelo retry de P2002 em create()
    return nextSequentialCode(prefix, existing.map((rental) => rental.rentalCode));
  }

  private normalizeQuantity(value: number | undefined, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} deve ser um número inteiro maior que zero.`);
    }

    return value;
  }

  private normalizeReturnedQuantity(value: number | undefined, fieldName: string): number {
    const quantity = value ?? 0;

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException(
        `${fieldName} deve ser um número inteiro maior ou igual a zero.`,
      );
    }

    return quantity;
  }

  private async ensureClientExists(clientId: string, tenantUuid: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantUuid } });

    if (!client) {
      throw new BadRequestException('Cliente não encontrado.');
    }

    return client;
  }

  async create(input: CreateRentalInput, tenantUuid: string): Promise<Rental> {
    const { parsedStart, parsedReturn } = this.parseRentalDates(
      input.startDate,
      input.expectedReturn,
    );
    await this.ensureClientExists(input.clientId, tenantUuid);

    const requestedStatus = input.status ?? RentalStatus.DRAFT;
    if (requestedStatus === RentalStatus.RETURNED || requestedStatus === RentalStatus.CANCELLED) {
      throw new BadRequestException(
        'Uma nova locação só pode iniciar como Rascunho ou Ativa.',
      );
    }

    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const rentalCode = await this.generateRentalCode(tenantUuid);

      try {
        return await this.prisma.rental.create({
          data: {
            rentalCode,
            startDate: parsedStart,
            expectedReturn: parsedReturn,
            location: input.location,
            notes: input.notes,
            status: requestedStatus,
            clientId: input.clientId,
            tenantUuid,
          },
          include: { client: true, rentalItems: { include: { item: true } } },
        });
      } catch (error: any) {
        if (error?.code === 'P2002' && attempt < maxAttempts) {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('Não foi possível gerar um código único para a locação. Tente novamente.');
  }

  async findAll(tenantUuid: string, search?: string) {
    const where: any = { tenantUuid };

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { rentalCode: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
        { client: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.rental.findMany({
      where,
      include: {
        client: true,
        rentalItems: { include: { item: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string, tenantUuid: string) {
    return this.prisma.rental.findFirst({
      where: { id, tenantUuid },
      include: {
        client: true,
        rentalItems: { include: { item: true }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async update(id: string, input: UpdateRentalInput, tenantUuid: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (existing.status === RentalStatus.CANCELLED || existing.status === RentalStatus.RETURNED) {
      throw new BadRequestException('Não é possível editar uma locação encerrada.');
    }

    if (input.clientId && input.clientId !== existing.clientId) {
      await this.ensureClientExists(input.clientId, tenantUuid);
    }

    const statusChanged = input.status !== undefined && input.status !== existing.status;

    if (
      statusChanged &&
      (input.status === RentalStatus.CANCELLED || input.status === RentalStatus.RETURNED)
    ) {
      throw new BadRequestException(
        'Use as ações de cancelar ou devolver para encerrar a locação.',
      );
    }

    const nextStartDate = input.startDate ?? existing.startDate.toISOString();
    const nextExpectedReturn = input.expectedReturn ?? existing.expectedReturn.toISOString();
    const { parsedStart, parsedReturn } = this.parseRentalDates(nextStartDate, nextExpectedReturn);
    return this.prisma.rental.update({
      where: { id },
      data: {
        startDate: input.startDate ? parsedStart : undefined,
        expectedReturn: input.expectedReturn ? parsedReturn : undefined,
        location: input.location,
        notes: input.notes,
        status: input.status,
        clientId: input.clientId,
      },
      include: { client: true, rentalItems: { include: { item: true } } },
    });
  }

  async remove(id: string, tenantUuid: string) {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (existing.rentalItems.length > 0) {
      throw new BadRequestException('Remova os itens da locação antes de excluí-la.');
    }

    return this.prisma.rental.delete({ where: { id }, include: { client: true } });
  }

  // Perdas registradas em divergências desta locação, por item da locação.
  // Essas unidades já saíram do estoque total e não voltam ao disponível.
  private async getRecordedLossByRentalItemId(
    rentalId: string,
    rentalItemIds: string[],
    tenantUuid: string,
  ) {
    const divergenceItems = await this.prisma.divergenceItem.findMany({
      where: {
        tenantUuid,
        sourceItemId: { in: rentalItemIds },
        divergence: { source: DivergenceSource.RENTAL, sourceId: rentalId },
      },
    });

    const lossByRentalItemId = new Map<string, number>();
    for (const divergenceItem of divergenceItems) {
      if (!divergenceItem.sourceItemId) continue;
      lossByRentalItemId.set(
        divergenceItem.sourceItemId,
        (lossByRentalItemId.get(divergenceItem.sourceItemId) ?? 0) + divergenceItem.quantity,
      );
    }

    return lossByRentalItemId;
  }

  async cancel(id: string, tenantUuid: string) {
    const rental = await this.findOne(id, tenantUuid);
    if (!rental) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (rental.status === RentalStatus.CANCELLED) {
      throw new BadRequestException('Esta locação já está cancelada.');
    }

    if (rental.status === RentalStatus.RETURNED) {
      throw new BadRequestException('Não é possível cancelar uma locação já devolvida.');
    }

    const lossByRentalItemId = await this.getRecordedLossByRentalItemId(
      id,
      rental.rentalItems.map((rentalItem) => rentalItem.id),
      tenantUuid,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { rentalId: id, tenantUuid, status: TaskStatus.PENDENTE },
        data: { status: TaskStatus.CANCELADA },
      });

      for (const rentalItem of rental.rentalItems) {
        const recordedLoss = lossByRentalItemId.get(rentalItem.id) ?? 0;
        const pendingReturn = Math.max(
          0,
          rentalItem.quantity - rentalItem.returnedQuantity - recordedLoss,
        );

        if (pendingReturn > 0) {
          await tx.item.update({
            where: { id: rentalItem.itemId },
            data: { availableQuantity: { increment: pendingReturn } },
          });
        }
      }

      return tx.rental.update({
        where: { id },
        data: { status: RentalStatus.CANCELLED },
        include: { client: true, rentalItems: { include: { item: true } } },
      });
    });
  }

  // Devolver uma locação não a fecha na hora: despacha uma tarefa de contagem
  // para o galpão, igual à conclusão de evento. O estoque só volta e a locação
  // só vira RETURNED quando essa tarefa é concluída
  // (RentalCountService.liquidarDevolucao).
  async solicitarDevolucao(id: string, tenantUuid: string, userId?: string) {
    const rental = await this.findOne(id, tenantUuid);
    if (!rental) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException(
        'Apenas locações ativas podem ir para a contagem de devolução.',
      );
    }

    // Igual aos eventos: a devolução só é despachada com o quadro de tarefas
    // limpo. Enquanto houver tarefa pendente não dá para saber o que saiu.
    const pendentes = await this.prisma.task.findMany({
      where: {
        rentalId: id,
        tenantUuid,
        status: TaskStatus.PENDENTE,
      },
      select: { id: true, code: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    const contagemPendente = pendentes.find(
      (task) => task.type === TaskType.ENTRADA_GALPAO,
    );

    if (contagemPendente) {
      throw new BadRequestException(
        `Já existe uma contagem de devolução pendente para esta locação (${contagemPendente.code}).`,
      );
    }

    if (pendentes.length > 0) {
      const codigos = pendentes.map((task) => task.code).join(', ');
      throw new BadRequestException(
        pendentes.length === 1
          ? `Existe uma tarefa pendente nesta locação (${codigos}). Conclua ou cancele a tarefa antes de enviar a contagem de devolução.`
          : `Existem tarefas pendentes nesta locação (${codigos}). Conclua ou cancele as tarefas antes de enviar a contagem de devolução.`,
      );
    }

    // Igual aos eventos: o solicitado é o que ainda não voltou. Perdas já
    // registradas em divergência não são abatidas aqui — é a divergência que
    // reduz a quantidade esperada na hora de confirmar a tarefa.
    const itensParaContar = rental.rentalItems
      .map((rentalItem) => ({
        rentalItemId: rentalItem.id,
        requestedQuantity: rentalItem.quantity - rentalItem.returnedQuantity,
      }))
      .filter((item) => item.requestedQuantity > 0);

    return this.prisma.$transaction(async (tx) => {
      // Tudo já voltou (ou nada saiu): não há o que o galpão conferir.
      if (itensParaContar.length === 0) {
        const returned = await tx.rental.update({
          where: { id },
          data: { status: RentalStatus.RETURNED, returnedAt: new Date() },
          include: { client: true, rentalItems: { include: { item: true } } },
        });
        return { rental: returned, task: null };
      }

      const task = await this.tasksService.createEntradaGalpaoTaskForRental(
        id,
        itensParaContar,
        tenantUuid,
        userId,
        tx,
        {
          notes:
            'Contagem de devolução da locação. Registre a quantidade que realmente voltou ao galpão.',
        },
      );

      return { rental, task };
    });
  }

  async gerarTarefaGalpao(id: string, tenantUuid: string, userId?: string) {
    const rental = await this.findOne(id, tenantUuid);
    if (!rental) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (rental.status === RentalStatus.CANCELLED || rental.status === RentalStatus.RETURNED) {
      throw new BadRequestException(
        'Não é possível gerar tarefa de galpão para uma locação encerrada.',
      );
    }

    if (rental.rentalItems.length === 0) {
      throw new BadRequestException(
        'Adicione ao menos um item à locação antes de gerar a tarefa de galpão.',
      );
    }

    const pendingTask = await this.prisma.task.findFirst({
      where: {
        rentalId: id,
        tenantUuid,
        type: TaskType.SAIDA_GALPAO,
        status: TaskStatus.PENDENTE,
      },
    });

    if (pendingTask) {
      throw new BadRequestException(
        'Já existe uma tarefa de saída do galpão pendente para esta locação.',
      );
    }

    return this.tasksService.createSaidaGalpaoTaskForRental(
      id,
      rental.rentalItems.map((rentalItem) => ({
        rentalItemId: rentalItem.id,
        requestedQuantity: rentalItem.quantity,
      })),
      tenantUuid,
      userId,
    );
  }

  async addItem(rentalId: string, input: CreateRentalItemInput, tenantUuid: string) {
    const quantity = this.normalizeQuantity(input.quantity, 'Quantidade');

    const rental = await this.findOne(rentalId, tenantUuid);
    if (!rental) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (rental.status === "CANCELLED" || rental.status === "RETURNED") {
      throw new BadRequestException('Não é possível alterar itens de uma locação encerrada.');
    }

    const item = await this.prisma.item.findFirst({ where: { id: input.itemId, tenantUuid } });
    if (!item) {
      throw new NotFoundException('Item não encontrado.');
    }

    if (item.availableQuantity < quantity) {
      throw new BadRequestException('Estoque insuficiente para o item selecionado.');
    }

    const existing = await this.prisma.rentalItem.findFirst({
      where: { rentalId, itemId: input.itemId, tenantUuid },
    });
    if (existing) {
      throw new BadRequestException('Este item já foi adicionado à locação.');
    }

    return this.prisma.$transaction(async (tx) => {
      const reserved = await tx.item.updateMany({
        where: { id: item.id, tenantUuid, availableQuantity: { gte: quantity } },
        data: { availableQuantity: { decrement: quantity } },
      });

      if (reserved.count !== 1) {
        throw new BadRequestException('Estoque insuficiente para o item selecionado.');
      }

      return tx.rentalItem.create({
        data: { rentalId, itemId: input.itemId, quantity, tenantUuid },
        include: { item: true },
      });
    });
  }

  async updateItem(
    rentalId: string,
    rentalItemId: string,
    input: UpdateRentalItemInput,
    tenantUuid: string,
  ) {
    const rentalItem = await this.prisma.rentalItem.findFirst({
      where: { id: rentalItemId, rentalId, tenantUuid },
      include: { item: true, rental: true },
    });

    if (!rentalItem) {
      throw new NotFoundException('Item da locação não encontrado.');
    }

    if (rentalItem.rental.status === "CANCELLED" || rentalItem.rental.status === "RETURNED") {
      throw new BadRequestException('Não é possível alterar itens de uma locação encerrada.');
    }

    const nextQuantity =
      input.quantity === undefined
        ? rentalItem.quantity
        : this.normalizeQuantity(input.quantity, 'Quantidade');
    const nextReturnedQuantity =
      input.returnedQuantity === undefined
        ? rentalItem.returnedQuantity
        : this.normalizeReturnedQuantity(input.returnedQuantity, 'Quantidade devolvida');

    if (nextReturnedQuantity > nextQuantity) {
      throw new BadRequestException(
        'Quantidade devolvida deve ficar entre zero e a quantidade locada.',
      );
    }

    const rentedDelta = nextQuantity - rentalItem.quantity;
    const returnedDelta = nextReturnedQuantity - rentalItem.returnedQuantity;
    const stockDelta = returnedDelta - rentedDelta;

    if (stockDelta < 0 && rentalItem.item.availableQuantity < Math.abs(stockDelta)) {
      throw new BadRequestException('Estoque insuficiente para aumentar a quantidade locada.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (stockDelta !== 0) {
        if (stockDelta > 0) {
          await tx.item.update({
            where: { id: rentalItem.itemId },
            data: { availableQuantity: { increment: stockDelta } },
          });
        } else {
          const reserved = await tx.item.updateMany({
            where: { id: rentalItem.itemId, tenantUuid, availableQuantity: { gte: Math.abs(stockDelta) } },
            data: { availableQuantity: { decrement: Math.abs(stockDelta) } },
          });

          if (reserved.count !== 1) {
            throw new BadRequestException('Estoque insuficiente para aumentar a quantidade locada.');
          }
        }
      }

      return tx.rentalItem.update({
        where: { id: rentalItemId },
        data: { quantity: input.quantity, returnedQuantity: input.returnedQuantity },
        include: { item: true },
      });
    });
  }

  async removeItem(rentalId: string, rentalItemId: string, tenantUuid: string) {
    const rentalItem = await this.prisma.rentalItem.findFirst({
      where: { id: rentalItemId, rentalId, tenantUuid },
      include: { rental: true },
    });

    if (!rentalItem) {
      throw new NotFoundException('Item da locação não encontrado.');
    }

    if (rentalItem.rental.status === "CANCELLED" || rentalItem.rental.status === "RETURNED") {
      throw new BadRequestException('Não é possível remover itens de uma locação encerrada.');
    }

    // Divergências já debitaram o estoque total; apagar o item junto corromperia a contagem
    const divergenceCount = await this.prisma.divergenceItem.count({
      where: { sourceItemId: rentalItem.id, tenantUuid },
    });

    if (divergenceCount > 0) {
      throw new BadRequestException(
        'Este item possui divergências registradas. Trate-as antes de removê-lo da locação.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id: rentalItem.itemId },
        data: {
          availableQuantity: { increment: rentalItem.quantity - rentalItem.returnedQuantity },
        },
      });

      return tx.rentalItem.delete({ where: { id: rentalItem.id } });
    });
  }
}
