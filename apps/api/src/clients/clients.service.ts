import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientInput: CreateClientInput): Promise<Client> {
    return this.prisma.client.create({
      data: {
        companyName: createClientInput.companyName,
        taxId: createClientInput.taxId,
        contactName: createClientInput.contactName,
      },
    });
  }

  async findAll(): Promise<Client[]> {
    return this.prisma.client.findMany({
      orderBy: { companyName: 'asc' },
    });
  }

  async findOne(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateClientInput: UpdateClientInput): Promise<Client> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientInput,
    });
  }

  async remove(id: string): Promise<Client> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.client.delete({
      where: { id },
    });
  }
}
