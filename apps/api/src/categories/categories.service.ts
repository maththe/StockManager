import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { PrismaService } from 'src/services/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryInput: CreateCategoryInput, tenantUuid: string): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: createCategoryInput.name,
        description: createCategoryInput.description,
        tenantUuid,
      },
    });
  }

  async findAll(tenantUuid: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { tenantUuid },
    });
  }

  async findOne(id: string, tenantUuid: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        id,
        tenantUuid,
      },
    });
  }

  async update(
    id: string,
    updateCategoryInput: UpdateCategoryInput,
    tenantUuid: string,
  ): Promise<Category> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryInput,
    });
  }

  async remove(id: string, tenantUuid: string): Promise<Category> {
    const existing = await this.findOne(id, tenantUuid);
    if (!existing) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
