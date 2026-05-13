import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Rental, RentalStatus } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { CreateRentalInput } from './dto/create-rental.input';
import { CreateRentalItemInput } from './dto/create-rental-item.input';
import { UpdateRentalInput } from './dto/update-rental.input';
import { UpdateRentalItemInput } from './dto/update-rental-item.input';

@Injectable()
export class RentalsService {
  constructor(private readonly prisma: PrismaService) { }

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

  private async ensureClientExists(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });

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
    await this.ensureClientExists(input.clientId);

    return this.prisma.rental.create({
      data: {
        rentalCode: input.rentalCode,
        startDate: parsedStart,
        expectedReturn: parsedReturn,
        location: input.location,
        notes: input.notes,
        status: input.status ?? RentalStatus.DRAFT,
        clientId: input.clientId,
        tenantUuid,
      },
      include: { client: true, rentalItems: { include: { item: true } } },
    });
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

    if (input.clientId && input.clientId !== existing.clientId) {
      await this.ensureClientExists(input.clientId);
    }

    if (
      input.status &&
      input.status !== existing.status &&
      input.status === "CANCELLED" || input.status === "RETURNED"
    ) {
      throw new BadRequestException(
        'Use as ações de cancelar ou devolver para encerrar a locação.',
      );
    }

    if (
      input.status &&
      input.status !== existing.status &&
      existing.status === "CANCELLED" || existing.status === "RETURNED"
    ) {
      throw new BadRequestException('Não é possível reabrir uma locação encerrada.');
    }

    const nextStartDate = input.startDate ?? existing.startDate.toISOString();
    const nextExpectedReturn = input.expectedReturn ?? existing.expectedReturn.toISOString();
    const { parsedStart, parsedReturn } = this.parseRentalDates(nextStartDate, nextExpectedReturn);
    const returnedAt =
      input.returnedAt === null ? null : input.returnedAt ? new Date(input.returnedAt) : undefined;

    if (returnedAt && Number.isNaN(returnedAt.getTime())) {
      throw new BadRequestException('Data de devolução efetiva inválida.');
    }

    return this.prisma.rental.update({
      where: { id },
      data: {
        rentalCode: input.rentalCode,
        startDate: input.startDate ? parsedStart : undefined,
        expectedReturn: input.expectedReturn ? parsedReturn : undefined,
        returnedAt,
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

    return this.prisma.$transaction(async (tx) => {
      for (const rentalItem of rental.rentalItems) {
        await tx.item.update({
          where: { id: rentalItem.itemId },
          data: {
            availableQuantity: { increment: rentalItem.quantity - rentalItem.returnedQuantity },
          },
        });
      }

      return tx.rental.update({
        where: { id },
        data: { status: RentalStatus.CANCELLED },
        include: { client: true, rentalItems: { include: { item: true } } },
      });
    });
  }

  async markReturned(id: string, tenantUuid: string) {
    const rental = await this.findOne(id, tenantUuid);
    if (!rental) {
      throw new NotFoundException('Locação não encontrada.');
    }

    if (rental.status === RentalStatus.RETURNED) {
      throw new BadRequestException('Esta locação já foi devolvida.');
    }

    if (rental.status === RentalStatus.CANCELLED) {
      throw new BadRequestException('Não é possível devolver uma locação cancelada.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const rentalItem of rental.rentalItems) {
        const pendingReturn = rentalItem.quantity - rentalItem.returnedQuantity;
        if (pendingReturn > 0) {
          await tx.item.update({
            where: { id: rentalItem.itemId },
            data: { availableQuantity: { increment: pendingReturn } },
          });
          await tx.rentalItem.update({
            where: { id: rentalItem.id },
            data: { returnedQuantity: rentalItem.quantity },
          });
        }
      }

      return tx.rental.update({
        where: { id },
        data: { status: RentalStatus.RETURNED, returnedAt: new Date() },
        include: { client: true, rentalItems: { include: { item: true } } },
      });
    });
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
      await tx.item.update({
        where: { id: item.id },
        data: { availableQuantity: { decrement: quantity } },
      });

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
        await tx.item.update({
          where: { id: rentalItem.itemId },
          data: {
            availableQuantity:
              stockDelta > 0 ? { increment: stockDelta } : { decrement: Math.abs(stockDelta) },
          },
        });
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
