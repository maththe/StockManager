import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}
  create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: createEventDto as any,
    });
  }

  findAll() {
    return this.prisma.event.findMany();
  }

  findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: { items: true }
    });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: updateEventDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
