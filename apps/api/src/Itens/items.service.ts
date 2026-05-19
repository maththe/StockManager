import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { PrismaService } from 'src/services/prisma.service';
import { Item } from '@prisma/client';

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

    this.validateStockQuantities(
      updateItemInput.totalQuantity ?? existing.totalQuantity,
      updateItemInput.availableQuantity ?? existing.availableQuantity,
    );
    this.validateUnitCost(updateItemInput.unitCost);

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
      data: updateItemInput,
    });
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
