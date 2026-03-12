import { Injectable } from '@nestjs/common';
import { CreateEventItemDto } from './dto/create-event-item.dto';
import { UpdateEventItemDto } from './dto/update-event-item.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventItemsService {
  constructor(private prisma: PrismaService) {}
  create(createEventItemDto: CreateEventItemDto) {
    return this.prisma.eventItem.create({
      data: createEventItemDto as any,
    });
  }

  findAll() {
    return this.prisma.eventItem.findMany();
  }

  findOne(id: string) {
    return this.prisma.eventItem.findUnique({
      where: { id },
    });
  }

  update(id: string, updateEventItemDto: UpdateEventItemDto) {
    return this.prisma.eventItem.update({
      where: { id },
      data: updateEventItemDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.eventItem.delete({
      where: { id },
    });
  }
}
