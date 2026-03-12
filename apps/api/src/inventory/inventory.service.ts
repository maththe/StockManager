import { Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}
  create(createInventoryDto: CreateInventoryDto) {
    return this.prisma.inventory.create({
      data: createInventoryDto as any,
    });
  }

  findAll() {
    return this.prisma.inventory.findMany();
  }

  findOne(id: string) {
    return this.prisma.inventory.findUnique({
      where: { id },
      include: { events: true }
    });
  }

  update(id: string, updateInventoryDto: UpdateInventoryDto) {
    return this.prisma.inventory.update({
      where: { id },
      data: updateInventoryDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.inventory.delete({
      where: { id },
    });
  }
}
