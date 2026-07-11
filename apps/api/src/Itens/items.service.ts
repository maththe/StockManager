import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { PrismaService } from 'src/services/prisma.service';
import {
  DivergenceSource,
  EventStatus,
  Item,
  MaintenanceStatus,
  RentalStatus,
} from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateStockQuantities(totalQuantity: number | undefined, availableQuantity: number | undefined) {
    if (totalQuantity !== undefined && (!Number.isInteger(totalQuantity) || totalQuantity < 0)) {
      throw new BadRequestException('Quantidade total deve ser um inteiro maior ou igual a zero.');
    }

    if (availableQuantity !== undefined && (!Number.isInteger(availableQuantity) || availableQuantity < 0)) {
      throw new BadRequestException('Quantidade disponível deve ser um inteiro maior ou igual a zero.');
    }

    if (
      totalQuantity !== undefined &&
      availableQuantity !== undefined &&
      availableQuantity > totalQuantity
    ) {
      throw new BadRequestException('Quantidade disponível não pode ser maior que a quantidade total.');
    }
  }

  private validateUnitCost(unitCost: number | undefined) {
    if (unitCost !== undefined && unitCost < 0) {
      throw new BadRequestException('Custo unitário deve ser maior ou igual a zero.');
    }
  }

  async create(createItemInput: CreateItemInput, tenantUuid: string): Promise<Item> {
    this.validateStockQuantities(createItemInput.totalQuantity, createItemInput.availableQuantity);
    this.validateUnitCost(createItemInput.unitCost);

    // Verificar se a categoria existe e pertence ao tenant
    const category = await this.prisma.category.findFirst({
      where: {
        id: createItemInput.categoryId,
        tenantUuid,
      },
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada ou sem permissão.');
    }

    return this.prisma.item.create({
      data: {
        name: createItemInput.name,
        totalQuantity: createItemInput.totalQuantity,
        availableQuantity: createItemInput.availableQuantity,
        unitCost: createItemInput.unitCost,
        categoryId: createItemInput.categoryId,
        imageUrl: createItemInput.imageUrl,
        tenantUuid,
      },
    });
  }

  async findAll(tenantUuid: string, search?: string): Promise<Item[]> {
    const where: any = { tenantUuid };

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.item.findMany({
      where,
      include: { category: true },
    });
  }

  async findOne(id: string, tenantUuid: string): Promise<Item | null> {
    return this.prisma.item.findFirst({
      where: {
        id,
        tenantUuid,
      },
      include: { category: true },
    });
  }

  async update(
    id: string,
    updateItemInput: UpdateItemInput,
    tenantUuid: string,
  ): Promise<Item> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Item não encontrado.');
    }

    const nextTotalQuantity = updateItemInput.totalQuantity ?? existing.totalQuantity;
    const nextAvailableQuantity =
      updateItemInput.availableQuantity ?? existing.availableQuantity;

    this.validateStockQuantities(nextTotalQuantity, nextAvailableQuantity);
    this.validateUnitCost(updateItemInput.unitCost);

    if (
      updateItemInput.totalQuantity !== undefined ||
      updateItemInput.availableQuantity !== undefined
    ) {
      const reservedQuantity = await this.getReservedQuantity(id, tenantUuid);

      if (nextAvailableQuantity + reservedQuantity > nextTotalQuantity) {
        throw new BadRequestException(
          `Há ${reservedQuantity} unidade(s) reservadas em eventos, locações ou manutenções. ` +
            `Com quantidade total de ${nextTotalQuantity}, a disponível não pode passar de ` +
            `${Math.max(0, nextTotalQuantity - reservedQuantity)}.`,
        );
      }
    }

    // Se está tentando mudar de categoria, verificar se a nova existe
    if (updateItemInput.categoryId && updateItemInput.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateItemInput.categoryId,
          tenantUuid,
        },
      });

      if (!category) {
        throw new BadRequestException('Categoria não encontrada ou sem permissão.');
      }
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        name: updateItemInput.name,
        totalQuantity: updateItemInput.totalQuantity,
        availableQuantity: updateItemInput.availableQuantity,
        unitCost: updateItemInput.unitCost,
        categoryId: updateItemInput.categoryId,
        imageUrl: updateItemInput.imageUrl,
      },
    });
  }

  // Unidades comprometidas em eventos/locações ativos e manutenções manuais em aberto.
  // Garante o invariante: disponível + reservado <= total.
  private async getReservedQuantity(itemId: string, tenantUuid: string): Promise<number> {
    const [eventItems, rentalItems, maintenanceSum] = await Promise.all([
      this.prisma.eventItem.findMany({
        where: {
          itemId,
          tenantUuid,
          event: { status: { in: [EventStatus.PLANNING, EventStatus.IN_PROGRESS] } },
        },
        select: { id: true, plannedQuantity: true, returnedQuantity: true },
      }),
      this.prisma.rentalItem.findMany({
        where: {
          itemId,
          tenantUuid,
          rental: { status: { in: [RentalStatus.DRAFT, RentalStatus.ACTIVE] } },
        },
        select: { quantity: true, returnedQuantity: true },
      }),
      this.prisma.maintenance.aggregate({
        _sum: { quantity: true },
        where: {
          itemId,
          tenantUuid,
          // Manutenções vindas de divergência já saíram do estoque total
          divergenceId: null,
          status: { in: [MaintenanceStatus.PENDENTE, MaintenanceStatus.EM_ANDAMENTO] },
        },
      }),
    ]);

    // Perdas registradas em divergência já foram debitadas do total e não contam como reserva
    const writeOffSum = eventItems.length
      ? await this.prisma.divergenceItem.aggregate({
          _sum: { quantity: true },
          where: {
            tenantUuid,
            itemId,
            sourceItemId: { in: eventItems.map((eventItem) => eventItem.id) },
            divergence: { source: DivergenceSource.EVENT },
          },
        })
      : null;

    const reservedInEvents =
      eventItems.reduce(
        (sum, eventItem) => sum + eventItem.plannedQuantity - eventItem.returnedQuantity,
        0,
      ) - (writeOffSum?._sum.quantity ?? 0);
    const reservedInRentals = rentalItems.reduce(
      (sum, rentalItem) => sum + rentalItem.quantity - rentalItem.returnedQuantity,
      0,
    );

    return (
      Math.max(0, reservedInEvents) +
      reservedInRentals +
      (maintenanceSum._sum.quantity ?? 0)
    );
  }

  async remove(id: string, tenantUuid: string): Promise<Item> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Item não encontrado.');
    }

    return this.prisma.item.delete({
      where: { id },
    });
  }
}
